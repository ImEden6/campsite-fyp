/**
 * useThemeSync Hook
 * Syncs theme with system preferences and handles persistence
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Theme } from '@/types';

export const useThemeSync = () => {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('ui-storage') || localStorage.getItem('theme');

      if (!hasManualPreference) {
        setTheme(e.matches ? Theme.DARK : Theme.LIGHT);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }

    return undefined;
  }, [setTheme]);

  // Ensure theme is applied on mount
  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return { theme, setTheme };
};
