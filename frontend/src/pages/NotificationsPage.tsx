/**
 * NotificationsPage
 * View and manage notifications
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationList from '@/components/layout/NotificationList';
import { GlassCard } from '@/components/ui/GlassCard';

const NotificationsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  } = useNotifications(user?.id);

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <GlassCard className="overflow-hidden" intensity="strong">
          <div className="px-6 py-5 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-primary-100">Notifications</h1>
                  {unreadCount > 0 && (
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClose={() => { }}
          />
        </GlassCard>
      </div>
    </div>
  );
};

export default NotificationsPage;
