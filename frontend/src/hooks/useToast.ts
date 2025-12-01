/**
 * useToast Hook
 * Provides toast notification functionality
 */

import { useUIStore } from '@/stores';
import type { ToastType } from '@/types';

export const useToast = () => {
  const { showToast: showToastStore } = useUIStore();

  const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    showToastStore(message, type, duration);
  };

  return {
    showToast,
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  };
};
