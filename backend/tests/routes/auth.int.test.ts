// The auth HTTP API end to end: real routes, real login middleware, real Postgres and Redis.
// Only the email sender and the rate limiters are replaced.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const { emailMock } = vi.hoisted(() => ({ emailMock: { sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn() } }));
vi.mock('@/services/email', () => ({ emailService: emailMock }));
vi.mock('@/middleware/security', () => {
  const pass = (_req: unknown, _res: unknown, next: () => void) => next();
  return { authRateLimit: pass, registerRateLimit: pass, paymentRateLimit: pass, generalRateLimit: pass };
});

import authRoutes from '@/routes/auth.routes';
import cacheService from '@/services/cache.service';
import { errorHandler } from '@/utils/errors';
import prisma from '@/database';
import { config } from '@/config';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const PASSWORD = 'Str0ng-Passw0rd!';

describe('Auth routes (real database and cache)', () => {
  const emails: string[] = [];
  const newEmail = (label = 'u') => {
    const email = `route-${label}-${unique()}@example.com`;
    emails.push(email);
    return email;
  };
  const originalSkip = config.development.skipEmailVerification;

  const signUp = (overrides: Record<string, unknown> = {}) =>
    request(app).post('/auth/register').send({ email: newEmail(), password: PASSWORD, firstName: 'Rae', lastName: 'Route', ...overrides });

  /** Register, verify and log in; returns the tokens and email. */
  const loggedIn = async () => {
    const email = newEmail('in');
    await signUp({ email });
    const token = emailMock.sendVerificationEmail.mock.calls.at(-1)![1];
    await request(app).post('/auth/verify-email').send({ token });
    const login = await request(app).post('/auth/login').send({ email, password: PASSWORD });
    const { accessToken, refreshToken } = login.body.data as { accessToken: string; refreshToken: string };
    return { email, accessToken, refreshToken };
  };

  beforeAll(async () => {
    await cacheService.connect();
    await vi.waitFor(() => expect(cacheService.isReady()).toBe(true));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    config.development.skipEmailVerification = false;
  });

  afterEach(() => {
    config.development.skipEmailVerification = originalSkip;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await cacheService.disconnect();
  });

  describe('POST /auth/register', () => {
    it('creates an account and never returns the password', async () => {
      const res = await signUp();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ success: true, data: { role: 'CUSTOMER', isEmailVerified: false } });
      expect(JSON.stringify(res.body)).not.toContain('"password"');
      expect(emailMock.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['an admin role', { role: 'ADMIN' }],
      ['an unknown field', { isActive: false }],
      ['a password with no capital letter', { password: 'str0ng-passw0rd!' }],
      ['a password with no number', { password: 'Strong-Password!' }],
      ['a short password', { password: 'Sh0rt' }],
      ['a bad email', { email: 'not-an-email' }],
      ['a missing name', { firstName: '' }],
    ])('refuses %s', async (_label, overrides) => {
      const res = await signUp(overrides);

      expect(res.status).toBe(400);
    });

    it('answers 409 for an email that is already taken', async () => {
      const email = newEmail('taken');
      await signUp({ email });

      expect((await signUp({ email })).status).toBe(409);
    });
  });

  describe('verification, login and the session', () => {
    it('takes a new user from sign-up to a working session', async () => {
      const email = newEmail('flow');
      await signUp({ email });

      // not verified yet
      expect((await request(app).post('/auth/login').send({ email, password: PASSWORD })).status).toBe(401);

      const token = emailMock.sendVerificationEmail.mock.calls.at(-1)![1];
      expect((await request(app).post('/auth/verify-email').send({ token })).status).toBe(200);

      const login = await request(app).post('/auth/login').send({ email, password: PASSWORD });
      expect(login.status).toBe(200);
      expect(login.body.data.user).toMatchObject({ email, role: 'CUSTOMER' });

      const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);
      expect(me.status).toBe(200);
      expect(me.body.data.email).toBe(email);
      expect(JSON.stringify(me.body)).not.toContain('"password"');
    });

    it('refuses a verification token twice', async () => {
      await signUp();
      const token = emailMock.sendVerificationEmail.mock.calls.at(-1)![1];

      await request(app).post('/auth/verify-email').send({ token });

      expect((await request(app).post('/auth/verify-email').send({ token })).status).toBe(401);
    });

    it.each([
      ['no token', undefined],
      ['a malformed token', 'Bearer nope'],
      ['a mock admin token (which must never work outside development)', 'Bearer mock-access-token-admin-1'],
    ])('keeps /auth/me closed with %s', async (_label, header) => {
      const original = config.server.nodeEnv;
      config.server.nodeEnv = 'production';
      try {
        const req = request(app).get('/auth/me');
        if (header) req.set('Authorization', header);

        expect((await req).status).toBe(401);
      } finally {
        config.server.nodeEnv = original;
      }
    });

    it('answers a wrong password and an unknown email identically', async () => {
      const { email } = await loggedIn();

      const wrong = await request(app).post('/auth/login').send({ email, password: 'Wrong-Passw0rd!' });
      const unknown = await request(app).post('/auth/login').send({ email: newEmail('ghost'), password: PASSWORD });

      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(wrong.body.error.message).toBe(unknown.body.error.message);
    });

    it.each([
      ['an unknown field', { extra: 1 }],
      ['a bad email', { email: 'nope' }],
      ['a short password', { password: 'abc' }],
    ])('rejects a login with %s', async (_label, overrides) => {
      const res = await request(app).post('/auth/login').send({ email: newEmail(), password: PASSWORD, ...overrides });

      expect(res.status).toBe(400);
    });
  });

  describe('refresh and logout', () => {
    it('trades a refresh token for new tokens, once', async () => {
      const { refreshToken } = await loggedIn();

      const first = await request(app).post('/auth/refresh').send({ refreshToken });
      const reuse = await request(app).post('/auth/refresh').send({ refreshToken });

      expect(first.status).toBe(200);
      expect(first.body.data).toMatchObject({ accessToken: expect.any(String), refreshToken: expect.any(String), expiresIn: expect.any(Number) });
      expect(first.body.data.refreshToken).not.toBe(refreshToken);
      expect(reuse.status).toBe(401);
    });

    it('refuses a made-up refresh token', async () => {
      expect((await request(app).post('/auth/refresh').send({ refreshToken: 'nope' })).status).toBe(401);
      expect((await request(app).post('/auth/refresh').send({})).status).toBe(400);
    });

    it('logs out, after which that refresh token is dead', async () => {
      const { accessToken, refreshToken } = await loggedIn();

      const out = await request(app).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`).send({ refreshToken });

      expect(out.status).toBe(200);
      expect((await request(app).post('/auth/refresh').send({ refreshToken })).status).toBe(401);
    });

    it('needs you to be signed in to log out', async () => {
      expect((await request(app).post('/auth/logout').send({ refreshToken: 'x' })).status).toBe(401);
    });
  });

  describe('forgot and reset password', () => {
    it('lets someone who lost their password choose a new one from the emailed link', async () => {
      const { email } = await loggedIn();

      expect((await request(app).post('/auth/forgot-password').send({ email })).status).toBe(200);
      const token = emailMock.sendPasswordResetEmail.mock.calls.at(-1)![1];

      const reset = await request(app).post('/auth/reset-password').send({ token, newPassword: 'Brand-New-Passw0rd!' });
      expect(reset.status).toBe(200);

      expect((await request(app).post('/auth/login').send({ email, password: PASSWORD })).status).toBe(401);
      expect((await request(app).post('/auth/login').send({ email, password: 'Brand-New-Passw0rd!' })).status).toBe(200);
    });

    it('gives the same answer for an email nobody registered, and sends nothing', async () => {
      const { email } = await loggedIn();

      const known = await request(app).post('/auth/forgot-password').send({ email });
      emailMock.sendPasswordResetEmail.mockClear();
      const unknown = await request(app).post('/auth/forgot-password').send({ email: newEmail('ghost') });

      expect(unknown.status).toBe(known.status);
      expect(unknown.body).toEqual(known.body);
      expect(emailMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('refuses a reset link that was never issued', async () => {
      const res = await request(app).post('/auth/reset-password').send({ token: 'a'.repeat(64), newPassword: 'Brand-New-Passw0rd!' });

      expect(res.status).toBe(401);
    });
  });

  describe('change password', () => {
    it('needs the current password, then ends the other sessions', async () => {
      const { email, accessToken, refreshToken } = await loggedIn();
      const auth = { Authorization: `Bearer ${accessToken}` };

      const wrong = await request(app).post('/auth/change-password').set(auth).send({ currentPassword: 'Wrong-Passw0rd!', newPassword: 'Brand-New-Passw0rd!' });
      const same = await request(app).post('/auth/change-password').set(auth).send({ currentPassword: PASSWORD, newPassword: PASSWORD });
      const ok = await request(app).post('/auth/change-password').set(auth).send({ currentPassword: PASSWORD, newPassword: 'Brand-New-Passw0rd!' });

      expect(wrong.status).toBe(401);
      expect(same.status).toBe(400);
      expect(ok.status).toBe(200);
      expect((await request(app).post('/auth/refresh').send({ refreshToken })).status).toBe(401); // old session is gone
      expect((await request(app).post('/auth/login').send({ email, password: 'Brand-New-Passw0rd!' })).status).toBe(200);
    });

    it('needs you to be signed in', async () => {
      const res = await request(app).post('/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'Brand-New-Passw0rd!' });

      expect(res.status).toBe(401);
    });
  });

  describe('resend verification', () => {
    it('answers the same for a real, a verified and an unknown account', async () => {
      const unverified = newEmail('unv');
      await signUp({ email: unverified });
      const { email: verified } = await loggedIn();

      const answers = await Promise.all([unverified, verified, newEmail('ghost')].map((email) => request(app).post('/auth/resend-verification').send({ email })));

      expect(new Set(answers.map((a) => a.status))).toEqual(new Set([200]));
      expect(new Set(answers.map((a) => JSON.stringify(a.body))).size).toBe(1);
    });
  });
});
