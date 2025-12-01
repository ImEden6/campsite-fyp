/**
 * Hooks
 * Central export for all custom React hooks
 */

// WebSocket hooks
export * from './useWebSocket';
export * from './useWebSocketEvent';
export * from './useWebSocketSubscription';

// Domain-specific WebSocket hooks
export * from './useBookingEvents';
export * from './useNotificationEvents';
export * from './useRealtimeUpdates';
export * from './useAnalyticsUpdates';

// Data hooks
export * from './useNotifications';

// UI hooks
export * from './useToast';
export * from './useMediaQuery';
export * from './useLoadingState';

// Accessibility hooks
export * from './useFocusManagement';
export * from './useKeyboardShortcuts';

// Monitoring hooks
export * from './useNavigationTracking';
