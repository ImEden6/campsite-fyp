import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Map,
  Users,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { UserRole } from '@/types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
  },
  {
    path: '/manage/bookings',
    label: 'Manage Bookings',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
  },
  {
    path: '/manage/check-in',
    label: 'Check-In',
    icon: UserIcon,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
  },
  {
    path: '/manage/check-out',
    label: 'Check-Out',
    icon: CheckCircle,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]
  },
  {
    path: '/admin/sites',
    label: 'Sites',
    icon: Map,
    roles: [UserRole.ADMIN]
  },
  {
    path: '/admin/maps',
    label: 'Maps',
    icon: Map,
    roles: [UserRole.ADMIN]
  },
  {
    path: '/admin/equipment',
    label: 'Equipment',
    icon: Package,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    path: '/admin/users',
    label: 'Users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  {
    path: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    roles: [UserRole.ADMIN]
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const filteredNavItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={toggleMobileMenu}
          style={{ animation: 'fadeIn 0.3s ease-in-out' }}
        />
      )}

      {/* Sidebar */}
      <aside
        id="navigation"
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40
          transition-all duration-300 ease-in-out transform
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          transitionProperty: 'width, transform, opacity',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Campsite</h1>
              </div>
            )}

            {/* Desktop Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-100"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Primary navigation">
            <ul className="space-y-1" role="list">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center px-3 py-2.5 rounded-lg transition-colors
                        ${active
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}
                      `}
                      title={sidebarCollapsed ? item.label : undefined}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile Section */}
          {user && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <Link
                to="/profile"
                className={`
                  flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${sidebarCollapsed ? 'justify-center p-2' : 'space-x-3 p-3'}
                `}
                title={sidebarCollapsed ? user.firstName : undefined}
              >
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
