/**
 * ResponsiveLayout Component
 * Main layout wrapper with responsive behavior for mobile, tablet, and desktop
 */

import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/stores/uiStore';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { cn } from '@/utils/cn';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={cn(
          'flex-1 flex flex-col',
          'lg:ml-0 transition-all duration-300',
          !isMobile && !sidebarCollapsed && 'lg:ml-64',
          !isMobile && sidebarCollapsed && 'lg:ml-16'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main 
          className={cn(
            'flex-1 overflow-auto',
            // Add padding bottom on mobile to account for bottom nav
            'pb-20 lg:pb-0'
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav onMenuClick={handleMobileMenuToggle} />}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu</h3>
              {/* Additional menu items can be added here */}
              <div className="space-y-2">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ResponsiveLayout;
