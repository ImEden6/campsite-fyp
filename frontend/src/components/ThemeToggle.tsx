import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Theme } from '@/types';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useUIStore();
  const isDark = theme === Theme.DARK;

  const toggleTheme = () => {
    setTheme(isDark ? Theme.LIGHT : Theme.DARK);
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
