// Socket.IO handshake authentication + the shared authenticateToken it relies on.
// Real http server and socket.io client; only the database and cache are mocked.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import type { Server } from 'socket.io';
import { io as connectClient, type Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const { prismaMock, cacheMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), findFirst: vi.fn() } },
  cacheMock: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('@/database', () => ({ default: prismaMock, getPrismaClient: () => prismaMock }));
vi.mock('@/services/cache.service', () => ({ default: cacheMock }));

import { config } from '@/config';
import { authenticateToken } from '@/middleware/auth';
import { createSocketServer } from '@/socket/server';
import { ApiError } from '@/utils/errors';

const SECRET = config.jwt.secret;

const dbUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  role: 'CUSTOMER',
  firstName: 'Una',
  lastName: 'User',
  isActive: true,
  isEmailVerified: true,
  ...overrides,
});

const signToken = (options: jwt.SignOptions = { expiresIn: '1h' }, secret = SECRET) =>
  jwt.sign({ userId: 'user-1', email: 'user@example.com', role: 'CUSTOMER' }, secret, options);

beforeEach(() => {
  vi.clearAllMocks();
  cacheMock.get.mockResolvedValue(null);
  prismaMock.user.findUnique.mockResolvedValue(dbUser());
  prismaMock.user.findFirst.mockResolvedValue(null);
});

describe('authenticateToken', () => {
  const rejection = (token: string | undefined) => authenticateToken(token).catch((e: unknown) => e as ApiError);

  it('returns the user for a valid token', async () => {
    await expect(authenticateToken(signToken())).resolves.toMatchObject({ id: 'user-1', role: 'CUSTOMER' });
  });

  it.each([
    ['a missing token', undefined, 'Authentication required'],
    ['an empty token', '', 'Authentication required'],
    ['garbage', 'not-a-jwt', 'Invalid token'],
  ])('rejects %s with 401', async (_label, token, message) => {
    expect(await rejection(token)).toMatchObject({ statusCode: 401, message });
  });

  it('rejects a token signed with another secret', async () => {
    expect(await rejection(signToken({ expiresIn: '1h' }, 'some-other-secret'))).toMatchObject({ statusCode: 401, message: 'Invalid token' });
  });

  it('rejects an expired token', async () => {
    expect(await rejection(signToken({ expiresIn: -10 }))).toMatchObject({ statusCode: 401, message: 'Token expired' });
  });

  it('rejects a deleted user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await rejection(signToken())).toMatchObject({ statusCode: 401 });
  });

  it('rejects an inactive user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser({ isActive: false }));
    expect(await rejection(signToken())).toMatchObject({ statusCode: 401, message: 'Account is inactive' });
  });

  it('rejects an unverified email unless verification is skipped', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser({ isEmailVerified: false }));
    const original = config.development.skipEmailVerification;

    try {
      config.development.skipEmailVerification = false;
      expect(await rejection(signToken())).toMatchObject({ statusCode: 401, message: 'Email verification required' });

      config.development.skipEmailVerification = true;
      await expect(authenticateToken(signToken())).resolves.toMatchObject({ id: 'user-1' });
    } finally {
      config.development.skipEmailVerification = original;
    }
  });

  describe('mock tokens', () => {
    const originalEnv = config.server.nodeEnv;
    afterEach(() => {
      config.server.nodeEnv = originalEnv;
    });

    it.each(['development', 'test'])('are accepted when NODE_ENV is %s', async (env) => {
      config.server.nodeEnv = env;
      await expect(authenticateToken('mock-access-token-admin-1')).resolves.toMatchObject({ role: 'ADMIN' });
    });

    it.each(['production', 'staging', ''])('are rejected when NODE_ENV is "%s"', async (env) => {
      config.server.nodeEnv = env;
      expect(await rejection('mock-access-token-admin-1')).toMatchObject({ statusCode: 401, message: 'Invalid token' });
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled(); // never even looks up an admin
    });
  });
});

describe('Socket.IO handshake', () => {
  let httpServer: HttpServer;
  let io: Server;
  let url: string;
  let clients: ClientSocket[] = [];
  const connectedUsers: Array<{ id: string; role: string }> = [];

  beforeAll(async () => {
    httpServer = createServer();
    io = createSocketServer(httpServer); // the same factory index.ts uses
    io.on('connection', (socket) => connectedUsers.push(socket.data.user));
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await io.close();
  });

  afterEach(() => {
    clients.forEach((c) => c.close());
    clients = [];
    connectedUsers.length = 0;
  });

  type Outcome = { connected: true; client: ClientSocket } | { connected: false; message: string; code?: number };

  const connect = (options: { auth?: Record<string, unknown>; query?: Record<string, string> } = {}): Promise<Outcome> =>
    new Promise((resolve) => {
      const client = connectClient(url, { ...options, transports: ['websocket'], reconnection: false, forceNew: true });
      clients.push(client);
      client.on('connect', () => resolve({ connected: true, client }));
      client.on('connect_error', (err: Error & { data?: { code?: number } }) =>
        resolve({ connected: false, message: err.message, code: err.data?.code as number })
      );
    });

  it('rejects a connection with no token', async () => {
    expect(await connect()).toEqual({ connected: false, message: 'Authentication required', code: 401 });
  });

  it('rejects a garbage token', async () => {
    expect(await connect({ auth: { token: 'nope' } })).toMatchObject({ connected: false, message: 'Invalid token' });
  });

  it('rejects a token signed with the wrong secret', async () => {
    expect(await connect({ auth: { token: signToken({ expiresIn: '1h' }, 'wrong') } })).toMatchObject({ connected: false, message: 'Invalid token' });
  });

  it('rejects an expired token', async () => {
    expect(await connect({ auth: { token: signToken({ expiresIn: -10 }) } })).toMatchObject({ connected: false, message: 'Token expired' });
  });

  it('rejects a non-string token', async () => {
    expect(await connect({ auth: { token: { $ne: null } } })).toMatchObject({ connected: false, message: 'Authentication required' });
  });

  it('ignores a token passed in the query string', async () => {
    expect(await connect({ query: { token: signToken() } })).toMatchObject({ connected: false, message: 'Authentication required' });
  });

  it('rejects an inactive user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(dbUser({ isActive: false }));
    expect(await connect({ auth: { token: signToken() } })).toMatchObject({ connected: false, message: 'Account is inactive' });
  });

  it('does not leak internal errors', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('connection to postgres://secret@db failed'));
    const outcome = await connect({ auth: { token: signToken() } });

    expect(outcome).toMatchObject({ connected: false, message: 'Authentication failed' });
  });

  it('accepts a valid token and attaches the user to the socket', async () => {
    const outcome = await connect({ auth: { token: signToken() } });

    expect(outcome.connected).toBe(true);
    expect(connectedUsers).toEqual([expect.objectContaining({ id: 'user-1', role: 'CUSTOMER' })]);
  });

  it('closes the connection when the token expires', async () => {
    const outcome = await connect({ auth: { token: signToken({ expiresIn: 1 }) } });
    expect(outcome.connected).toBe(true);
    const client = (outcome as { client: ClientSocket }).client;

    const reason = await new Promise<string>((resolve) => client.on('disconnect', resolve));

    expect(reason).toBe('io server disconnect');
  }, 6000);

  it('does not accept mock tokens in production', async () => {
    const originalEnv = config.server.nodeEnv;
    config.server.nodeEnv = 'production';
    try {
      expect(await connect({ auth: { token: 'mock-access-token-admin-1' } })).toMatchObject({ connected: false, message: 'Invalid token' });
    } finally {
      config.server.nodeEnv = originalEnv;
    }
  });
});
