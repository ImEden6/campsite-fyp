// Socket.IO server factory. Every server is created with authentication already applied,
// so no code path can expose an unauthenticated socket.

import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { socketAuthMiddleware } from './auth';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Reject any connection that doesn't present a valid access token
  io.use(socketAuthMiddleware);

  return io;
}
