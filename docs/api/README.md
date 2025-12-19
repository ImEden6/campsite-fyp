# API Documentation

This directory contains the API documentation for the Campsite Management System.

## Documentation Index

- **[WebSocket Real-Time Events](./websocket.md)** - Complete WebSocket event reference and integration guide
- **[Bookings API](./bookings.md)** - Booking management, modifications, cancellations, and check-in/out
- **[Users API](./users.md)** - User management, roles, activity tracking, and authentication
- **[Maps API](./maps.md)** - Campsite map management and interactive module placement
- **[Equipment API](./equipment.md)** - Equipment inventory, rentals, and availability management
- **[Analytics API](./analytics.md)** - Analytics, reporting, and business intelligence
- **REST API Reference** - HTTP endpoints for all features (below)

## Overview

Our API allows you to programmatically access the various features of the Campsite Management System, such as booking, payment processing, user management, and more. The system provides both REST API endpoints and WebSocket connections for real-time updates.

## Authentication

All API requests require authentication. Use JSON Web Tokens (JWT) to authenticate against our API.

### Login

**Endpoint**: `/api/v1/auth/login`

**Method**: POST

**Body**:
- `email`: User email address
- `password`: User password

**Response**:
- `token`: JWT for authenticated requests

## Usage

### Booking Management

For comprehensive booking management documentation, see **[Bookings API Documentation](./bookings.md)**.

**Key Features**:
- Create, update, and cancel bookings
- Real-time availability checking
- Price calculation with equipment rentals
- Refund calculation based on cancellation policy
- Check-in/check-out processing
- QR code generation for contactless check-in
- Booking modification with price recalculation

**Quick Example**:

```typescript
import { createBooking, updateBooking, cancelBooking } from '@/services/api/bookings';

// Create a new booking
const booking = await createBooking({
  siteId: 'site_789',
  checkInDate: '2025-10-20',
  checkOutDate: '2025-10-23',
  adults: 2,
  children: 1,
  vehicles: [{ type: 'CAR', licensePlate: 'ABC123' }]
});

// Modify booking dates
const updated = await updateBooking('booking_123', {
  checkInDate: '2025-10-21',
  checkOutDate: '2025-10-24'
});

// Cancel with refund calculation
const cancelled = await cancelBooking('booking_123', {
  reason: 'Change of plans'
});
```

### Payment Processing

**Endpoint**: `/api/v1/payments/charge`

**Method**: POST

**Body**:
- `amount`: Payment amount
- `currency`: Currency code (e.g., USD)
- `source`: Payment source (e.g., Stripe token)

**Response**:
- `paymentId`: Unique payment identifier
- `status`: Payment status

### User Management

For comprehensive user management documentation, see **[Users API Documentation](./users.md)**.

**Key Features**:
- User CRUD operations with filtering and pagination
- Role management (ADMIN, MANAGER, STAFF, CUSTOMER)
- Password management and resets
- Activity and login history tracking
- Avatar upload and management
- Email verification

**Quick Example**:

```typescript
import { getUsers, createUser } from '@/services/api/users';

// Get all active staff members
const staff = await getUsers({
  role: ['STAFF'],
  isActive: true
});

// Create a new user
const newUser = await createUser({
  email: 'staff@campsite.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'STAFF',
  password: 'SecurePassword123!'
});
```

## Error Handling

Errors are returned using standard HTTP error codes.

### Common Errors

- 400 Bad Request: Invalid request
- 401 Unauthorized: Unauthorized access
- 404 Not Found: Resource not found
- 500 Internal Server Error: Server error

## Rate Limiting

APIs are rate-limited to prevent abuse. Please adhere to the defined limits.

### Rate Limit Headers

- `X-RateLimit-Limit`: The maximum number of requests that the consumer is permitted to make per time window.
- `X-RateLimit-Remaining`: Number of requests remaining in the current rate limit window.
- `X-RateLimit-Reset`: The remaining time (in seconds) before the rate limit resets.

## WebSocket Real-Time Events

The system uses WebSocket connections (Socket.io) for real-time updates across the application. All events are strongly typed for compile-time safety.

### Connection Management

The WebSocket service automatically handles:
- Connection establishment with JWT authentication
- Automatic reconnection with exponential backoff
- Connection status tracking (connected, disconnected, connecting, reconnecting, error)
- Event subscription management

### Event Categories

#### Booking Events
- `booking:created` - New booking created
- `booking:updated` - Booking details modified
- `booking:cancelled` - Booking cancelled
- `booking:checked_in` - Guest checked in
- `booking:checked_out` - Guest checked out

#### Payment Events
- `payment:processed` - Payment successfully processed
- `payment:failed` - Payment processing failed
- `payment:refunded` - Payment refunded

#### Site Events
- `site:status_changed` - Site availability status changed
- `site:created` - New site added
- `site:updated` - Site details modified
- `site:deleted` - Site removed

#### Notification Events
- `notification:new` - New notification for user
- `notification:read` - Notification marked as read

#### User Events
- `user:updated` - User profile updated
- `user:status_changed` - User status changed

#### Equipment Events
- `equipment:rented` - Equipment rented
- `equipment:returned` - Equipment returned
- `equipment:inventory_low` - Low inventory warning

#### Analytics Events
- `metrics:updated` - Dashboard metrics updated
- `dashboard:refresh` - Dashboard data refresh triggered

### Event Payload Types

All events include strongly-typed payloads:

```typescript
// Booking events
interface BookingEventPayload {
  id: string;
  userId: string;
  siteId: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
}

// Payment events
interface PaymentEventPayload {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  method: string;
}

// Notification events
interface NotificationEventPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

### Usage Example

```typescript
import { webSocketService } from '@services/websocket';

// Connect with authentication
webSocketService.connect(authToken);

// Subscribe to booking updates
const unsubscribe = webSocketService.subscribe<BookingEventPayload>(
  'booking:created',
  (data) => {
    console.log('New booking:', data);
    // Update UI, invalidate queries, etc.
  }
);

// Clean up subscription
unsubscribe();

// Check connection status
const status = webSocketService.getStatus(); // 'connected' | 'disconnected' | etc.
```

## Frontend API Client

The frontend uses a type-safe API client built with TypeScript and Axios. All API interactions are strongly typed to ensure compile-time safety.

### Core Types

#### ApiResponse<T>
Standard response wrapper for successful API calls:
```typescript
interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}
```

#### PaginatedResponse<T>
Response format for paginated data:
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  success: boolean;
  message?: string;
}
```

#### ApiError
Standardized error format:
```typescript
interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;  // Validation errors
  code?: string;                       // Error code
}
```

#### Authentication Types
```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
```

#### User Types
```typescript
type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Booking Filter Types
```typescript
interface BookingFilters {
  status?: string[];
  dateRange?: { start: Date; end: Date };
  siteType?: string[];
  searchTerm?: string;
}
```

#### UI State Types
```typescript
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
```

### Usage Example

```typescript
import { apiClient } from '@services/api';
import type { ApiResponse, PaginatedResponse } from '@services/api/types';

// Single resource
const response: ApiResponse<User> = await apiClient.get('/users/123');

// Paginated data
const bookings: PaginatedResponse<Booking> = await apiClient.get('/bookings', {
  params: { page: 1, limit: 20 }
});

// Error handling
try {
  await apiClient.post('/bookings', bookingData);
} catch (error) {
  const apiError = error as ApiError;
  console.error(apiError.message);
  if (apiError.errors) {
    // Handle validation errors
  }
}
```

## Changelog

Keep track of changes to the API.

### Version 1.0.0
- Initial release
- Added type-safe frontend API client with TypeScript interfaces

