import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '@/features/auth';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useNavigationTracking } from '@/hooks/useNavigationTracking';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/PageLoader';

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/" replace />;

  // Route based on user role
  if (user.role === UserRole.CUSTOMER) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Staff/admin users go to staff dashboard
  return <Navigate to="/dashboard" replace />;
};

// Lazy load all pages for code splitting
const AppLayout = lazy(() => import('@/components/layout/AppLayout'));
const CustomerLayout = lazy(() => import('@/components/layout/CustomerLayout'));
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));

// Public pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const SiteBrowsePage = lazy(() => import('@/pages/SiteBrowsePage'));
const SiteDetailPage = lazy(() => import('@/pages/SiteDetailPage'));

// Guest booking pages
const GuestBookingPage = lazy(() => import('@/pages/GuestBookingPage'));
const GuestBookingDetailPage = lazy(() => import('@/pages/GuestBookingDetailPage'));
const GuestBookingLookupPage = lazy(() => import('@/pages/GuestBookingLookupPage'));
const GuestBookingConfirmPage = lazy(() => import('@/pages/GuestBookingConfirmPage'));

// Customer pages
const CustomerDashboardPage = lazy(() => import('@/pages/CustomerDashboardPage'));
const CustomerBookingsPage = lazy(() => import('@/pages/CustomerBookingsPage'));
const CustomerBookingDetailPage = lazy(() => import('@/pages/CustomerBookingDetailPage'));
const CustomerBookingPage = lazy(() => import('@/pages/CustomerBookingPage'));
const CustomerPaymentsPage = lazy(() => import('@/pages/CustomerPaymentsPage'));
const CustomerProfilePage = lazy(() => import('@/pages/CustomerProfilePage'));

// Lazy load non-critical pages for code splitting
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth').then(m => ({ default: m.ForgotPasswordPage })));

// Placeholder pages
const EquipmentPage = lazy(() => import('@/pages/EquipmentPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const SitesPage = lazy(() => import('@/pages/SitesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));



// Staff/Manager pages - lazy loaded (these use default exports)
const BookingManagementPage = lazy(() => import('@/pages/BookingManagementPage'));
const CheckInPage = lazy(() => import('@/pages/CheckInPage'));
const CheckOutPage = lazy(() => import('@/pages/CheckOutPage'));

// Admin pages - lazy loaded (heavy components)
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const MapsListPage = lazy(() => import('@/pages/MapsListPage'));
const MapEditor = lazy(() => import('@/pages/MapEditor'));
const UserManagementPage = lazy(() => import('@/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));

// Accessibility and PWA components - lazy loaded
const KeyboardShortcutsDialog = lazy(() => import('@/components/accessibility/KeyboardShortcutsDialog'));
const PWAInstallPrompt = lazy(() => import('@/components/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })));
const PWAUpdatePrompt = lazy(() => import('@/components/PWAUpdatePrompt').then(m => ({ default: m.PWAUpdatePrompt })));
const OfflineIndicator = lazy(() => import('@/components/OfflineIndicator').then(m => ({ default: m.OfflineIndicator })));
const PerformanceDashboard = lazy(() => import('@/components/PerformanceDashboard').then(m => ({ default: m.PerformanceDashboard })));

function App() {
  const { initialize, isAuthenticated } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Sync theme with system preferences and ensure persistence
  useThemeSync();

  // Track navigation for error monitoring
  useNavigationTracking();

  // Initialize auth state on app mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for session expiration and redirect to login
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('[App] Session expired, redirecting to login');
      // Clear auth state
      useAuthStore.getState().logout();
      // Redirect to login
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [navigate]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    enabled: isAuthenticated,
    shortcuts: [
      {
        key: 'd',
        ctrlKey: true,
        description: 'Go to Dashboard',
        handler: () => navigate('/dashboard'),
      },
      {
        key: 'p',
        ctrlKey: true,
        description: 'Go to Profile',
        handler: () => navigate('/profile'),
      },
      {
        key: 'b',
        ctrlKey: true,
        shiftKey: true,
        description: 'Toggle Sidebar',
        handler: () => toggleSidebar(),
      },
      {
        key: '?',
        shiftKey: true,
        description: 'Show Keyboard Shortcuts',
        handler: () => setShowShortcuts(true),
        preventDefault: false,
      },
    ],
  });

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes with PublicLayout (no auth required) */}
            <Route
              element={
                <PublicLayout>
                  <Outlet />
                </PublicLayout>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/sites" element={<SiteBrowsePage />} />
              <Route path="/sites/:id" element={<SiteDetailPage />} />
            </Route>

            {/* Public auth routes (only accessible when NOT authenticated) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* Guest booking routes (no auth required, but with token verification) */}
            <Route
              element={
                <PublicLayout>
                  <Outlet />
                </PublicLayout>
              }
            >
              <Route path="/book/guest" element={<GuestBookingPage />} />
              <Route path="/booking/:bookingNumber" element={<GuestBookingDetailPage />} />
              <Route path="/booking/lookup" element={<GuestBookingLookupPage />} />
              <Route path="/booking/confirm/:bookingNumber" element={<GuestBookingConfirmPage />} />
            </Route>

            {/* Unauthorized page */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Customer routes with CustomerLayout */}
            <Route
              element={
                <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
                  <CustomerLayout>
                    <Outlet />
                  </CustomerLayout>
                </ProtectedRoute>
              }
            >
              <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
              <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
              <Route path="/customer/bookings/new" element={<CustomerBookingPage />} />
              <Route path="/customer/bookings/:id" element={<CustomerBookingDetailPage />} />
              <Route path="/customer/payments" element={<CustomerPaymentsPage />} />
              <Route path="/customer/profile" element={<CustomerProfilePage />} />
            </Route>

            {/* Protected routes with AppLayout (Staff/Admin) */}
            <Route
              element={
                <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RoleBasedRedirect />} />

              {/* Dashboard - role-based routing */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />



              {/* Staff/Manager booking management routes */}
              <Route
                path="/manage/bookings"
                element={
                  <ProtectedRoute requiredRole={[UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
                    <BookingManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage/check-in"
                element={
                  <ProtectedRoute requiredRole={[UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
                    <CheckInPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage/check-out"
                element={
                  <ProtectedRoute requiredRole={[UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
                    <CheckOutPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/sites"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
                    <SitesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/maps"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
                    <MapsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/map-editor/:id"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
                    <MapEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/equipment"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.MANAGER]}>
                    <EquipmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.MANAGER]}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/maps/:id"
                element={
                  <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.MANAGER]}>
                    <MapEditor />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect based on auth status */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
      </div>

      {/* Lazy loaded components with Suspense */}
      <Suspense fallback={null}>
        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />

        {/* PWA Components */}
        <PWAInstallPrompt />
        <PWAUpdatePrompt />
        <OfflineIndicator />

        {/* Performance Dashboard (dev only) */}
        <PerformanceDashboard />
      </Suspense>
    </>
  );
}

export default App;
