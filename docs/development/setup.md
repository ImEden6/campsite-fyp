# Development Setup Guide

This guide covers the setup and configuration for developing the Campsite Management System.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- Docker (optional, for containerized development)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd campsite-management-system
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, shared).

### 3. Environment Configuration

#### Backend Setup

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Update the backend `.env` file with your configuration:
   - Database connection details
   - JWT secrets
   - Stripe secret key
   - Email service credentials

#### Frontend Setup

1. Copy the example environment file:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. Update the frontend `.env` file with your configuration:
   - API URL (default: http://localhost:5000/api/v1)
   - WebSocket URL (default: ws://localhost:5000)
   - Stripe public key
   - Optional: Google Maps API key, Sentry DSN

**Important**: The frontend uses a centralized environment configuration system (`frontend/src/config/env.ts`) that provides:
- Type-safe access to all environment variables
- Default values for development
- Boolean parsing for feature flags
- Environment detection (development, production, test)

All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

### 4. Database Setup

```bash
npm run setup:db
```

This will:
- Create the database
- Run migrations
- Seed initial data

### 5. Start Development Servers

#### Option 1: Start All Services

```bash
npm run dev
```

This starts both frontend and backend concurrently.

#### Option 2: Start Services Individually

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run dev
```

## Frontend Configuration

### Environment Variables

The frontend uses Vite's environment variable system with type-safe access through `@config/env`:

```typescript
import { env } from '@config';

// API Configuration
env.apiUrl        // Backend API URL
env.wsUrl         // WebSocket server URL

// Application
env.appName       // Application name
env.appVersion    // Version number
env.environment   // Current environment

// Third-party Services
env.stripePublicKey    // Stripe public key
env.googleMapsApiKey   // Google Maps API key (optional)
env.sentryDsn          // Sentry DSN (optional)

// Feature Flags
env.enablePWA          // Enable PWA features
env.enableAnalytics    // Enable analytics

// Environment Detection
env.isDevelopment      // true in development
env.isProduction       // true in production
env.isTest             // true in test
```

### Mock Authentication (Development Only)

For frontend development without a running backend, the system includes a mock authentication service that simulates the login flow with predefined test users.

**Enabling Mock Auth:**

Set the environment variable in `frontend/.env`:
```env
VITE_USE_MOCK_AUTH=true
```

**Mock Users:**
- Admin: `admin@campsite.com` / `admin123`
- Customer: `user@campsite.com` / `user123`

**Features:**
- Simulates network delay (500ms)
- Returns properly typed user and token data
- Validates credentials against mock database
- Provides realistic error messages for invalid credentials

**Usage:**
```typescript
import { mockLogin, shouldUseMockAuth } from '@services/api/mock-auth';

if (shouldUseMockAuth()) {
  const response = await mockLogin(email, password);
  // Returns: { user: User, tokens: AuthTokens }
}
```

**When to Use:**
- Frontend development without backend
- UI/UX testing and prototyping
- Component development in isolation
- Demo environments

**Important:** Mock auth is only available in development mode and will not work in production builds.

For complete mock authentication documentation, see the [Mock Authentication Guide](./mock-auth.md).

### Path Aliases

The following import aliases are configured:

```typescript
@/           // src/
@components  // src/components
@hooks       // src/hooks
@utils       // src/utils
@stores      // src/stores
@services    // src/services
@types       // src/types
@config      // src/config
@assets      // src/assets
@styles      // src/styles
```

### TypeScript Configuration

- Strict mode enabled
- Path aliases configured
- Type checking for unused variables and parameters
- No implicit returns

### API Service Layer

The frontend uses a type-safe API client for all backend communication. API services are organized by feature domain:

- **Authentication** (`@services/api/auth`) - Login, registration, token management
- **Bookings** (`@services/api/bookings`) - Booking CRUD and availability
- **Maps** (`@services/api/maps`) - Interactive map editor and module management
- **Equipment** (`@services/api/equipment`) - Equipment inventory, rentals, and availability
- **Payments** (`@services/api/payments`) - Payment processing and refunds
- **Users** (`@services/api/users`) - User management and profiles

**Type Definitions** (`@services/api/types` and `@types`):
```typescript
import type { ApiResponse, PaginatedResponse, ApiError } from '@services/api/types';
import type { User, UserRole, LoginCredentials, LoginResponse } from '@types';

// Authentication
const credentials: LoginCredentials = { email: 'user@example.com', password: 'pass' };
const loginResponse: LoginResponse = await api.post('/auth/login', credentials);
const user: User = loginResponse.user;
const role: UserRole = user.role; // 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

// Standard response
const currentUser: ApiResponse<User> = await api.get('/users/me');

// Paginated response
const bookings: PaginatedResponse<Booking> = await api.get('/bookings');

// Error handling
try {
  await api.post('/bookings', data);
} catch (error) {
  const apiError = error as ApiError;
  // Handle error with statusCode, message, and validation errors
}
```

**Key Features**:
- Generic type support for type-safe responses
- Strongly-typed user roles and authentication flow
- Standardized error handling with validation error support
- Pagination metadata included in paginated responses
- Authentication token management with refresh flow
- Automatic request/response interceptors for auth tokens

### WebSocket Service Layer

The frontend includes a comprehensive WebSocket service for real-time updates:

**Type Definitions** (`@services/websocket/types`):
```typescript
import { webSocketService } from '@services/websocket';
import { SOCKET_EVENTS } from '@services/websocket/types';
import type { BookingEventPayload, ConnectionStatus } from '@services/websocket/types';

// Connect with authentication
webSocketService.connect(authToken);

// Subscribe to events with typed payloads
const unsubscribe = webSocketService.subscribe<BookingEventPayload>(
  SOCKET_EVENTS.BOOKING_CREATED,
  (data) => {
    console.log('New booking:', data.id, data.siteId);
  }
);

// Check connection status
const status: ConnectionStatus = webSocketService.getStatus();

// Clean up
unsubscribe();
```

**Event Categories**:
- **Booking Events**: created, updated, cancelled, checked_in, checked_out
- **Payment Events**: processed, failed, refunded
- **Site Events**: status_changed, created, updated, deleted
- **Notification Events**: new, read
- **User Events**: updated, status_changed
- **Equipment Events**: rented, returned, inventory_low
- **Analytics Events**: metrics_updated, dashboard_refresh

**Key Features**:
- 20+ strongly-typed event definitions
- Automatic reconnection with exponential backoff
- Connection status tracking (connected, disconnected, connecting, reconnecting, error)
- Subscription management with cleanup support
- Type-safe event payloads for compile-time safety
- Configurable reconnection strategy

For complete WebSocket documentation, see [WebSocket API Reference](../api/websocket.md).

## Backend Configuration

### Environment Variables

See `backend/.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `PORT`: Server port (default: 5000)

## Development Workflow

### Code Style

The project uses:
- ESLint for linting
- Prettier for code formatting
- TypeScript strict mode

Run linting:
```bash
npm run lint
```

### Testing

Run tests:
```bash
npm run test
```

### Database Migrations

Create a new migration:
```bash
cd backend
npx prisma migrate dev --name migration_name
```

Apply migrations:
```bash
npx prisma migrate deploy
```

### Building for Production

Build all packages:
```bash
npm run build
```

Build frontend only:
```bash
cd frontend
npm run build
```

Build backend only:
```bash
cd backend
npm run build
```

## Docker Development

### Start with Docker Compose

```bash
docker-compose -f docker/docker-compose.dev.yml up
```

This starts:
- PostgreSQL database
- Backend API server
- Frontend development server
- Nginx reverse proxy

### Stop Services

```bash
docker-compose -f docker/docker-compose.dev.yml down
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 5000 are already in use:

1. Change the port in the respective `.env` file
2. Update the proxy configuration in `vite.config.ts` if needed
3. Restart the development server

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check database credentials in `backend/.env`
3. Ensure the database exists
4. Check firewall settings

### Environment Variables Not Loading

Frontend:
1. Ensure variables are prefixed with `VITE_`
2. Restart the Vite dev server
3. Check `frontend/src/config/env.ts` for proper mapping

Backend:
1. Verify `.env` file exists in `backend/` directory
2. Check for syntax errors in `.env` file
3. Restart the backend server

### Module Not Found Errors

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Clear build cache:
   ```bash
   npm run clean
   npm run build
   ```

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prisma

### Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Next Steps

- Review the [Architecture Overview](./architecture.md)
- Read the [Coding Standards](./coding-standards.md)
- Check the [API Documentation](../api/README.md)
- Explore the [Testing Guidelines](./testing.md)

