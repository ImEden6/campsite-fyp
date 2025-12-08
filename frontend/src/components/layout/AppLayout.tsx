import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { webSocketService } from '@/services/websocket';
import { useNotificationEvents } from '@/hooks/useNotificationEvents';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import { SkipNavigation } from '@/components/accessibility';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from './ToastContainer';

const AppLayout: React.FC = () => {
  const { initialize, user, tokens } = useAuthStore();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const showToast = useUIStore((state) => state.showToast);

  useEffect(() => {
    // Initialize auth state from storage on mount
    initialize();
  }, [initialize]);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user && tokens?.accessToken) {
      console.log('[AppLayout] Initializing WebSocket connection');
      webSocketService.connect(tokens.accessToken);

      return () => {
        console.log('[AppLayout] Disconnecting WebSocket');
        webSocketService.disconnect();
      };
    }
    return undefined;
  }, [user, tokens?.accessToken]);

  // Setup notification event handlers
  useNotificationEvents({
    onNewNotification: (notification) => {
      console.log('[AppLayout] New notification received:', notification);
    },
    showToast: true,
    invalidateQueries: true,
  });

  // Monitor storage quota and show warnings
  useStorageQuota();

  // Listen for custom notification toast events
  useEffect(() => {
    const handleNotificationToast = (event: CustomEvent) => {
      const { title, type } = event.detail;
      showToast(title, type || 'info');
    };

    window.addEventListener('notification:toast', handleNotificationToast as EventListener);

    return () => {
      window.removeEventListener('notification:toast', handleNotificationToast as EventListener);
    };
  }, [showToast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Skip Navigation Links */}
      <SkipNavigation />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main 
          id="main-content" 
          className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900"
          role="main"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
