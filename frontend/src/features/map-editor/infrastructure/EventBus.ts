/**
 * Event Bus
 * Type-safe event bus for map editor communication
 */

import type {
  MapEditorEvents,
  MapEditorEventName,
  MapEditorEventHandler,
} from '../core/events';

type EventListener = {
  handler: EventHandler;
  once?: boolean;
};

/**
 * Event Bus implementation with type-safe event handling
 */
export class EventBus {
  private listeners = new Map<MapEditorEventName, Set<EventListener>>();
  private eventHistory: Array<{ event: MapEditorEventName; payload: unknown; timestamp: number }> = [];
  private maxHistorySize = 100;

  /**
   * Emit an event
   */
  emit<T extends MapEditorEventName>(
    event: T,
    payload: MapEditorEvents[T]
  ): void {
    // Add to history
    this.eventHistory.push({
      event,
      payload,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const listenersToRemove: EventListener[] = [];
      
      eventListeners.forEach((listener) => {
        try {
          listener.handler(payload);
          
          // Remove one-time listeners
          if (listener.once) {
            listenersToRemove.push(listener);
          }
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });

      // Clean up one-time listeners
      listenersToRemove.forEach((listener) => {
        eventListeners.delete(listener);
      });
    }
  }

  /**
   * Subscribe to an event
   */
  on<T extends MapEditorEventName>(
    event: T,
    handler: MapEditorEventHandler<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listener: EventListener = { handler: handler as EventHandler };
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once<T extends MapEditorEventName>(
    event: T,
    handler: MapEditorEventHandler<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listener: EventListener = {
      handler: handler as EventHandler,
      once: true,
    };
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends MapEditorEventName>(
    event: T,
    handler: MapEditorEventHandler<T>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        if (listener.handler === handler) {
          eventListeners.delete(listener);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: MapEditorEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get event history
   */
  getHistory(): Array<{ event: MapEditorEventName; payload: unknown; timestamp: number }> {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: MapEditorEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all event names with listeners
   */
  eventNames(): MapEditorEventName[] {
    return Array.from(this.listeners.keys());
  }
}

/**
 * Create a new EventBus instance
 */
export function createEventBus(): EventBus {
  return new EventBus();
}

