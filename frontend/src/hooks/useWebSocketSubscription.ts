/**
 * useWebSocketSubscription Hook
 * Advanced hook for managing WebSocket subscriptions with state
 */

import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '@/services/websocket';
import { EventHandler } from '@/services/websocket/types';

interface UseWebSocketSubscriptionOptions<T> {
  event: string;
  onData?: (data: T) => void;
  enabled?: boolean;
  initialData?: T | null;
}

interface UseWebSocketSubscriptionReturn<T> {
  data: T | null;
  lastUpdate: Date | null;
  isSubscribed: boolean;
  error: Error | null;
  subscribe: () => void;
  unsubscribe: () => void;
}

/**
 * Hook for managing WebSocket subscriptions with state management
 * Provides data, subscription status, and manual control
 * 
 * @param options - Subscription options
 * @returns Subscription state and control functions
 */
export const useWebSocketSubscription = <T = unknown>(
  options: UseWebSocketSubscriptionOptions<T>
): UseWebSocketSubscriptionReturn<T> => {
  const { event, onData, enabled = true, initialData = null } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleEvent: EventHandler<T> = useCallback(
    (eventData: T) => {
      try {
        setData(eventData);
        setLastUpdate(new Date());
        setError(null);

        // Call optional callback
        if (onData) {
          onData(eventData);
        }
      } catch (err) {
        console.error(`[useWebSocketSubscription] Error handling event ${event}:`, err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [event, onData]
  );

  const subscribe = useCallback(() => {
    if (!webSocketService.isConnected()) {
      console.warn(`[useWebSocketSubscription] Cannot subscribe to ${event}: Not connected`);
      return;
    }

    webSocketService.on(event, handleEvent);
    setIsSubscribed(true);
  }, [event, handleEvent]);

  const unsubscribe = useCallback(() => {
    webSocketService.off(event, handleEvent as EventHandler);
    setIsSubscribed(false);
  }, [event, handleEvent]);

  useEffect(() => {
    if (enabled) {
      subscribe();
    }

    return () => {
      if (enabled) {
        unsubscribe();
      }
    };
  }, [enabled, subscribe, unsubscribe]);

  return {
    data,
    lastUpdate,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
  };
};
