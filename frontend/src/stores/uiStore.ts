/**
 * UI Store
 * Manages UI state including sidebar, theme, and notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Toast, ToastType, Theme } from '@/types';
import { TOAST_DURATION } from '@/config/constants';

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  toasts: Toast[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      theme: Theme.LIGHT,
      toasts: [],

      // Toggle sidebar
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      // Set sidebar collapsed state
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Set theme
      setTheme: (theme: Theme) => {
        set({ theme });

        // Update document class for Tailwind dark mode with smooth transition
        if (typeof document !== 'undefined') {
          const docWithTransition = document as Document & {
            startViewTransition?: (callback: () => void) => void;
          };

          const applyTheme = () => {
            if (theme === Theme.DARK) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          };

          if (typeof docWithTransition.startViewTransition === 'function') {
            docWithTransition.startViewTransition(applyTheme);
          } else {
            applyTheme();
          }

          // Store theme preference
          localStorage.setItem('theme', theme);
        }
      },

      // Toggle theme
      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
        get().setTheme(newTheme);
      },

      // Show toast notification
      showToast: (message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = {
          id,
          message,
          type,
          duration: duration || TOAST_DURATION.MEDIUM,
        };

        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        // Auto-dismiss toast after duration
        if (toast.duration) {
          setTimeout(() => {
            get().hideToast(id);
          }, toast.duration);
        }
      },

      // Hide toast notification
      hideToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      // Clear all toasts
      clearToasts: () => {
        set({ toasts: [] });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Initialize theme on load - runs immediately when module loads
if (typeof window !== 'undefined') {
  // Try to get theme from Zustand persist storage first
  const persistedState = localStorage.getItem('ui-storage');
  let theme: Theme = Theme.LIGHT;

  if (persistedState) {
    try {
      const parsed = JSON.parse(persistedState);
      theme = parsed.state?.theme || Theme.LIGHT;
    } catch {
      // Fallback to direct theme storage
      const storedTheme = localStorage.getItem('theme');
      theme = (storedTheme === Theme.DARK ? Theme.DARK : Theme.LIGHT);
    }
  } else {
    // Check direct theme storage as fallback
    const storedTheme = localStorage.getItem('theme');
    theme = (storedTheme === Theme.DARK ? Theme.DARK : Theme.LIGHT);
  }

  // Apply theme immediately to prevent flash
  if (theme === Theme.DARK) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Also check system preference if no stored theme
  if (!persistedState && !localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      // Initialize store with system preference
      setTimeout(() => {
        useUIStore.getState().setTheme(Theme.DARK);
      }, 0);
    }
  }
}
