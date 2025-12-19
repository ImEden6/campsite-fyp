# Routing System

The frontend uses React Router v6 for client-side routing with role-based access control and protected routes.

## Route Structure

All routes are defined in `frontend/src/App.tsx` using a declarative structure with nested routes and route protection.

## Route Categories

### Public Routes

Public routes are only accessible when the user is NOT authenticated. Authenticated users are automatically redirected to the dashboard.

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | User login form |
| `/register` | `RegisterPage` | New user registration |
| `/forgot-password` | `ForgotPasswordPage` | Password reset request |

**Implementation:**
```typescript
<Route
  path="/login"
  element={
    <PublicRoute>
      <LoginPage />
    </PublicRoute>
  }
/>
```

### Protected Routes

All protected routes require authentication. Unauthenticated users are redirected to `/login`.

#### Common Routes (All Authenticated Users)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Redirect to `/dashboard` | Root redirect |
| `/dashboard` | `Dashboard` | Main dashboard |
| `/profile` | `ProfilePage` | User profile management |
| `/notifications` | `NotificationsPage` | User notifications |

#### Customer Routes

Restricted to users with `CUSTOMER` role.

| Path | Component | Description |
|------|-----------|-------------|
| `/my-bookings` | `MyBookingsPage` | Customer's booking history |
| `/browse-sites` | `BrowseSitesPage` | Browse available campsites |
| `/book` | `BookingPage` | Create new booking |

**Implementation:**
```typescript
<Route
  path="/my-bookings"
  element={
    <ProtectedRoute requiredRole={[UserRole.CUSTOMER]}>
      <MyBookingsPage />
    </ProtectedRoute>
  }
/>
```

#### Staff/Manager Routes

Restricted to users with `STAFF`, `MANAGER`, or `ADMIN` roles.

| Path | Component | Description |
|------|-----------|-------------|
| `/manage/bookings` | `BookingManagementPage` | Manage all bookings |
| `/manage/check-in` | `CheckInPage` | Guest check-in interface |
| `/manage/check-out` | `CheckOutPage` | Guest check-out interface |

**Implementation:**
```typescript
<Route
  path="/manage/bookings"
  element={
    <ProtectedRoute requiredRole={[UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
      <BookingManagementPage />
    </ProtectedRoute>
  }
/>
```

#### Admin Routes

Restricted to users with `ADMIN` role only.

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/users` | `UserManagementPage` | User management interface |
| `/admin/map-editor` | `MapEditor` | Interactive campsite map editor |
| `/admin/dashboard` | `AdminDashboardPage` | Analytics dashboard |
| `/admin/reports` | `ReportsPage` | Report generation |
| `/admin/equipment` | `EquipmentManagementPage` | Equipment inventory management |

**Implementation:**
```typescript
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <UserManagementPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/map-editor"
  element={
    <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
      <MapEditor />
    </ProtectedRoute>
  }
/>
```

#### Admin/Manager Routes

Restricted to users with `ADMIN` or `MANAGER` roles.

| Path | Component | Description |
|------|-----------|-------------|
| `/maps/:id` | `MapEditor` | View/edit specific map |

### Error Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/unauthorized` | `UnauthorizedPage` | Access denied page |
| `*` | Redirect to `/login` | Catch-all for undefined routes |

## Route Protection

### ProtectedRoute Component

The `ProtectedRoute` component from `@/features/auth` handles authentication and authorization:

**Features:**
- Checks if user is authenticated
- Validates user role against required roles
- Redirects to `/login` if not authenticated
- Redirects to `/unauthorized` if insufficient permissions
- Wraps protected content

**Usage:**
```typescript
import { ProtectedRoute } from '@/features/auth';
import { UserRole } from '@/types';

// Require authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Require specific role
<ProtectedRoute requiredRole={[UserRole.ADMIN]}>
  <AdminPanel />
</ProtectedRoute>

// Require one of multiple roles
<ProtectedRoute requiredRole={[UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]}>
  <BookingManagement />
</ProtectedRoute>
```

### PublicRoute Component

The `PublicRoute` component ensures routes are only accessible to unauthenticated users:

**Features:**
- Checks if user is NOT authenticated
- Redirects authenticated users to `/dashboard`
- Allows access to login, register, and password reset pages

**Usage:**
```typescript
import { PublicRoute } from '@/features/auth';

<PublicRoute>
  <LoginPage />
</PublicRoute>
```

## Layout System

Protected routes use the `AppLayout` component which provides:
- Navigation sidebar
- Header with user menu
- Main content area
- Responsive design

**Implementation:**
```typescript
<Route
  element={
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  }
>
  {/* Nested routes render inside AppLayout */}
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile" element={<ProfilePage />} />
</Route>
```

## User Roles

The system supports four user roles defined in `@/types`:

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}
```

### Role Hierarchy

- **ADMIN**: Full system access, all routes available
- **MANAGER**: Operational management, booking oversight, map viewing
- **STAFF**: Day-to-day operations, check-in/out, booking management
- **CUSTOMER**: Self-service booking and account management

## Navigation

### Programmatic Navigation

Use React Router's `useNavigate` hook:

```typescript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/dashboard');
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### Link Components

Use React Router's `Link` component for navigation:

```typescript
import { Link } from 'react-router-dom';

<Link to="/my-bookings">View My Bookings</Link>
```

## Route Parameters

Dynamic routes use URL parameters:

```typescript
// Route definition
<Route path="/maps/:id" element={<MapEditor />} />

// Access parameter in component
import { useParams } from 'react-router-dom';

function MapEditor() {
  const { id } = useParams();
  // Use id to fetch map data
}
```

## Animation

Routes use Framer Motion for smooth transitions:

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <Routes>
    {/* Route definitions */}
  </Routes>
</motion.div>
```

## Authentication Flow

1. User visits protected route
2. `ProtectedRoute` checks authentication status
3. If not authenticated → redirect to `/login`
4. User logs in successfully
5. Auth store updates with user data and token
6. User redirected to originally requested route or `/dashboard`
7. If user lacks required role → redirect to `/unauthorized`

## Best Practices

1. **Always use route protection**: Never expose sensitive routes without `ProtectedRoute`
2. **Role-based access**: Use `requiredRole` prop to restrict access by user role
3. **Lazy loading**: Consider lazy loading route components for better performance
4. **Breadcrumbs**: Implement breadcrumb navigation for complex route hierarchies
5. **Route guards**: Validate data before allowing navigation (e.g., unsaved changes)
6. **Error boundaries**: Wrap routes in error boundaries to handle component errors
7. **SEO**: Use React Helmet or similar for dynamic page titles and meta tags

## Adding New Routes

To add a new route:

1. **Create the page component** in `frontend/src/pages/`
2. **Import the component** in `App.tsx`
3. **Add route definition** with appropriate protection:
   ```typescript
   <Route
     path="/new-route"
     element={
       <ProtectedRoute requiredRole={[UserRole.ADMIN]}>
         <NewPage />
       </ProtectedRoute>
     }
   />
   ```
4. **Update navigation** in `AppLayout` or relevant components
5. **Add to documentation** (this file and user guide)

## Testing Routes

Route testing should cover:
- Authenticated vs unauthenticated access
- Role-based access control
- Redirects work correctly
- Route parameters are parsed correctly
- Navigation between routes

Example test:
```typescript
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('redirects to login when not authenticated', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
```

## Related Documentation

- [Authentication System](./authentication.md)
- [User Roles and Permissions](../user-guide/getting-started.md#user-roles)
- [Frontend Configuration](../../frontend/CONFIG.md)
- [Development Setup](./setup.md)
