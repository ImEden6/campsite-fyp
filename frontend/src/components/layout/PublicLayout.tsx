import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, Map } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ThemeToggle from '@/components/ThemeToggle';

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg">
      {/* Navigation */}
      <nav className="bg-white dark:bg-night-surface border-b border-secondary-200/50 dark:border-secondary-800/50 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-night-surface/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-primary-600 dark:text-primary-400">
                Campsite
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/sites"
                className="text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Browse Sites
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === 'CUSTOMER' ? (
                    <Link
                      to="/customer/dashboard"
                      className="text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/customer/login"
                    className="flex items-center space-x-1 text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    Register
                  </Link>
                </>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Mobile menu button + Theme Toggle */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/50"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-secondary-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-secondary-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200/50 dark:border-secondary-800/50">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/sites"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Browse Sites
              </Link>

              {isAuthenticated ? (
                <>
                  {user?.role === 'CUSTOMER' ? (
                    <Link
                      to="/customer/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/customer/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-center shadow-sm"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-night-surface border-t border-secondary-200/50 dark:border-secondary-800/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-secondary-600 dark:text-secondary-400">
            <p>&copy; {new Date().getFullYear()} Campsite Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

