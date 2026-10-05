// What users may change about themselves and others (real Postgres, real routes).
// Only login is stubbed: the test says who is calling via a header.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('@/middleware/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/middleware/auth')>();
  return {
    ...actual,
    authenticate: async (req: any, _res: unknown, next: () => void) => {
      const user = await (await import('@/database')).default.user.findUniqueOrThrow({ where: { id: String(req.headers['x-user-id']) } });
      req.user = { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, isActive: true, isEmailVerified: true };
      next();
    },
  };
});

import userRoutes from '@/routes/user.routes';
import { errorHandler } from '@/utils/errors';
import prisma from '@/database';

const app = express();
app.use(express.json());
app.use('/users', userRoutes);
app.use(errorHandler);

const unique = () => `${Date.now()}-${Math.random()}`;

describe('User routes (real database)', () => {
  const ids: Record<'alice' | 'bob' | 'ada', string> = {} as never;
  const as = (who: keyof typeof ids) => ({ 'x-user-id': ids[who] });

  beforeAll(async () => {
    for (const [name, role] of [['alice', 'CUSTOMER'], ['bob', 'CUSTOMER'], ['ada', 'ADMIN']] as const) {
      ids[name] = (await prisma.user.create({ data: { email: `${name}-${unique()}@example.com`, firstName: name, lastName: 'Users', password: 'x', role } })).id;
    }
  });

  afterAll(async () => {
    await prisma.userPreferences.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  });

  describe('PUT /users/me/preferences', () => {
    const put = (who: keyof typeof ids, body: unknown) => request(app).put('/users/me/preferences').set(as(who)).send(body as object);

    it('saves valid preferences for the signed-in user', async () => {
      const res = await put('alice', { theme: 'dark', language: 'ms', emailNotifications: false });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ userId: ids.alice, theme: 'dark', language: 'ms', emailNotifications: false });
    });

    it('updates in place on a second save', async () => {
      await put('alice', { theme: 'light' });
      await put('alice', { smsNotifications: false });

      const stored = await prisma.userPreferences.findMany({ where: { userId: ids.alice } });
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ theme: 'light', smsNotifications: false });
    });

    it('refuses a body that names another user, and writes nothing for them', async () => {
      const res = await put('alice', { userId: ids.bob, theme: 'dark' });

      expect(res.status).toBe(400);
      expect(await prisma.userPreferences.count({ where: { userId: ids.bob } })).toBe(0);
    });

    it.each([
      ['an id', { id: 'x', theme: 'dark' }],
      ['an unknown field', { isAdmin: true }],
      ['a bad theme', { theme: 'neon' }],
      ['a wrong type', { emailNotifications: 'yes' }],
      ['an empty language', { language: '' }],
    ])('refuses %s', async (_label, body) => {
      expect((await put('alice', body)).status).toBe(400);
    });
  });

  describe('PUT /users/me', () => {
    const put = (body: unknown) => request(app).put('/users/me').set(as('alice')).send(body as object);

    it('changes the allowed profile fields', async () => {
      const res = await put({ firstName: 'Alicia', phone: '0123456789' });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ firstName: 'Alicia', phone: '0123456789' });
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('ignores fields a user must never set themselves', async () => {
      const res = await put({ firstName: 'Alice', role: 'ADMIN', isActive: false, email: 'hijack@example.com', password: 'new-password' });

      expect(res.status).toBe(200);
      const stored = await prisma.user.findUniqueOrThrow({ where: { id: ids.alice } });
      expect(stored).toMatchObject({ role: 'CUSTOMER', isActive: true, password: 'x' });
      expect(stored.email).not.toBe('hijack@example.com');
    });

    it('refuses values of the wrong type', async () => {
      expect((await put({ firstName: 12345 })).status).toBe(400);
      expect((await put({ firstName: '' })).status).toBe(400);
    });
  });

  describe('PUT /users/:id (admin)', () => {
    const put = (who: keyof typeof ids, id: string, body: unknown) => request(app).put(`/users/${id}`).set(as(who)).send(body as object);

    it('lets an admin change a user\'s role and status', async () => {
      const res = await put('ada', ids.bob, { role: 'STAFF', isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ role: 'STAFF', isActive: false });
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('stores a new password hashed, not as typed', async () => {
      await put('ada', ids.bob, { password: 'a-new-password-1' });

      const stored = await prisma.user.findUniqueOrThrow({ where: { id: ids.bob } });
      expect(stored.password).not.toBe('a-new-password-1');
      expect(stored.password).toMatch(/^\$2[aby]\$/);
    });

    it.each([
      ['an unknown field', { id: 'other-id' }],
      ['a made-up role', { role: 'SUPERUSER' }],
      ['a short password', { password: 'short' }],
      ['a bad email', { email: 'not-an-email' }],
    ])('refuses %s', async (_label, body) => {
      expect((await put('ada', ids.bob, body)).status).toBe(400);
    });

    it('stops an admin demoting themselves', async () => {
      expect((await put('ada', ids.ada, { role: 'CUSTOMER' })).status).toBe(400);
    });

    it('is closed to customers', async () => {
      expect((await put('alice', ids.bob, { firstName: 'Nope' })).status).toBe(403);
    });
  });
});
