/**
 * WebSocket Types
 * Type definitions for WebSocket events and handlers
 */

/**
 * WebSocket connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';

/**
 * WebSocket event names
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // Booking events
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_CHECKED_IN: 'booking:checked_in',
  BOOKING_CHECKED_OUT: 'booking:checked_out',
  
  // Payment events
  PAYMENT_PROCESSED: 'payment:processed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_REFUNDED: 'payment:refunded',
  
  // Site events
  SITE_STATUS_CHANGED: 'site:status_changed',
  SITE_CREATED: 'site:created',
  SITE_UPDATED: 'site:updated',
  SITE_DELETED: 'site:deleted',
  
  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  
  // User events
  USER_UPDATED: 'user:updated',
  USER_STATUS_CHANGED: 'user:status_changed',
  
  // Equipment events
  EQUIPMENT_RENTED: 'equipment:rented',
  EQUIPMENT_RETURNED: 'equipment:returned',
  EQUIPMENT_INVENTORY_LOW: 'equipment:inventory_low',
  
  // Analytics events
  METRICS_UPDATED: 'metrics:updated',
  DASHBOARD_REFRESH: 'dashboard:refresh',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

/**
 * Event payload types
 */
export interface BookingEventPayload {
  id: string;
  userId: string;
  siteId: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  [key: string]: unknown;
}

export interface PaymentEventPayload {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  method: string;
  [key: string]: unknown;
}

export interface SiteEventPayload {
  id: string;
  siteId: string;
  status: string;
  [key: string]: unknown;
}

export interface NotificationEventPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface UserEventPayload {
  id: string;
  userId: string;
  status?: string;
  [key: string]: unknown;
}

export interface EquipmentEventPayload {
  id: string;
  equipmentId: string;
  bookingId?: string;
  quantity: number;
  status: string;
  [key: string]: unknown;
}

export interface MetricsEventPayload {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * WebSocket configuration options
 */
export interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  transports?: string[];
}

/**
 * WebSocket service interface
 */
export interface IWebSocketService {
  connect(token: string): void;
  disconnect(): void;
  isConnected(): boolean;
  getStatus(): ConnectionStatus;
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  off(event: string, handler?: EventHandler): void;
  emit(event: string, data?: unknown): void;
  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void;
}
