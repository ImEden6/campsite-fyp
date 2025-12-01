/**
 * useNotificationEvents Hook
 * Domain-specific hook for notification-related WebSocket events
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketEvent } from './useWebSocketEvent';
import { SOCKET_EVENTS, NotificationEventPayload } from '@/services/websocket/types';
import { queryKeys } from '@/config/query-keys';

interface UseNotificationEventsOptions {
  onNewNotification?: (notification: NotificationEventPayload) => void;
  onNotificationRead?: (notification: NotificationEventPayload) => void;
  showToast?: boolean;
  invalidateQueries?: boolean;
  enabled?: boolean;
}

/**
 * Hook for handling notification-related WebSocket events
 * Automatically invalidates React Query cache and shows toast notifications
 */
export const useNotificationEvents = (options: UseNotificationEventsOptions = {}) => {
  const {
    onNewNotification,
    onNotificationRead,
    showToast = true,
    invalidateQueries = true,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();

  // New notification received
  const handleNewNotification = useCallback(
    (notification: NotificationEventPayload) => {
      console.log('[NotificationEvents] New notification:', notification.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count() });
      }

      // Show toast notification
      if (showToast) {
        // Dispatch custom event for toast notification
        window.dispatchEvent(
          new CustomEvent('notification:toast', {
            detail: {
              title: notification.title,
              message: notification.message,
              type: notification.type || 'info',
            },
          })
        );
      }

      onNewNotification?.(notification);
    },
    [queryClient, invalidateQueries, showToast, onNewNotification]
  );

  // Notification marked as read
  const handleNotificationRead = useCallback(
    (notification: NotificationEventPayload) => {
      console.log('[NotificationEvents] Notification read:', notification.id);

      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count() });
      }

      onNotificationRead?.(notification);
    },
    [queryClient, invalidateQueries, onNotificationRead]
  );

  // Subscribe to events
  useWebSocketEvent(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification, {
    deps: [queryClient, invalidateQueries, showToast, onNewNotification],
    enabled,
  });
  useWebSocketEvent(SOCKET_EVENTS.NOTIFICATION_READ, handleNotificationRead, {
    deps: [queryClient, invalidateQueries, onNotificationRead],
    enabled,
  });
};
