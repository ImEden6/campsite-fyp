// Allowed browser origins: one list shared by the REST API and Socket.IO

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, request, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import type { Server } from 'socket.io';

import { getAllowedOrigins } from '@/config/origins';
import { createSocketServer } from '@/socket/server';

describe('getAllowedOrigins', () => {
  it('uses the CORS_ORIGIN list, trimming spaces and ignoring empty entries', () => {
    expect(getAllowedOrigins({ CORS_ORIGIN: 'http://localhost:5173, http://localhost ,,', FRONTEND_URL: 'http://ignored' })).toEqual([
      'http://localhost:5173',
      'http://localhost',
    ]);
  });

  it('falls back to FRONTEND_URL when CORS_ORIGIN is unset or blank', () => {
    expect(getAllowedOrigins({ FRONTEND_URL: 'https://camp.example.com' })).toEqual(['https://camp.example.com']);
    expect(getAllowedOrigins({ CORS_ORIGIN: ' , ', FRONTEND_URL: 'https://camp.example.com' })).toEqual(['https://camp.example.com']);
  });

  it('falls back to the local dev origin when nothing is configured', () => {
    expect(getAllowedOrigins({})).toEqual(['http://localhost:3000']);
  });
});

describe('Socket.IO CORS', () => {
  let httpServer: HttpServer;
  let io: Server;
  let port: number;
  const originalCors = process.env.CORS_ORIGIN;
  const originalFrontend = process.env.FRONTEND_URL;

  beforeAll(async () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://localhost';
    process.env.FRONTEND_URL = 'http://localhost:3000'; // must NOT be the only thing sockets accept
    httpServer = createServer();
    io = createSocketServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    port = (httpServer.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await io.close();
    if (originalCors === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = originalCors;
    if (originalFrontend === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontend;
  });

  // The Engine.IO polling handshake is a plain HTTP request, which is where CORS is applied
  const allowOriginHeaderFor = (origin: string) =>
    new Promise<string | undefined>((resolve, reject) => {
      const req = request(
        { host: '127.0.0.1', port, path: '/socket.io/?EIO=4&transport=polling', headers: { Origin: origin } },
        (res) => {
          res.resume();
          resolve(res.headers['access-control-allow-origin'] as string | undefined);
        }
      );
      req.on('error', reject);
      req.end();
    });

  it.each(['http://localhost:5173', 'http://localhost'])('allows %s, as the REST API does', async (origin) => {
    expect(await allowOriginHeaderFor(origin)).toBe(origin);
  });

  it('refuses an origin that is not in the list', async () => {
    expect(await allowOriginHeaderFor('https://evil.example.com')).toBeUndefined();
  });
});
