/**
 * Event Bus
 * Robust, type-safe event bus for map editor communication
 */

import type {
  MapEditorEvents,
  MapEditorEventName,
  MapEditorEventHandler,
  EventHandler,
} from '../core/events';

type EventListener = {
  handler: EventHandler;
  once?: boolean;
  priority?: number; // Higher priority = processed first
  id?: string; // For debugging
};

interface EventBusConfig {
  maxHistorySize?: number;
  maxRetries?: number;
  retryDelay?: number;
  maxListenersPerEvent?: number;
  batchInterval?: number; // ms - batch events within this interval
  debounceDelay?: number; // ms - debounce high-frequency events
  enableDeadLetterQueue?: boolean;
  enablePerformanceTracking?: boolean;
  enableTracing?: boolean;
  errorHandler?: (error: Error, event: MapEditorEventName, payload: unknown) => void;
}

interface DeadLetterEvent {
  event: MapEditorEventName;
  payload: unknown;
  timestamp: number;
  error: Error;
  retryCount: number;
}

interface PerformanceMetric {
  event: MapEditorEventName;
  handlerCount: number;
  totalTime: number;
  callCount: number;
  averageTime: number;
  maxTime: number;
}

interface BatchedEvent {
  event: MapEditorEventName;
  payload: unknown;
  timestamp: number;
}

/**
 * Event Bus implementation with type-safe event handling and robustness features
 */
export class EventBus {
  private listeners = new Map<MapEditorEventName, Set<EventListener>>();
  private eventHistory: Array<{ event: MapEditorEventName; payload: unknown; timestamp: number }> = [];
  private deadLetterQueue: DeadLetterEvent[] = [];
  private performanceMetrics = new Map<MapEditorEventName, PerformanceMetric>();
  private eventTrace: Array<{ event: MapEditorEventName; action: 'emit' | 'handled' | 'error'; timestamp: number }> = [];
  
  // Batching and debouncing
  private batchedEvents = new Map<MapEditorEventName, BatchedEvent[]>();
  private batchTimers = new Map<MapEditorEventName, NodeJS.Timeout>();
  private debounceTimers = new Map<MapEditorEventName, NodeJS.Timeout>();
  private lastEmittedEvents = new Map<MapEditorEventName, number>();
  
