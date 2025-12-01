import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Notification } from '@/types';
import { get, put } from '@/services/api/client';
import { useWebSocketEvent } from './useWebSocketEvent';
import { useUIStore } from '@/stores/uiStore';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refetch: () => void;
}

export const useNotifications = (userId?: string): UseNotificationsReturn => {
  const queryClient = useQueryClient();
  const showToast = useUIStore((state) => state.showToast);

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await get<{ data: Notification[] }>(`/notifications?userId=${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await put(`/notifications/${notificationId}/read`, {});
    },
    onSuccess: (_, notificationId) => {
      // Optimistically update the cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userId],
        (old) => old?.map((n) => 
          n.id === notificationId ? { ...n, isRead: true } : n
        ) || []
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await put(`/notifications/read-all`, { userId });
    },
    onSuccess: () => {
      // Optimistically update the cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userId],
        (old) => old?.map((n) => ({ ...n, isRead: true })) || []
      );
      showToast('All notifications marked as read', 'success');
    },
  });

  // Handle real-time notification events via WebSocket
  useWebSocketEvent('notification:new', (data: Notification) => {
    if (data.userId === userId) {
      // Add new notification to cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userId],
        (old) => [data, ...(old || [])]
      );

      // Show toast notification
      showToast(data.title, 'info');
    }
  });

  useWebSocketEvent('notification:updated', (data: Notification) => {
    if (data.userId === userId) {
      // Update notification in cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userId],
        (old) => old?.map((n) => (n.id === data.id ? data : n)) || []
      );
    }
  });

  useWebSocketEvent('notification:deleted', (data: { id: string; userId: string }) => {
    if (data.userId === userId) {
      // Remove notification from cache
      queryClient.setQueryData<Notification[]>(
        ['notifications', userId],
        (old) => old?.filter((n) => n.id !== data.id) || []
      );
    }
  });

  const markAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAsRead,
    markAllAsRead,
    refetch,
  };
};
