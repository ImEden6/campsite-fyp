# WebSocket Real-Time Communication

The Campsite Management System uses WebSocket connections (Socket.io) to provide real-time updates across the application. This enables instant notifications, live booking updates, and dynamic dashboard metrics without polling.

## Architecture

### Connection Flow

1. User authenticates via REST API and receives JWT token
2. Frontend establishes WebSocket connection with JWT in handshake
3. Backend validates token and associates connection with user
4. Events are broadcast to relevant users based on roles and permissions
5. Frontend updates UI reactively based on received events

### Reconnection Strategy

The WebSocket service implements automatic reconnection with exponential backoff:
- Initial reconnection delay: 1000ms
- Maximum reconnection delay: 5000ms
- Maximum reconnection attempts: Infinity (continuous retry)
- Exponential backoff multiplier: 1.5x

## Event Reference

### Connection Events

These events are emitted by Socket.io for connection lifecycle management:

| Event | Description | Payload |
|-------|-------------|---------|
| `connect` | Successfully connected to server | None |
| `disconnect` | Disconnected from server | Reason string |
| `connect_error` | Connection attempt failed | Error object |
| `reconnect` | Successfully reconnected | Attempt number |
| `reconnect_attempt` | Attempting to reconnect | Attempt number |
| `reconnect_error` | Reconnection attempt failed | Error object |
| `reconnect_failed` | All reconnection attempts exhausted | None |

### Booking Events

Real-time updates for booking lifecycle:

#### `booking:created`
Emitted when a new booking is created.

**Payload:**
```typescript
{
  id: string;           // Booking ID
  userId: string;       // Customer ID
  siteId: string;       // Campsite ID
  status: string;       // 'pending' | 'confirmed' | etc.
  checkInDate: string;  // ISO 8601 date
  checkOutDate: string; // ISO 8601 date
}
```

**Recipients:** Admin, Manager, Staff, Booking owner

#### `booking:updated`
Emitted when booking details are modified.

**Payload:** Same as `booking:created`

**Recipients:** Admin, Manager, Staff, Booking owner

#### `booking:cancelled`
Emitted when a booking is cancelled.

**Payload:** Same as `booking:created`

**Recipients:** Admin, Manager, Staff, Booking owner

#### `booking:checked_in`
Emitted when a guest checks in.

**Payload:** Same as `booking:created`

**Recipients:** Admin, Manager, Staff

#### `booking:checked_out`
Emitted when a guest checks out.

**Payload:** Same as `booking:created`

**Recipients:** Admin, Manager, Staff

### Payment Events

Real-time payment processing updates:

#### `payment:processed`
Emitted when a payment is successfully processed.

**Payload:**
```typescript
{
  id: string;        // Payment ID
  bookingId: string; // Associated booking
  amount: number;    // Payment amount in cents
  status: string;    // 'succeeded'
  method: string;    // 'card' | 'bank_transfer' | etc.
}
```

**Recipients:** Admin, Manager, Payment owner

#### `payment:failed`
Emitted when payment processing fails.

**Payload:** Same as `payment:processed` with `status: 'failed'`

**Recipients:** Admin, Manager, Payment owner

#### `payment:refunded`
Emitted when a payment is refunded.

**Payload:** Same as `payment:processed` with `status: 'refunded'`

**Recipients:** Admin, Manager, Payment owner

### Site Events

Real-time campsite status updates:

#### `site:status_changed`
Emitted when a site's availability status changes.

**Payload:**
```typescript
{
  id: string;     // Event ID
  siteId: string; // Site ID
  status: string; // 'available' | 'occupied' | 'maintenance' | etc.
}
```

**Recipients:** All authenticated users

#### `site:created`
Emitted when a new site is added.

**Payload:** Same as `site:status_changed`

**Recipients:** Admin, Manager, Staff

#### `site:updated`
Emitted when site details are modified.

**Payload:** Same as `site:status_changed`

