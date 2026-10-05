// Socket.IO server factory. Every server is created with authentication already applied,
// so no code path can expose an unauthenticated socket.

import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { socketAuthMiddleware } from './auth';
import { roomsFor } from './rooms';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Reject any connection that doesn't present a valid access token
  io.use(socketAuthMiddleware);

  // Put each connection in the rooms its user is entitled to. Decided here from the
  // authenticated user, before any application handler runs; clients cannot choose rooms.
  io.on('connection', (socket) => {
    void socket.join(roomsFor(socket.data.user));
  });

  return io;
}
