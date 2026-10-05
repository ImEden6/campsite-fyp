// Socket Service
// Singleton that holds the Socket.io server instance and emits real-time events.
//
// There is deliberately no "emit to everyone" method: every event goes to named rooms
// (see src/socket/rooms.ts) so a client only ever receives what it is entitled to see.

import { Server } from 'socket.io';
import logger from '@/utils/logger';

class SocketService {
  private io: Server | null = null;

  /**
   * Attach the Socket.io server instance.
   * Must be called once during application startup (in index.ts).
   */
  initialize(io: Server): void {
    this.io = io;
    logger.info('Socket service initialized');
  }

  /**
   * Emit an event to one or more rooms. A client in several of the rooms still receives it once.
   */
  emitToRooms(rooms: string[], event: string, data: unknown): void {
    if (!this.io) {
      logger.warn(`[SocketService] Cannot emit "${event}" — service not initialized`);
      return;
    }
    if (rooms.length === 0) return;
    this.io.to(rooms).emit(event, data);
  }
}

const socketService = new SocketService();
export default socketService;