  private config: Required<EventBusConfig>;
  private listenerIdCounter = 0;
  
  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxHistorySize: config.maxHistorySize ?? 100,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 100,
      maxListenersPerEvent: config.maxListenersPerEvent ?? 50,
      batchInterval: config.batchInterval ?? 16, // ~60fps
      debounceDelay: config.debounceDelay ?? 100,
      enableDeadLetterQueue: config.enableDeadLetterQueue ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? process.env.NODE_ENV === 'development',
      enableTracing: config.enableTracing ?? process.env.NODE_ENV === 'development',
      errorHandler: config.errorHandler ?? ((error, event) => {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }),
    };
  }

  /**
   * Emit an event
   * Supports batching and debouncing for high-frequency events
   */
  emit<T extends MapEditorEventName>(
    event: T,
    payload: MapEditorEvents[T],
    options?: {
      immediate?: boolean; // Skip batching/debouncing
      priority?: number; // Higher priority = processed first
    }
  ): void {
    const now = Date.now();
    
    // Track event for tracing
    if (this.config.enableTracing) {
      this.eventTrace.push({ event, action: 'emit', timestamp: now });
      // Limit trace size
      if (this.eventTrace.length > 1000) {
        this.eventTrace.shift();
      }
    }

    // Handle batching for high-frequency events (e.g., viewport:change)
    if (!options?.immediate && this.shouldBatch(event)) {
      this.batchEvent(event, payload, now);
      return;
    }

    // Handle debouncing for rapid-fire events
    if (!options?.immediate && this.shouldDebounce(event)) {
      this.debounceEvent(event, payload, now);
      return;
    }

    // Process event immediately
    this.processEvent(event, payload, now);
  }

  /**
   * Process an event (internal method)
   */
  private processEvent<T extends MapEditorEventName>(
    event: T,
    payload: MapEditorEvents[T],
    timestamp: number
  ): void {
    // Add to history
    this.eventHistory.push({
      event,
      payload,
      timestamp,
    });

    // Limit history size
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get listeners and sort by priority (higher first)
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    // Convert to array and sort by priority
    const sortedListeners = Array.from(eventListeners).sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });

    const listenersToRemove: EventListener[] = [];
    const startTime = this.config.enablePerformanceTracking ? performance.now() : 0;

    // Process listeners
    sortedListeners.forEach((listener) => {
      try {
        const handlerStartTime = this.config.enablePerformanceTracking ? performance.now() : 0;
        
        listener.handler(payload);
        
        // Track performance
        if (this.config.enablePerformanceTracking) {
          const handlerTime = performance.now() - handlerStartTime;
          this.updatePerformanceMetric(event, handlerTime);
        }
        
        // Remove one-time listeners
        if (listener.once) {
          listenersToRemove.push(listener);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        // Call error handler
        this.config.errorHandler(err, event, payload);
        
        // Add to dead letter queue if enabled
        if (this.config.enableDeadLetterQueue) {
          this.addToDeadLetterQueue(event, payload, err);
        }
        
        // Track error in trace
        if (this.config.enableTracing) {
          this.eventTrace.push({ event, action: 'error', timestamp: Date.now() });
        }
      }
    });

    // Clean up one-time listeners
    listenersToRemove.forEach((listener) => {
      eventListeners.delete(listener);
    });

    // Track completion
    if (this.config.enableTracing) {
      this.eventTrace.push({ event, action: 'handled', timestamp: Date.now() });
    }

    // Update performance metric
    if (this.config.enablePerformanceTracking && startTime > 0) {
      const totalTime = performance.now() - startTime;
      this.updatePerformanceMetric(event, totalTime);
    }
  }

  /**
   * Check if event should be batched
   */
  private shouldBatch(event: MapEditorEventName): boolean {
    // Batch high-frequency events
    const batchableEvents: MapEditorEventName[] = ['viewport:change'];
    return batchableEvents.includes(event);
  }

  /**
   * Batch an event
   */
  private batchEvent<T extends MapEditorEventName>(
    event: T,
    payload: MapEditorEvents[T],
    timestamp: number
  ): void {
    if (!this.batchedEvents.has(event)) {
      this.batchedEvents.set(event, []);
    }

    const batch = this.batchedEvents.get(event)!;
    batch.push({ event, payload, timestamp });

    // Clear existing timer
    if (this.batchTimers.has(event)) {
      clearTimeout(this.batchTimers.get(event)!);
    }

    // Set new timer to process batch
    const timer = setTimeout(() => {
      this.processBatch(event);
    }, this.config.batchInterval);

    this.batchTimers.set(event, timer);
  }

  /**
   * Process batched events
   */
  private processBatch(event: MapEditorEventName): void {
    const batch = this.batchedEvents.get(event);
    if (!batch || batch.length === 0) {
      return;
    }

    // Use the most recent payload (or merge if needed)
    const latestEvent = batch[batch.length - 1];
    if (!latestEvent) {
      return;
    }
    
    // Clear batch
    this.batchedEvents.set(event, []);
    this.batchTimers.delete(event);

    // Process the latest event (cast payload to correct type)
    this.processEvent(event, latestEvent.payload as MapEditorEvents[typeof event], latestEvent.timestamp);
  }

  /**
   * Check if event should be debounced
   */
  private shouldDebounce(event: MapEditorEventName): boolean {
    // Debounce rapid-fire events
    const debounceableEvents: MapEditorEventName[] = ['viewport:zoom-in', 'viewport:zoom-out'];
    return debounceableEvents.includes(event);
  }

  /**
   * Debounce an event
   */
  private debounceEvent<T extends MapEditorEventName>(
    event: T,
    payload: MapEditorEvents[T],
    timestamp: number
  ): void {
    // Clear existing timer
    if (this.debounceTimers.has(event)) {
      clearTimeout(this.debounceTimers.get(event)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processEvent(event, payload, timestamp);
      this.debounceTimers.delete(event);
      this.lastEmittedEvents.delete(event);
    }, this.config.debounceDelay);

    this.debounceTimers.set(event, timer);
    this.lastEmittedEvents.set(event, timestamp);
  }

  /**
   * Update performance metric
   */
  private updatePerformanceMetric(event: MapEditorEventName, time: number): void {
    if (!this.performanceMetrics.has(event)) {
      this.performanceMetrics.set(event, {
        event,
        handlerCount: 0,
        totalTime: 0,
        callCount: 0,
        averageTime: 0,
        maxTime: 0,
      });
    }

    const metric = this.performanceMetrics.get(event)!;
    metric.callCount++;
    metric.totalTime += time;
    metric.averageTime = metric.totalTime / metric.callCount;
    metric.maxTime = Math.max(metric.maxTime, time);
  }

  /**
   * Add event to dead letter queue
   */
  private addToDeadLetterQueue(
    event: MapEditorEventName,
    payload: unknown,
    error: Error
  ): void {
    this.deadLetterQueue.push({
      event,
      payload,
      timestamp: Date.now(),
      error,
      retryCount: 0,
    });

    // Limit queue size
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }
  }

  /**
   * Subscribe to an event
   * @param event Event name
   * @param handler Event handler
   * @param options Optional configuration (priority, id for debugging)
   */
  on<T extends MapEditorEventName>(
    event: T,
    handler: MapEditorEventHandler<T>,
    options?: {
      priority?: number; // Higher priority = processed first
      id?: string; // For debugging and identification
    }
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event)!;

    // Check listener limit
    if (eventListeners.size >= this.config.maxListenersPerEvent) {
      const error = new Error(
        `Maximum listeners (${this.config.maxListenersPerEvent}) reached for event "${event}". ` +
        `This may indicate a memory leak. Consider removing unused listeners.`
      );
      this.config.errorHandler(error, event, null);
      throw error;
    }

    const listenerId = options?.id ?? `listener-${++this.listenerIdCounter}`;
    const listener: EventListener = {
      handler: handler as EventHandler,
      priority: options?.priority ?? 0,
      id: listenerId,
    };

    eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  /**
   * Subscribe to an event once
   * @param event Event name
   * @param handler Event handler
   * @param options Optional configuration (priority, id for debugging)
   */
  once<T extends MapEditorEventName>(
    event: T,
    handler: MapEditorEventHandler<T>,
    options?: {
      priority?: number;
      id?: string;
    }
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const eventListeners = this.listeners.get(event)!;

    // Check listener limit
    if (eventListeners.size >= this.config.maxListenersPerEvent) {
      const error = new Error(
        `Maximum listeners (${this.config.maxListenersPerEvent}) reached for event "${event}". ` +
        `This may indicate a memory leak. Consider removing unused listeners.`
      );
      this.config.errorHandler(error, event, null);
      throw error;
    }

    const listenerId = options?.id ?? `listener-${++this.listenerIdCounter}`;
    const listener: EventListener = {
      handler: handler as EventHandler,
      once: true,
      priority: options?.priority ?? 0,
      id: listenerId,
    };

    eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
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

  /**
   * Get dead letter queue (failed events)
   */
  getDeadLetterQueue(): ReadonlyArray<DeadLetterEvent> {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Retry failed events from dead letter queue
   */
  retryDeadLetterEvents(): void {
    const eventsToRetry = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    eventsToRetry.forEach((deadEvent) => {
      if (deadEvent.retryCount < this.config.maxRetries) {
        deadEvent.retryCount++;
        try {
          // Cast payload to correct type for the event
          this.processEvent(
            deadEvent.event,
            deadEvent.payload as MapEditorEvents[typeof deadEvent.event],
            Date.now()
          );
        } catch {
          // Re-add to queue if retry fails
          this.deadLetterQueue.push(deadEvent);
        }
      }
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): ReadonlyMap<MapEditorEventName, PerformanceMetric> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Get performance metric for a specific event
   */
  getPerformanceMetric(event: MapEditorEventName): PerformanceMetric | undefined {
    return this.performanceMetrics.get(event);
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  /**
   * Get event trace (for debugging)
   */
  getEventTrace(): ReadonlyArray<{ event: MapEditorEventName; action: 'emit' | 'handled' | 'error'; timestamp: number }> {
    return [...this.eventTrace];
  }

  /**
   * Clear event trace
   */
  clearEventTrace(): void {
    this.eventTrace = [];
  }

  /**
   * Enable/disable tracing
   */
  setTracingEnabled(enabled: boolean): void {
    this.config.enableTracing = enabled;
    if (!enabled) {
      this.clearEventTrace();
    }
  }

  /**
   * Enable/disable performance tracking
   */
  setPerformanceTrackingEnabled(enabled: boolean): void {
    this.config.enablePerformanceTracking = enabled;
    if (!enabled) {
      this.clearPerformanceMetrics();
    }
  }

  /**
   * Get all listener IDs for an event (for debugging)
   */
  getListenerIds(event: MapEditorEventName): string[] {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return [];
    }
    return Array.from(listeners)
      .map((l) => l.id)
      .filter((id): id is string => id !== undefined);
  }

  /**
   * Get listener count breakdown (for debugging)
   */
  getListenerBreakdown(): Record<MapEditorEventName, number> {
    const breakdown: Record<string, number> = {};
    this.listeners.forEach((listeners, event) => {
      breakdown[event] = listeners.size;
    });
    return breakdown as Record<MapEditorEventName, number>;
  }

  /**
   * Cleanup: Clear all timers and listeners
   */
  destroy(): void {
    // Clear all timers
    this.batchTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.batchTimers.clear();
    this.debounceTimers.clear();

    // Clear all listeners
    this.listeners.clear();

    // Clear history and queues
    this.eventHistory = [];
    this.deadLetterQueue = [];
    this.batchedEvents.clear();
    this.lastEmittedEvents.clear();
    this.performanceMetrics.clear();
    this.eventTrace = [];
  }
}

/**
 * Create a new EventBus instance with optional configuration
 */
export function createEventBus(config?: EventBusConfig): EventBus {
  return new EventBus(config);
}

