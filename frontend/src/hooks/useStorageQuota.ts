/**
 * Hook to monitor and handle localStorage quota warnings
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/**
 * Hook to listen for storage quota warnings and display toast notifications
 */
export function useStorageQuota(): void {
  const showToast = useUIStore((state) => state.showToast);

  useEffect(() => {
    const handleQuotaWarning = (event: CustomEvent) => {
      const { message, action } = event.detail;
      
      // Show warning toast (longer duration for important messages)
      showToast(message, 'warning', 6000);
      
      console.warn('Storage quota warning:', action, message);
    };

    const handleQuotaError = (event: CustomEvent) => {
      const { message, action } = event.detail;
      
      // Show error toast (longer duration for critical messages)
      showToast(message, 'error', 8000);
      
      console.error('Storage quota error:', action, message);
    };

    // Listen for storage quota events
    window.addEventListener('storage-quota-warning', handleQuotaWarning as EventListener);
    window.addEventListener('storage-quota-error', handleQuotaError as EventListener);

    return () => {
      window.removeEventListener('storage-quota-warning', handleQuotaWarning as EventListener);
      window.removeEventListener('storage-quota-error', handleQuotaError as EventListener);
    };
  }, [showToast]);
}
