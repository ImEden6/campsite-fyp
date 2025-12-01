/**
 * WebSocket Service
 * Manages WebSocket connections with Socket.io
 * Implements reconnection logic with exponential backoff
 */

import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import {
  ConnectionStatus,
  EventHandler,
  IWebSocketService,
  SOCKET_EVENTS,
  WebSocketConfig,
} from './types';

/**
 * WebSocket Service Class
 * Singleton service for managing WebSocket connections
 */
class WebSocketService implements IWebSocketService {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectionDelay: number;
  private reconnectionDelayMax: number;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private config: WebSocketConfig;

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      url: env.wsUrl,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      transports: ['websocket'],
      ...config,
    };

    this.maxReconnectAttempts = this.config.reconnectionAttempts!;
    this.reconnectionDelay = this.config.reconnectionDelay!;
    this.reconnectionDelayMax = this.config.reconnectionDelayMax!;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.status = 'connecting';
    console.log('[WebSocket] Connecting to', this.config.url);

    this.socket = io(this.config.url, {
      auth: { token },
      autoConnect: this.config.autoConnect,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      timeout: this.config.timeout,
      transports: this.config.transports,
    });

    this.setupConnectionHandlers();
    this.setupEventHandlers();

    // Manually connect if autoConnect is false
    if (!this.config.autoConnect) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (!this.socket) {
      console.log('[WebSocket] No active connection to disconnect');
      return;
    }

    console.log('[WebSocket] Disconnecting');
    this.socket.disconnect();
    this.socket = null;
    this.status = 'disconnected';
    this.reconnectAttempts = 0;
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Register event handler
   */
  public on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);

    // Register with socket if connected
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unregister event handler
   */
  public off(event: string, handler?: EventHandler): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }

      if (this.socket) {
        this.socket.off(event, handler);
      }
    } else {
      // Remove all handlers for event
      this.eventHandlers.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * Emit event to server
   */
  public emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot emit event, not connected:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Subscribe to event with automatic cleanup
   * Returns unsubscribe function
   */
  public subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    this.on(event, handler);
    return () => this.off(event, handler as EventHandler);
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('[WebSocket] Connected successfully');
      this.status = 'connected';
      this.reconnectAttempts = 0;

      // Dispatch custom event for app-wide notification
      window.dispatchEvent(new CustomEvent('websocket:connected'));
    });

    // Connection lost
    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.status = 'disconnected';

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('websocket:disconnected', { detail: { reason } }));

      // Handle reconnection based on reason
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, manual reconnection needed
        console.log('[WebSocket] Server disconnected, attempting manual reconnection');
        this.handleManualReconnect();
      }
    });

    // Connection error
    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.status = 'error';

      // Dispatch custom event
      window.dispatchEvent(
        new CustomEvent('websocket:error', { detail: { error: error.message } })
      );
    });

    // Reconnection attempt
    this.socket.io.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (attempt: number) => {
      console.log(`[WebSocket] Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.status = 'reconnecting';
      this.reconnectAttempts = attempt;
    });

    // Reconnection successful
    this.socket.io.on(SOCKET_EVENTS.RECONNECT, (attempt: number) => {
      console.log(`[WebSocket] Reconnected after ${attempt} attempts`);
      this.status = 'connected';
      this.reconnectAttempts = 0;

      // Re-register all event handlers
      this.reregisterEventHandlers();

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('websocket:reconnected'));
    });

    // Reconnection error
    this.socket.io.on(SOCKET_EVENTS.RECONNECT_ERROR, (error: Error) => {
      console.error('[WebSocket] Reconnection error:', error.message);
      this.status = 'error';
    });

    // Reconnection failed
    this.socket.io.on(SOCKET_EVENTS.RECONNECT_FAILED, () => {
      console.error('[WebSocket] Reconnection failed after maximum attempts');
      this.status = 'error';

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('websocket:reconnect-failed'));
    });
  }

  /**
   * Setup application event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Log all incoming events in development
    if (env.isDevelopment) {
      this.socket.onAny((event: string, ...args: unknown[]) => {
        console.log(`[WebSocket] Event received: ${event}`, args);
      });
    }
  }

  /**
   * Handle manual reconnection with exponential backoff
   */
  private handleManualReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Maximum reconnection attempts reached');
      this.status = 'error';
      window.dispatchEvent(new CustomEvent('websocket:reconnect-failed'));
      return;
    }

    this.reconnectAttempts++;
    this.status = 'reconnecting';

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectionDelayMax
    );

    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Re-register all event handlers after reconnection
   */
  private reregisterEventHandlers(): void {
    if (!this.socket) return;

    console.log('[WebSocket] Re-registering event handlers');

    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket!.on(event, handler);
      });
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
