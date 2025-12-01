/**
 * WebSocket Test Utilities
 * Utilities for testing WebSocket functionality with mock-socket
 */

import { Server as MockSocketServer } from 'mock-socket';

export interface MockWebSocketServerOptions {
  url?: string;
  autoConnect?: boolean;
}

export interface MockWebSocketServer {
  server: MockSocketServer;
  sendEvent: (event: string, data: any) => void;
  waitForConnection: () => Promise<void>;
  getConnectedClients: () => number;
  cleanup: () => void;
}

/**
 * Create a mock WebSocket server for testing
 * @param options - Server configuration options
 * @returns Mock server instance with utility methods
 */
export const createMockWebSocketServer = (
  options: MockWebSocketServerOptions = {}
): MockWebSocketServer => {
  const { url = 'ws://localhost:3001' } = options;

  const server = new MockSocketServer(url);
  const clients: Set<any> = new Set();

  // Track connected clients
  server.on('connection', (socket) => {
    clients.add(socket);

    socket.on('close', () => {
      clients.delete(socket);
    });
  });

  /**
   * Send an event to all connected clients
   */
  const sendEvent = (event: string, data: any) => {
    const message = JSON.stringify({ event, data });
    server.emit(event, data);
    
    // Also send to all clients directly
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  };

  /**
   * Wait for at least one client to connect
   */
  const waitForConnection = (): Promise<void> => {
    return new Promise((resolve) => {
      if (clients.size > 0) {
        resolve();
        return;
      }

      const checkConnection = () => {
        if (clients.size > 0) {
          resolve();
        } else {
          setTimeout(checkConnection, 10);
        }
      };

      checkConnection();
    });
  };

  /**
   * Get number of connected clients
   */
  const getConnectedClients = (): number => {
    return clients.size;
  };

  /**
   * Clean up server and connections
   */
  const cleanup = () => {
    clients.forEach((client) => {
      try {
        client.close();
      } catch {
        // Ignore errors during cleanup
      }
    });
    clients.clear();
    
    try {
      server.stop();
    } catch {
      // Ignore errors during cleanup
    }
  };

  return {
    server,
    sendEvent,
    waitForConnection,
    getConnectedClients,
    cleanup,
  };
};

/**
 * Simulate a WebSocket event with proper structure
 */
export const createWebSocketEvent = <T = any>(event: string, data: T) => {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Wait for a condition to be true with timeout
 */
export const waitForCondition = (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
};