**Recipients:** Admin, Manager, Staff

#### `site:deleted`
Emitted when a site is removed.

**Payload:** Same as `site:status_changed`

**Recipients:** Admin, Manager, Staff

### Notification Events

User notification system:

#### `notification:new`
Emitted when a new notification is created for a user.

**Payload:**
```typescript
{
  id: string;        // Notification ID
  userId: string;    // Recipient user ID
  type: string;      // 'info' | 'warning' | 'error' | 'success'
  title: string;     // Notification title
  message: string;   // Notification message
  read: boolean;     // Read status (always false for new)
  createdAt: string; // ISO 8601 timestamp
}
```

**Recipients:** Specific user (userId)

#### `notification:read`
Emitted when a notification is marked as read.

**Payload:** Same as `notification:new` with `read: true`

**Recipients:** Specific user (userId)

### User Events

User account updates:

#### `user:updated`
Emitted when user profile is updated.

**Payload:**
```typescript
{
  id: string;     // Event ID
  userId: string; // User ID
}
```

**Recipients:** Specific user, Admin

#### `user:status_changed`
Emitted when user account status changes.

**Payload:**
```typescript
{
  id: string;     // Event ID
  userId: string; // User ID
  status: string; // 'active' | 'inactive' | 'suspended'
}
```

**Recipients:** Specific user, Admin

### Equipment Events

Equipment rental and inventory updates:

#### `equipment:rented`
Emitted when equipment is rented.

**Payload:**
```typescript
{
  id: string;         // Event ID
  equipmentId: string; // Equipment ID
  bookingId: string;   // Associated booking
  quantity: number;    // Quantity rented
  status: string;      // 'rented'
}
```

**Recipients:** Admin, Manager, Staff

#### `equipment:returned`
Emitted when equipment is returned.

**Payload:** Same as `equipment:rented` with `status: 'returned'`

**Recipients:** Admin, Manager, Staff

#### `equipment:inventory_low`
Emitted when equipment inventory falls below threshold.

**Payload:**
```typescript
{
  id: string;         // Event ID
  equipmentId: string; // Equipment ID
  quantity: number;    // Current quantity
  status: string;      // 'low_inventory'
}
```

**Recipients:** Admin, Manager

### Analytics Events

Dashboard and metrics updates:

#### `metrics:updated`
Emitted when dashboard metrics are recalculated.

**Payload:**
```typescript
{
  type: string;              // Metric type
  data: Record<string, any>; // Metric data
  timestamp: string;         // ISO 8601 timestamp
}
```

**Recipients:** Admin, Manager

#### `dashboard:refresh`
Emitted to trigger a full dashboard refresh.

**Payload:** Same as `metrics:updated`

**Recipients:** Admin, Manager

## Frontend Integration

### Service Configuration

```typescript
import { WebSocketConfig } from '@services/websocket/types';

const config: WebSocketConfig = {
  url: env.wsUrl,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
};
```

### React Hook Pattern

```typescript
import { useEffect } from 'react';
import { webSocketService } from '@services/websocket';
import { useQueryClient } from '@tanstack/react-query';

export function useBookingUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe<BookingEventPayload>(
      'booking:created',
      (data) => {
        // Invalidate relevant queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        
        // Show toast notification
        toast.success(`New booking created: ${data.id}`);
      }
    );

    return () => unsubscribe();
  }, [queryClient]);
}
```

### Connection Status Monitoring

```typescript
import { useState, useEffect } from 'react';
import { webSocketService } from '@services/websocket';
import type { ConnectionStatus } from '@services/websocket/types';

export function useWebSocketStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const updateStatus = () => setStatus(webSocketService.getStatus());
    
    webSocketService.on('connect', updateStatus);
    webSocketService.on('disconnect', updateStatus);
    webSocketService.on('reconnecting', updateStatus);
    
    updateStatus(); // Initial status

    return () => {
      webSocketService.off('connect', updateStatus);
      webSocketService.off('disconnect', updateStatus);
      webSocketService.off('reconnecting', updateStatus);
    };
  }, []);

  return status;
}
```

