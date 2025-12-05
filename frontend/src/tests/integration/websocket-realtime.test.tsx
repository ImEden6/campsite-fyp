import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '../utils/test-utils';
import { renderHook, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { useBookingEvents } from '@/hooks/useBookingEvents';
import { mockBooking } from '../utils/mock-data';
import { createMockWebSocketServer, MockWebSocketServer } from '../utils/websocket-test-utils';
import { createTestQueryClient } from '../utils/test-query-client';

// Mock Socket.io client
const mockSocket = {
  on: vi.fn((event, handler) => {
    // Store handlers for later invocation
    if (!mockSocket._handlers) {
      mockSocket._handlers = new Map();
    }
    if (!mockSocket._handlers.has(event)) {
      mockSocket._handlers.set(event, []);
    }
    mockSocket._handlers.get(event).push(handler);
  }),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  io: {
    on: vi.fn(),
  },
  _handlers: new Map(),
  _trigger: (event: string, data: any) => {
    const handlers = mockSocket._handlers.get(event) || [];
    handlers.forEach((handler: any) => handler(data));
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock WebSocket service to use our mock socket
vi.mock('@/services/websocket', () => {
  const mockService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => true),
    getStatus: vi.fn(() => 'connected'),
    on: vi.fn((event, handler) => {
      mockSocket.on(event, handler);
    }),
    off: vi.fn((event, handler) => {
      mockSocket.off(event, handler);
    }),
    emit: vi.fn(),
    subscribe: vi.fn((event, handler) => {
      mockSocket.on(event, handler);
      return () => mockSocket.off(event, handler);
    }),
  };
  
  return {
    webSocketService: mockService,
    default: mockService,
  };
});

let mockWsServer: MockWebSocketServer;

// Create wrapper component with QueryClientProvider
const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('WebSocket Real-time Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = true;
    mockSocket._handlers = new Map();
    mockWsServer = createMockWebSocketServer({ url: 'ws://localhost:3001' });
  });

  afterEach(() => {
    if (mockWsServer) {
      mockWsServer.cleanup();
    }
    mockSocket._handlers.clear();
  });

  it('should establish WebSocket connection', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.isConnected).toBe(true);
  });

  it('should handle booking created event', async () => {
    const onBookingCreated = vi.fn();
    
    renderHook(() => useBookingEvents({ onBookingCreated }), {
      wrapper: createWrapper(),
    });

    // Simulate booking created event
    const bookingCreatedHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'booking:created'
    )?.[1];

    if (bookingCreatedHandler) {
      act(() => {
        bookingCreatedHandler(mockBooking);
      });
    }

    await waitFor(() => {
      expect(onBookingCreated).toHaveBeenCalledWith(mockBooking);
    });
  });

  it('should handle booking updated event', async () => {
    const onBookingUpdated = vi.fn();
    
    renderHook(() => useBookingEvents({ onBookingUpdated }), {
      wrapper: createWrapper(),
    });

    const updatedBooking = { ...mockBooking, status: 'CHECKED_IN' as const };

    const bookingUpdatedHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'booking:updated'
    )?.[1];

    if (bookingUpdatedHandler) {
      act(() => {
        bookingUpdatedHandler(updatedBooking);
      });
    }

    await waitFor(() => {
      expect(onBookingUpdated).toHaveBeenCalledWith(updatedBooking);
    });
  });

  it('should handle payment processed event', async () => {
    const onPaymentProcessed = vi.fn();
    
    // Use correct useWebSocket API without parameters
    renderHook(() => useWebSocket());
    
    // Subscribe to payment events using useWebSocketEvent
    renderHook(() => useWebSocketEvent('payment:processed', onPaymentProcessed));

    const paymentData = {
      bookingId: mockBooking.id,
      amount: 70.0,
      status: 'COMPLETED',
    };

    // Simulate payment event from mock server
    act(() => {
      mockSocket._trigger('payment:processed', paymentData);
    });

    await waitFor(() => {
      expect(onPaymentProcessed).toHaveBeenCalledWith(paymentData);
    });
  });

  it('should reconnect on disconnect', async () => {
    renderHook(() => useWebSocket());

    // Simulate disconnect
    mockSocket.connected = false;
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'disconnect'
    )?.[1];

    if (disconnectHandler) {
      act(() => {
        disconnectHandler();
      });
    }

    // Simulate reconnect
    await waitFor(() => {
      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    unmount();

    expect(mockSocket.off).toHaveBeenCalled();
  });

  it('should handle connection timeout', async () => {
    // Simulate connection timeout by not connecting
    mockSocket.connected = false;
    
    const { result } = renderHook(() => useWebSocket());

    // Verify connection status reflects disconnected state
    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBe('disconnected');
  });

  it('should handle connection errors', async () => {
    const onError = vi.fn();
    
    renderHook(() => useWebSocket());
    renderHook(() => useWebSocketEvent('error', onError));

    const errorData = {
      message: 'Connection failed',
      code: 'CONNECTION_ERROR',
    };

    // Simulate error event
    act(() => {
      mockSocket._trigger('error', errorData);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(errorData);
    });
  });

  it('should verify connection lifecycle management', async () => {
    const { result, unmount } = renderHook(() => useWebSocket());

    // Initial state
    expect(result.current.isConnected).toBe(true);

    // Simulate disconnect
    mockSocket.connected = false;
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call) => call[0] === 'disconnect'
    )?.[1];

    if (disconnectHandler) {
      act(() => {
        disconnectHandler();
      });
    }

    // Verify disconnected state
    await waitFor(() => {
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    // Cleanup
    unmount();
    
    // Verify cleanup was called
    expect(mockSocket.off).toHaveBeenCalled();
  });

  it('should handle site status change event', async () => {
    const onSiteStatusChanged = vi.fn();
    
    // Use correct useWebSocket API without parameters
    renderHook(() => useWebSocket());
    
    // Subscribe to site status events using useWebSocketEvent
    renderHook(() => useWebSocketEvent('site:status-changed', onSiteStatusChanged));

    const siteData = {
      siteId: '1',
      status: 'OCCUPIED',
    };

    // Simulate site status change event from mock server
    act(() => {
      mockSocket._trigger('site:status-changed', siteData);
    });

    await waitFor(() => {
      expect(onSiteStatusChanged).toHaveBeenCalledWith(siteData);
    });
  });

  it('should handle notification event', async () => {
    const onNotification = vi.fn();
    
    // Use correct useWebSocket API without parameters
    renderHook(() => useWebSocket());
    
    // Subscribe to notification events using useWebSocketEvent
    renderHook(() => useWebSocketEvent('notification:new', onNotification));

    const notification = {
      id: '1',
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed',
    };

    // Simulate notification event from mock server
    act(() => {
      mockSocket._trigger('notification:new', notification);
    });

    await waitFor(() => {
      expect(onNotification).toHaveBeenCalledWith(notification);
    });
  });
});
