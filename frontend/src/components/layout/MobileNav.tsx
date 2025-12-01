/**
 * MobileNav Component
 * Mobile-optimized navigation menu with bottom navigation bar
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Map,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

interface MobileNavProps {
  onMenuClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Define bottom nav items based on user role
  const getNavItems = () => {
    // Staff, Manager, Admin
    return [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/manage/bookings', label: 'Bookings', icon: Calendar },
      { path: '/admin/sites', label: 'Sites', icon: Map },
      { path: '/profile', label: 'Profile', icon: UserIcon },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors',
                'min-w-0 px-1',
                active
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-6 h-6 flex-shrink-0', active && 'text-blue-600')} />
              <span className={cn(
                'text-xs font-medium truncate w-full text-center',
                active && 'text-blue-600'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu button for additional options */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-600 hover:text-gray-900 transition-colors min-w-0 px-1"
        >
          <Menu className="w-6 h-6 flex-shrink-0" />
          <span className="text-xs font-medium truncate w-full text-center">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
