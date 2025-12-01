/**
 * useWebSocketEvent Hook
 * React hook for subscribing to WebSocket events
 */

import { useEffect, useRef } from 'react';
import type { DependencyList } from 'react';
import { webSocketService } from '@/services/websocket';
import { EventHandler } from '@/services/websocket/types';

interface WebSocketEventOptions {
  deps?: DependencyList;
  enabled?: boolean;
}

/**
 * Hook for subscribing to WebSocket events
 * Automatically handles cleanup on unmount
 * 
 * @param event - Event name to subscribe to
 * @param handler - Event handler function
 * @param deps - Dependencies array for handler (optional)
 */
export const useWebSocketEvent = <T = unknown>(
  event: string,
  handler: EventHandler<T>,
  depsOrOptions: DependencyList | WebSocketEventOptions = []
) => {
  let deps: DependencyList;
  let enabled: boolean;

  if (Array.isArray(depsOrOptions)) {
    deps = depsOrOptions;
    enabled = true;
  } else {
    const options = depsOrOptions as WebSocketEventOptions;
    deps = options.deps ?? [];
    enabled = options.enabled ?? true;
  }

  const handlerRef = useRef(handler);
  const depsRef = useRef<DependencyList>(deps);

  useEffect(() => {
    depsRef.current = deps;
  }, [deps]);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Wrapper to use latest handler
    const eventHandler = (data: T) => {
      handlerRef.current(data);
    };

    // Subscribe to event
    const unsubscribe = webSocketService.subscribe(event, eventHandler);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [event, enabled]);
};