## Security Considerations

### Authentication

- WebSocket connections require valid JWT token in handshake
- Tokens are validated on connection and periodically during session
- Expired tokens trigger automatic disconnection

### Authorization

- Events are filtered based on user roles and permissions
- Users only receive events they're authorized to see
- Room-based broadcasting ensures data isolation

### Rate Limiting

- Connection attempts are rate-limited per IP
- Event emission is throttled to prevent abuse
- Automatic disconnection for suspicious activity

## Performance Optimization

### Event Batching

For high-frequency events (e.g., metrics updates), consider batching:
- Collect events over a time window (e.g., 1 second)
- Send single batched event instead of multiple individual events
- Reduces network overhead and client processing

### Selective Subscriptions

Only subscribe to events relevant to current view:
- Subscribe on component mount
- Unsubscribe on component unmount
- Prevents unnecessary processing and memory leaks

### Connection Pooling

Backend uses connection pooling to handle thousands of concurrent connections:
- Redis adapter for horizontal scaling
- Sticky sessions for load balancing
- Connection state persistence across server restarts

## Troubleshooting

### Connection Issues

**Problem:** WebSocket fails to connect

**Solutions:**
- Verify JWT token is valid and not expired
- Check WebSocket URL configuration
- Ensure firewall allows WebSocket connections
- Try fallback to polling transport

### Missing Events

**Problem:** Not receiving expected events

**Solutions:**
- Verify subscription is active
- Check user has required permissions
- Confirm event is being emitted on backend
- Check browser console for errors

### Memory Leaks

**Problem:** Memory usage increases over time

**Solutions:**
- Ensure all subscriptions are cleaned up
- Use React cleanup functions in useEffect
- Avoid creating new handler functions on each render
- Monitor connection count in dev tools

## Testing

### Unit Testing

```typescript
import { webSocketService } from '@services/websocket';
import { SOCKET_EVENTS } from '@services/websocket/types';

describe('WebSocket Service', () => {
  it('should subscribe to events', () => {
    const handler = jest.fn();
    const unsubscribe = webSocketService.subscribe(
      SOCKET_EVENTS.BOOKING_CREATED,
      handler
    );
    
    // Simulate event
    webSocketService.emit(SOCKET_EVENTS.BOOKING_CREATED, { id: '123' });
    
    expect(handler).toHaveBeenCalledWith({ id: '123' });
    unsubscribe();
  });
});
```

### Integration Testing

Use Socket.io client in tests to verify end-to-end flow:

```typescript
import io from 'socket.io-client';

describe('WebSocket Integration', () => {
  let socket;

  beforeAll(() => {
    socket = io('http://localhost:5000', {
      auth: { token: 'test-jwt-token' }
    });
  });

  afterAll(() => {
    socket.disconnect();
  });

  it('should receive booking events', (done) => {
    socket.on('booking:created', (data) => {
      expect(data).toHaveProperty('id');
      done();
    });

    // Trigger booking creation via API
    createBooking({ /* ... */ });
  });
});
```

## Best Practices

1. **Always clean up subscriptions** - Use cleanup functions to prevent memory leaks
2. **Handle reconnection gracefully** - Show connection status to users
3. **Invalidate queries on events** - Keep React Query cache in sync with real-time updates
4. **Use typed events** - Leverage TypeScript for compile-time safety
5. **Batch UI updates** - Debounce rapid event sequences to avoid UI thrashing
6. **Monitor connection health** - Log connection issues for debugging
7. **Test offline scenarios** - Ensure app works when WebSocket is unavailable
8. **Implement fallback polling** - For critical features, have REST API fallback

---

*For backend WebSocket implementation details, see the backend API documentation.*
