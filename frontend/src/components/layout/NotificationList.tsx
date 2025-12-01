import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CreditCard,
  AlertCircle,
  MessageSquare,
  CheckCheck,
  X
} from 'lucide-react';
import { NotificationType } from '@shared/types';
import type { Notification } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    // Close the notification panel after clicking
    onClose();
  };

  return (
    <div className="flex flex-col max-h-128">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 px-4 py-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter(NotificationType.BOOKING_CONFIRMATION)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === NotificationType.BOOKING_CONFIRMATION
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setFilter(NotificationType.PAYMENT_CONFIRMATION)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === NotificationType.PAYMENT_CONFIRMATION
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          Payments
        </button>
        <button
          onClick={() => setFilter(NotificationType.SYSTEM_ALERT)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === NotificationType.SYSTEM_ALERT
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          System
        </button>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b border-gray-200">
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Bell className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              {filter === 'all'
                ? 'No notifications yet'
                : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li key={notification.id}>
                <div
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                    }`}
                >
                  <NotificationItem notification={notification} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMATION:
      case NotificationType.BOOKING_REMINDER:
      case NotificationType.CHECK_IN_REMINDER:
      case NotificationType.CHECK_OUT_REMINDER:
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case NotificationType.PAYMENT_CONFIRMATION:
      case NotificationType.PAYMENT_FAILED:
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case NotificationType.SYSTEM_ALERT:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case NotificationType.CANCELLATION:
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex space-x-3">
      <div className="shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="ml-2 shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default NotificationList;
