// Socket.IO handshake authentication
//
// Every connection must present a valid access token in the handshake `auth` payload
// (the frontend sends `auth: { token }`). The token is validated by the same function the
// REST API uses, and the connection is closed when the token expires.

import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

import { authenticateToken, type AuthUser } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';

export interface SocketData {
  user: AuthUser;
}

export type AuthedSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

// setTimeout overflows (and fires immediately) beyond 2^31-1 ms
const MAX_TIMER_MS = 2_147_483_647;

/**
 * Close the connection when the access token expires. The client then reconnects with a
 * fresh token, so a socket can never outlive the session that opened it.
 */
const disconnectWhenTokenExpires = (socket: Socket, token: string): void => {
  const exp = (jwt.decode(token) as { exp?: number } | null)?.exp;
  if (!exp) return; // e.g. mock tokens carry no expiry

  const timer = setTimeout(() => {
    logger.info('Closing socket: access token expired', { socketId: socket.id, userId: socket.data.user?.id });
    socket.disconnect(true);
  }, Math.min(Math.max(exp * 1000 - Date.now(), 0), MAX_TIMER_MS));

  socket.once('disconnect', () => clearTimeout(timer));
};

/**
 * Socket.IO middleware: `io.use(socketAuthMiddleware)`.
 * Rejected clients receive a `connect_error` with a generic message and `data.code = 401`.
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    // Handshake `auth` only. Tokens in the URL query string would end up in access logs.
    const token = (socket.handshake.auth as { token?: unknown } | undefined)?.token;

    socket.data.user = await authenticateToken(typeof token === 'string' ? token : undefined, {
      userAgent: socket.handshake.headers['user-agent'],
      ip: socket.handshake.address,
    });

    disconnectWhenTokenExpires(socket, token as string);
    next();
  } catch (error) {
    const rejection = new Error(error instanceof ApiError ? error.message : 'Authentication failed') as Error & {
      data?: { code: number };
    };
    rejection.data = { code: 401 };

    if (!(error instanceof ApiError)) {
      logger.error('Socket authentication failed unexpectedly', { error });
    }
    next(rejection);
  }
};
