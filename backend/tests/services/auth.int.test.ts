// Authentication end to end (real Postgres and real Redis; only the email sender is replaced)

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { emailMock } = vi.hoisted(() => ({
  emailMock: { sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn() },
}));
vi.mock('@/services/email', () => ({ emailService: emailMock }));

import authService from '@/services/auth.service';
import cacheService from '@/services/cache.service';
import prisma from '@/database';
import { config } from '@/config';

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const GOOD_PASSWORD = 'Str0ng-Passw0rd!';

describe('Authentication (real database and cache)', () => {
  const emails: string[] = [];
  const emailFor = (label: string) => {
    const email = `auth-${label}-${unique()}@example.com`;
    emails.push(email);
    return email;
  };

  const register = (overrides: Record<string, unknown> = {}) =>
    authService.register({ email: emailFor('user'), password: GOOD_PASSWORD, firstName: 'Ann', lastName: 'Auth', ...overrides } as never);

  /** A user who can log in straight away. */
  const newUser = async (overrides: Record<string, unknown> = {}) => {
    const email = emailFor('login');
    const user = await prisma.user.create({
      data: {
        email, firstName: 'Lou', lastName: 'Login', role: 'CUSTOMER', isActive: true, isEmailVerified: true,
        password: await bcrypt.hash(GOOD_PASSWORD, 4), ...overrides,
      },
    });
    return { ...user, email };
  };

  // true = accounts must verify their email (the production rule); false = skip it (the dev shortcut)
  const requireVerification = (on: boolean) => {
    config.development.skipEmailVerification = !on;
  };
  const originalSkip = config.development.skipEmailVerification;

  beforeAll(async () => {
    await cacheService.connect();
    await vi.waitFor(() => expect(cacheService.isReady()).toBe(true));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    requireVerification(true); // most tests want the real, production email verification rules
  });

  afterEach(() => {
    vi.restoreAllMocks(); // never let a spy from a failed test leak into the next one
    config.development.skipEmailVerification = originalSkip;
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
    await prisma.booking.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } }); // sessions and preferences cascade
    await cacheService.disconnect();
  });

  /** The token the (mocked) email would have carried. */
  const lastVerificationToken = () => emailMock.sendVerificationEmail.mock.calls.at(-1)![1] as string;
  const lastResetToken = () => emailMock.sendPasswordResetEmail.mock.calls.at(-1)![1] as string;

  describe('register', () => {
    it('creates a customer with a hashed password and default preferences, and returns no secrets', async () => {
      const { user, message } = await register({ firstName: 'Ann' });

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, include: { preferences: true } });
      expect(stored).toMatchObject({ role: 'CUSTOMER', isActive: true, isEmailVerified: false, firstName: 'Ann' });
      expect(stored.password).not.toBe(GOOD_PASSWORD);
      expect(await bcrypt.compare(GOOD_PASSWORD, stored.password)).toBe(true);
      expect(stored.preferences).toMatchObject({ theme: 'light', language: 'en' });
      expect(user).not.toHaveProperty('password');
      expect(message).toMatch(/check your email/i);
    });

    it('always creates a customer, even if a higher role is asked for', async () => {
      const { user } = await register({ role: 'ADMIN' });

      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).role).toBe('CUSTOMER');
    });

    it('emails a verification link whose token is really stored', async () => {
      const { user } = await register();

      expect(emailMock.sendVerificationEmail).toHaveBeenCalledWith(user.email, expect.stringMatching(/^[0-9a-f]{64}$/), 'Ann');
      expect(await cacheService.get(`email_verification:${lastVerificationToken()}`)).toBe(user.id);
    });

    it('verifies the account straight away when verification is switched off', async () => {
      requireVerification(false);

      const { user, message } = await register();

      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).isEmailVerified).toBe(true);
      expect(emailMock.sendVerificationEmail).not.toHaveBeenCalled();
      expect(message).toBe('Registration successful');
    });

    it('still registers if the verification email cannot be sent', async () => {
      emailMock.sendVerificationEmail.mockRejectedValueOnce(new Error('smtp down'));

      await expect(register()).resolves.toMatchObject({ user: { id: expect.any(String) } });
    });

    it('refuses a second account for the same email', async () => {
      const email = emailFor('dup');
      await register({ email });

      await expect(register({ email })).rejects.toMatchObject({ statusCode: 409 });
    });

    it('refuses a password that is too short, and creates nothing', async () => {
      const email = emailFor('weak');

      await expect(register({ email, password: 'short' })).rejects.toMatchObject({ statusCode: 400, validationErrors: [{ code: 'PASSWORD_TOO_SHORT' }] });
      expect(await prisma.user.count({ where: { email } })).toBe(0);
    });

    it('refuses to register when it could not store the verification token, rather than send a dead link', async () => {
      const notReady = vi.spyOn(cacheService, 'isReady').mockReturnValue(false);
      const email = emailFor('nocache');

      await expect(register({ email })).rejects.toMatchObject({ statusCode: 503 });

      expect(await prisma.user.count({ where: { email } })).toBe(0);
      expect(emailMock.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns working tokens for the right password and records the login', async () => {
      const user = await newUser();

      const result = await authService.login({ email: user.email, password: GOOD_PASSWORD });

      const access = jwt.verify(result.tokens.accessToken, config.jwt.secret) as { userId: string; role: string };
      const refresh = jwt.verify(result.tokens.refreshToken, config.jwt.refreshSecret) as { userId: string };
      expect(access).toMatchObject({ userId: user.id, role: 'CUSTOMER' });
      expect(refresh.userId).toBe(user.id);
      expect(result.tokens.expiresIn).toBeGreaterThan(0);
      expect(result.user).not.toHaveProperty('password');
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).lastLoginAt).toBeInstanceOf(Date);
      expect(await prisma.userSession.count({ where: { userId: user.id, refreshToken: result.tokens.refreshToken } })).toBe(1);
    });

    it('signs access and refresh tokens with different secrets', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });

      expect(() => jwt.verify(tokens.accessToken, config.jwt.refreshSecret)).toThrow();
      expect(() => jwt.verify(tokens.refreshToken, config.jwt.secret)).toThrow();
    });

    it('gives the same refusal for a wrong password and an unknown email', async () => {
      const user = await newUser();

      const wrongPassword = await authService.login({ email: user.email, password: 'Wrong-Passw0rd!' }).catch((e) => e);
      const unknownEmail = await authService.login({ email: emailFor('ghost'), password: GOOD_PASSWORD }).catch((e) => e);

      expect(wrongPassword).toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
      expect(unknownEmail).toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
    });

    it('does the same password work for an unknown email as for a real one (so timing does not give accounts away)', async () => {
      const compare = vi.spyOn(bcrypt, 'compare');
      const user = await newUser();

      await authService.login({ email: emailFor('ghost'), password: GOOD_PASSWORD }).catch(() => undefined);
      const callsForUnknown = compare.mock.calls.length;
      await authService.login({ email: user.email, password: 'Wrong-Passw0rd!' }).catch(() => undefined);
      const callsForWrong = compare.mock.calls.length - callsForUnknown;

      expect(callsForUnknown).toBe(1);
      expect(callsForWrong).toBe(1);
      });

    it('refuses an inactive account, and an unverified one while verification is required', async () => {
      const inactive = await newUser({ isActive: false });
      const unverified = await newUser({ isEmailVerified: false });

      await expect(authService.login({ email: inactive.email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401, message: 'Account is inactive' });
      await expect(authService.login({ email: unverified.email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401, message: expect.stringMatching(/verify/i) });
    });

    it('lets an unverified account in when verification is switched off', async () => {
      requireVerification(false);
      const unverified = await newUser({ isEmailVerified: false });

      await expect(authService.login({ email: unverified.email, password: GOOD_PASSWORD })).resolves.toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('swaps a refresh token for new tokens, and the old one stops working', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });

      const refreshed = await authService.refreshToken(tokens.refreshToken);

      expect(refreshed.tokens.refreshToken).not.toBe(tokens.refreshToken);
      await expect(authService.refreshToken(tokens.refreshToken)).rejects.toMatchObject({ statusCode: 401 }); // reuse is refused
      await expect(authService.refreshToken(refreshed.tokens.refreshToken)).resolves.toBeDefined(); // the new one works
    });

    it('works straight after login, even within the same second', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });

      const refreshed = await authService.refreshToken(tokens.refreshToken);

      expect(await prisma.userSession.count({ where: { refreshToken: refreshed.tokens.refreshToken } })).toBe(1); // the new session survived
    });

    it('keeps issuing different refresh tokens for the same user in the same second', async () => {
      const user = await newUser();

      const tokens = await Promise.all(Array.from({ length: 5 }, () => authService.login({ email: user.email, password: GOOD_PASSWORD })));

      expect(new Set(tokens.map((t) => t.tokens.refreshToken)).size).toBe(5);
    });

    it.each([
      ['garbage', 'not-a-token'],
      ['empty', ''],
    ])('refuses %s', async (_label, token) => {
      await expect(authService.refreshToken(token)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('refuses a refresh token signed with the wrong secret, or an access token', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });
      const forged = jwt.sign({ userId: user.id, email: user.email, role: 'ADMIN' }, 'some-other-secret');

      await expect(authService.refreshToken(forged)).rejects.toMatchObject({ statusCode: 401 });
      await expect(authService.refreshToken(tokens.accessToken)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('refuses a valid-looking token that has no stored session (e.g. after logout)', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });
      await authService.logout(tokens.refreshToken);

      await expect(authService.refreshToken(tokens.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('refuses an account that was deactivated after logging in', async () => {
      const user = await newUser();
      const { tokens } = await authService.login({ email: user.email, password: GOOD_PASSWORD });
      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

      await expect(authService.refreshToken(tokens.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('ends one session and leaves the user\'s others alone', async () => {
      const user = await newUser();
      const phone = await authService.login({ email: user.email, password: GOOD_PASSWORD });
      const laptop = await authService.login({ email: user.email, password: GOOD_PASSWORD });

      await authService.logout(phone.tokens.refreshToken);

      expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(1);
      await expect(authService.refreshToken(laptop.tokens.refreshToken)).resolves.toBeDefined();
    });

    it('logoutAll ends every session of that user only', async () => {
      const user = await newUser();
      const other = await newUser();
      await authService.login({ email: user.email, password: GOOD_PASSWORD });
      await authService.login({ email: user.email, password: GOOD_PASSWORD });
      await authService.login({ email: other.email, password: GOOD_PASSWORD });

      await authService.logoutAll(user.id);

      expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(0);
      expect(await prisma.userSession.count({ where: { userId: other.id } })).toBe(1);
    });

    it('is harmless to log out twice or with an unknown token', async () => {
      await expect(authService.logout('never-issued')).resolves.toBeUndefined();
    });
  });

  describe('email verification', () => {
    it('verifies the account once, and the link cannot be used again', async () => {
      const { user } = await register();
      const token = lastVerificationToken();

      await expect(authService.verifyEmail(token)).resolves.toEqual({ message: 'Email verified successfully' });

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.isEmailVerified).toBe(true);
      expect(stored.emailVerifiedAt).toBeInstanceOf(Date);
      await expect(authService.verifyEmail(token)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('lets the new user log in once verified', async () => {
      const email = emailFor('flow');
      await register({ email });
      await expect(authService.login({ email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401 });

      await authService.verifyEmail(lastVerificationToken());

      await expect(authService.login({ email, password: GOOD_PASSWORD })).resolves.toBeDefined();
    });

    it.each(['not-a-token', '', 'a'.repeat(64)])('refuses an unknown or empty token (%j)', async (token) => {
      await expect(authService.verifyEmail(token)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('rejects a token that expired', async () => {
      const { user } = await register();
      const token = lastVerificationToken();
      await cacheService.delete(`email_verification:${token}`); // what expiry does

      await expect(authService.verifyEmail(token)).rejects.toMatchObject({ statusCode: 401 });
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).isEmailVerified).toBe(false);
    });

    it('does not take a reset token for a verification token', async () => {
      const user = await newUser();
      await authService.requestPasswordReset(user.email);

      await expect(authService.verifyEmail(lastResetToken())).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('resendVerificationEmail', () => {
    it('sends a fresh working link to an unverified account', async () => {
      const user = await newUser({ isEmailVerified: false });

      await authService.resendVerificationEmail(user.email);

      expect(await cacheService.get(`email_verification:${lastVerificationToken()}`)).toBe(user.id);
    });

    it('gives the same answer for unknown, already-verified and unverified accounts, so it cannot reveal who has one', async () => {
      const verified = await newUser();
      const unverified = await newUser({ isEmailVerified: false });

      const answers = await Promise.all([
        authService.resendVerificationEmail(emailFor('ghost')),
        authService.resendVerificationEmail(verified.email),
        authService.resendVerificationEmail(unverified.email),
      ]);

      expect(new Set(answers.map((a) => a.message)).size).toBe(1);
      expect(emailMock.sendVerificationEmail).toHaveBeenCalledTimes(1); // only the unverified one got mail
    });

    it('refuses when it could not store the token', async () => {
      const unverified = await newUser({ isEmailVerified: false });
      const notReady = vi.spyOn(cacheService, 'isReady').mockReturnValue(false);

      await expect(authService.resendVerificationEmail(unverified.email)).rejects.toMatchObject({ statusCode: 503 });
    });
  });

  describe('password reset', () => {
    it('lets the owner choose a new password with the emailed link, then ends all sessions', async () => {
      const user = await newUser();
      await authService.login({ email: user.email, password: GOOD_PASSWORD });
      await authService.requestPasswordReset(user.email);
      const token = lastResetToken();

      await expect(authService.resetPassword({ token, newPassword: 'Brand-New-Passw0rd!' })).resolves.toEqual({ message: 'Password reset successfully' });

      await expect(authService.login({ email: user.email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401 }); // old one is dead
      await expect(authService.login({ email: user.email, password: 'Brand-New-Passw0rd!' })).resolves.toBeDefined();
      // every session from before the reset was ended (only the login just above exists)
      expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(1);
    });

    it('can be used only once', async () => {
      const user = await newUser();
      await authService.requestPasswordReset(user.email);
      const token = lastResetToken();
      await authService.resetPassword({ token, newPassword: 'Brand-New-Passw0rd!' });

      await expect(authService.resetPassword({ token, newPassword: 'Another-Passw0rd!1' })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('answers the same for an unknown email as for a real one, and sends nothing to the unknown one', async () => {
      const user = await newUser();

      const known = await authService.requestPasswordReset(user.email);
      const unknown = await authService.requestPasswordReset(emailFor('ghost'));

      expect(known).toEqual(unknown);
      expect(emailMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it('still answers normally if the email cannot be sent', async () => {
      const user = await newUser();
      emailMock.sendPasswordResetEmail.mockRejectedValueOnce(new Error('smtp down'));

      await expect(authService.requestPasswordReset(user.email)).resolves.toMatchObject({ message: expect.any(String) });
    });

    it('refuses to issue a link it could not store', async () => {
      const user = await newUser();
      const notReady = vi.spyOn(cacheService, 'isReady').mockReturnValue(false);

      await expect(authService.requestPasswordReset(user.email)).rejects.toMatchObject({ statusCode: 503 });
      expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('keeps the link usable after a too-weak password is rejected', async () => {
      const user = await newUser();
      await authService.requestPasswordReset(user.email);
      const token = lastResetToken();

      await expect(authService.resetPassword({ token, newPassword: 'short' })).rejects.toMatchObject({ statusCode: 400 });

      await expect(authService.resetPassword({ token, newPassword: 'Brand-New-Passw0rd!' })).resolves.toBeDefined();
    });

    it.each(['not-a-token', ''])('refuses an unknown token (%j)', async (token) => {
      await expect(authService.resetPassword({ token, newPassword: 'Brand-New-Passw0rd!' })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('does not take a verification token for a reset token', async () => {
      await register();

      await expect(authService.resetPassword({ token: lastVerificationToken(), newPassword: 'Brand-New-Passw0rd!' })).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('changePassword', () => {
    it('changes the password for someone who knows the current one, and ends their sessions', async () => {
      const user = await newUser();
      await authService.login({ email: user.email, password: GOOD_PASSWORD });

      await authService.changePassword(user.id, { currentPassword: GOOD_PASSWORD, newPassword: 'Brand-New-Passw0rd!' });

      await expect(authService.login({ email: user.email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401 });
      await expect(authService.login({ email: user.email, password: 'Brand-New-Passw0rd!' })).resolves.toBeDefined();
    });

    it('refuses a wrong current password and changes nothing', async () => {
      const user = await newUser();

      await expect(authService.changePassword(user.id, { currentPassword: 'Wrong-Passw0rd!', newPassword: 'Brand-New-Passw0rd!' })).rejects.toMatchObject({ statusCode: 401 });

      await expect(authService.login({ email: user.email, password: GOOD_PASSWORD })).resolves.toBeDefined();
    });

    it('refuses "changing" to the password already in use', async () => {
      const user = await newUser();

      await expect(authService.changePassword(user.id, { currentPassword: GOOD_PASSWORD, newPassword: GOOD_PASSWORD })).rejects.toMatchObject({
        statusCode: 400,
        validationErrors: [{ code: 'PASSWORD_SAME_AS_CURRENT' }],
      });
    });

    it('refuses a too-short new password', async () => {
      const user = await newUser();

      await expect(authService.changePassword(user.id, { currentPassword: GOOD_PASSWORD, newPassword: 'short' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('returns 404 for a user that does not exist', async () => {
      await expect(authService.changePassword('missing', { currentPassword: 'x', newPassword: 'y' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('account', () => {
    it('shows a profile without secrets, and updates only name and phone', async () => {
      const user = await newUser();

      const updated = await authService.updateProfile(user.id, { firstName: 'Lou2', phone: '012', role: 'ADMIN', email: 'x@y.z' } as never);

      expect(updated).toMatchObject({ firstName: 'Lou2', phone: '012', role: 'CUSTOMER', email: user.email });
      expect(updated).not.toHaveProperty('password');
      expect(await authService.getProfile(user.id)).not.toHaveProperty('password');
    });

    it('sets and clears an avatar', async () => {
      const user = await newUser();

      expect(await authService.updateAvatar(user.id, 'https://x/y.png', 'key-1')).toMatchObject({ avatar: 'https://x/y.png', avatarKey: 'key-1' });
      expect(await authService.deleteAvatar(user.id)).toMatchObject({ avatar: null, avatarKey: null });
    });

    it('reports sessions that are still valid', async () => {
      const user = await newUser();
      expect(await authService.validateSession(user.id)).toBe(false);

      await authService.login({ email: user.email, password: GOOD_PASSWORD });

      expect(await authService.validateSession(user.id)).toBe(true);
      expect(await authService.getUserSessions(user.id)).toHaveLength(1);
    });

    it('closes the account with the right password, frees the email and ends sessions', async () => {
      const user = await newUser();
      await authService.login({ email: user.email, password: GOOD_PASSWORD });

      await authService.deleteAccount(user.id, GOOD_PASSWORD);

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.isActive).toBe(false);
      expect(stored.email).not.toBe(user.email);
      expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(0);
      await expect(authService.login({ email: user.email, password: GOOD_PASSWORD })).rejects.toMatchObject({ statusCode: 401 });
    });

    it('refuses to close an account with the wrong password, or with a booking still active', async () => {
      const user = await newUser();
      await expect(authService.deleteAccount(user.id, 'Wrong-Passw0rd!')).rejects.toMatchObject({ statusCode: 401 });

      const site = await prisma.site.create({
        data: {
          name: `Auth site ${unique()}`, type: 'TENT', status: 'AVAILABLE', capacity: 2, basePrice: 10, maxVehicles: 1, maxTents: 1,
          sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
        },
      });
      const booking = await prisma.booking.create({
        data: { bookingNumber: `BK-AUTH-${unique()}`, userId: user.id, siteId: site.id, checkInDate: new Date('2041-01-01'), checkOutDate: new Date('2041-01-03'), adultGuests: 1, childGuests: 0, totalAmount: 10, status: 'PENDING' },
      });

      await expect(authService.deleteAccount(user.id, GOOD_PASSWORD)).rejects.toMatchObject({ message: 'Cannot delete account with active bookings' });
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).isActive).toBe(true);

      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.site.delete({ where: { id: site.id } });
    });
  });
});
