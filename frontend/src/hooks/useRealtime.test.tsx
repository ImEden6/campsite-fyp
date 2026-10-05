import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { handlers, serviceMock, authState } = vi.hoisted(() => {
  const handlers = new Map<string, (data: unknown) => void>();
  return {
    handlers,
    serviceMock: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribe: vi.fn((event: string, handler: (data: unknown) => void) => {
        handlers.set(event, handler);
        return () => handlers.delete(event);
      }),
    },
    authState: { user: null as null | { id: string }, tokens: null as null | { accessToken: string } },
  };
});

vi.mock('@/services/websocket', () => ({ webSocketService: serviceMock }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

import { useRealtime } from './useRealtime';
import { queryKeys } from '@/config/query-keys';

const setup = (options: Parameters<typeof useRealtime>[0] = {}) => {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const setData = vi.spyOn(queryClient, 'setQueryData');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useRealtime(options), { wrapper });
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey));
  return { ...hook, invalidate, setData, invalidatedKeys };
};

const emit = (event: string, data: unknown) => act(() => handlers.get(event)?.(data));

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    authState.user = { id: 'u-1' };
    authState.tokens = { accessToken: 'token-1' };
  });

  describe('connection', () => {
    it('connects with the access token while signed in, and disconnects on unmount', () => {
      const { unmount } = setup();

      expect(serviceMock.connect).toHaveBeenCalledWith('token-1');

      unmount();
      expect(serviceMock.disconnect).toHaveBeenCalled();
    });

    it('does not connect or subscribe when signed out', () => {
      authState.user = null;
      authState.tokens = null;
      setup();

      expect(serviceMock.connect).not.toHaveBeenCalled();
      expect(handlers.size).toBe(0);
    });
  });

  describe('booking events', () => {
    it.each([
      ['booking:created'],
      ['booking:updated'],
      ['booking:confirmed'],
      ['booking:cancelled'],
      ['booking:checked_in'],
      ['booking:checked_out'],
    ])('refetches the booking and booking lists on %s', (event) => {
      const { invalidatedKeys } = setup();

      emit(event, { id: 'b-1', status: 'X' });

      expect(invalidatedKeys()).toContain(JSON.stringify(queryKeys.bookings.all));
    });

    it('never overwrites the cached booking with the small event payload', () => {
      const { setData } = setup();

      emit('booking:updated', { id: 'b-1', status: 'CONFIRMED' }); // only a few fields

      expect(setData).not.toHaveBeenCalled();
    });

    it('refetches that booking\'s detail on confirm', () => {
      const { invalidatedKeys } = setup();

      emit('booking:confirmed', { id: 'b-7' });

      expect(invalidatedKeys()).toContain(JSON.stringify(queryKeys.bookings.detail('b-7')));
    });

    it('calls onBookingConfirmed with the event', () => {
      const onBookingConfirmed = vi.fn();
      setup({ onBookingConfirmed });

      emit('booking:confirmed', { id: 'b-1', bookingNumber: 'BK-1' });

      expect(onBookingConfirmed).toHaveBeenCalledWith({ id: 'b-1', bookingNumber: 'BK-1' });
    });
  });

  describe('payment events', () => {
    it.each([['payment:processed'], ['payment:failed'], ['payment:refunded']])(
      'refetches payments and the paid booking on %s',
      (event) => {
        const { invalidatedKeys } = setup();

        emit(event, { id: 'p-1', bookingId: 'b-9', amount: 10, status: 'PAID' });

        const keys = invalidatedKeys();
        expect(keys).toContain(JSON.stringify(queryKeys.payments.all));
        expect(keys).toContain(JSON.stringify(queryKeys.bookings.detail('b-9')));
      }
    );

    it('reports failed and refunded payments to the caller', () => {
      const onPaymentFailed = vi.fn();
      const onPaymentRefunded = vi.fn();
      setup({ onPaymentFailed, onPaymentRefunded });

      emit('payment:failed', { id: 'p-1', bookingId: 'b-1' });
      emit('payment:refunded', { id: 'p-2', bookingId: 'b-1' });

      expect(onPaymentFailed).toHaveBeenCalledWith({ id: 'p-1', bookingId: 'b-1' });
      expect(onPaymentRefunded).toHaveBeenCalledWith({ id: 'p-2', bookingId: 'b-1' });
    });

    it('survives a malformed payment event', () => {
      setup();

      expect(() => emit('payment:processed', undefined)).not.toThrow();
    });
  });
});
