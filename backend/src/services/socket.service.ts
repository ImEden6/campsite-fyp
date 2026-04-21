// Socket Service
// Singleton that holds the Socket.io server instance and provides helper methods
// for emitting real-time events from anywhere in the application.

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
   * Broadcast an event to all connected clients.
   */
  emit(event: string, data: unknown): void {
    if (!this.io) {
      logger.warn(`[SocketService] Cannot emit "${event}" — service not initialized`);
      return;
    }
    this.io.emit(event, data);
  }

  /**
   * Emit an event to a specific Socket.io room.
   */
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.warn(`[SocketService] Cannot emit "${event}" to room "${room}" — service not initialized`);
      return;
    }
    this.io.to(room).emit(event, data);
  }
}

const socketService = new SocketService();
export default socketService;
