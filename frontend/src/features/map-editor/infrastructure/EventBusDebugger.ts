/**
 * Event Bus Debugger
 * Development tool for debugging event bus activity
 * Only available in development mode
 */

import type { EventBus } from './EventBus';
import type { MapEditorEventName } from '../core/events';

export interface EventBusDebugInfo {
  totalEvents: number;
  totalListeners: number;
  eventsWithListeners: number;
  deadLetterQueueSize: number;
  performanceMetrics: {
    slowestEvent?: string;
    fastestEvent?: string;
    averageTime: number;
  };
  listenerBreakdown: Record<string, number>;
  recentEvents: Array<{
    event: MapEditorEventName;
    timestamp: number;
    listenerCount: number;
  }>;
}

/**
 * Event Bus Debugger
 * Provides debugging utilities for the Event Bus
 */
export class EventBusDebugger {
  constructor(private eventBus: EventBus) {
    // Only enable in development
    if (process.env.NODE_ENV === 'development') {
      this.setupGlobalDebugger();
    }
  }

  /**
   * Get comprehensive debug information
   */
  getDebugInfo(): EventBusDebugInfo {
    const metrics = this.eventBus.getPerformanceMetrics();
    const listenerBreakdown = this.eventBus.getListenerBreakdown();
    const history = this.eventBus.getHistory();
    const deadLetterQueue = this.eventBus.getDeadLetterQueue();

    // Calculate performance stats
    let slowestEvent: string | undefined;
    let fastestEvent: string | undefined;
    let maxTime = 0;
    let minTime = Infinity;
    let totalTime = 0;
    let totalCalls = 0;

    metrics.forEach((metric, event) => {
      if (metric.maxTime > maxTime) {
        maxTime = metric.maxTime;
        slowestEvent = event;
      }
      if (metric.averageTime < minTime && metric.callCount > 0) {
        minTime = metric.averageTime;
        fastestEvent = event;
      }
      totalTime += metric.totalTime;
      totalCalls += metric.callCount;
    });

    const averageTime = totalCalls > 0 ? totalTime / totalCalls : 0;

    // Get recent events (last 20)
    const recentEvents = history
      .slice(-20)
      .reverse()
      .map((entry) => ({
        event: entry.event,
        timestamp: entry.timestamp,
        listenerCount: this.eventBus.listenerCount(entry.event),
      }));

    return {
      totalEvents: history.length,
      totalListeners: Object.values(listenerBreakdown).reduce((sum, count) => sum + count, 0),
      eventsWithListeners: Object.keys(listenerBreakdown).length,
      deadLetterQueueSize: deadLetterQueue.length,
      performanceMetrics: {
        slowestEvent,
        fastestEvent,
        averageTime,
      },
      listenerBreakdown,
      recentEvents,
    };
  }

  /**
   * Log debug information to console
   */
  logDebugInfo(): void {
    const info = this.getDebugInfo();
    
    console.group('🔍 Event Bus Debug Info');
    console.log('Total Events:', info.totalEvents);
    console.log('Total Listeners:', info.totalListeners);
    console.log('Events with Listeners:', info.eventsWithListeners);
    console.log('Dead Letter Queue Size:', info.deadLetterQueueSize);
    
    console.group('Performance Metrics');
    console.log('Slowest Event:', info.performanceMetrics.slowestEvent);
    console.log('Fastest Event:', info.performanceMetrics.fastestEvent);
    console.log('Average Time:', `${info.performanceMetrics.averageTime.toFixed(2)}ms`);
    console.groupEnd();
    
    console.group('Listener Breakdown');
    Object.entries(info.listenerBreakdown).forEach(([event, count]) => {
      console.log(`${event}: ${count} listener(s)`);
    });
    console.groupEnd();
    
    console.group('Recent Events (last 20)');
    info.recentEvents.forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`[${time}] ${entry.event} (${entry.listenerCount} listeners)`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }

  /**
   * Check for potential memory leaks
   */
  checkForMemoryLeaks(): {
    hasLeaks: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const listenerBreakdown = this.eventBus.getListenerBreakdown();
    const maxListeners = 20; // Threshold for warning

    Object.entries(listenerBreakdown).forEach(([event, count]) => {
      if (count > maxListeners) {
        warnings.push(
          `Event "${event}" has ${count} listeners. This may indicate a memory leak. ` +
          `Consider checking if listeners are being properly cleaned up.`
        );
      }
    });

    // Check for events with many one-time listeners that weren't cleaned up
    const history = this.eventBus.getHistory();
    const eventCounts = new Map<MapEditorEventName, number>();
    history.forEach((entry) => {
      eventCounts.set(entry.event, (eventCounts.get(entry.event) || 0) + 1);
    });

    eventCounts.forEach((count, event) => {
      const listenerCount = this.eventBus.listenerCount(event);
      if (count > 100 && listenerCount > 10) {
        warnings.push(
          `Event "${event}" has been emitted ${count} times with ${listenerCount} listeners. ` +
          `This may indicate listeners are not being cleaned up properly.`
        );
      }
    });

    return {
      hasLeaks: warnings.length > 0,
      warnings,
    };
  }

  /**
   * Get event trace visualization
   */
  getEventTraceVisualization(): string {
    const trace = this.eventBus.getEventTrace();
    if (trace.length === 0) {
      return 'No events traced. Enable tracing with eventBus.setTracingEnabled(true)';
    }

    const lines: string[] = [];
    lines.push('Event Trace:');
    lines.push('─'.repeat(80));

    trace.slice(-50).forEach((entry) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const action = entry.action === 'emit' ? '→' : entry.action === 'handled' ? '✓' : '✗';
      lines.push(`[${time}] ${action} ${entry.event}`);
    });

    return lines.join('\n');
  }

  /**
   * Setup global debugger (exposes to window in dev mode)
   */
  private setupGlobalDebugger(): void {
    if (typeof window !== 'undefined') {
      // Expose debugger to window for console access
      (window as unknown as { __eventBusDebugger?: EventBusDebugger }).__eventBusDebugger = this;
      
      console.log(
        '%c🔍 Event Bus Debugger',
        'color: #0ea5e9; font-weight: bold; font-size: 14px;'
      );
      console.log(
        'Access debugger with: window.__eventBusDebugger.logDebugInfo()'
      );
    }
  }

  /**
   * Monitor event bus for a period of time
   */
  monitor(durationMs: number = 5000): Promise<EventBusDebugInfo> {
    return new Promise((resolve) => {
      const startInfo = this.getDebugInfo();
      
      setTimeout(() => {
        const endInfo = this.getDebugInfo();
        
        console.group('📊 Event Bus Monitor Results');
        console.log('Duration:', `${durationMs}ms`);
        console.log('Events Emitted:', endInfo.totalEvents - startInfo.totalEvents);
        console.log('Listeners Added:', endInfo.totalListeners - startInfo.totalListeners);
        console.log('Dead Letter Events:', endInfo.deadLetterQueueSize - startInfo.deadLetterQueueSize);
        console.groupEnd();
        
        resolve(endInfo);
      }, durationMs);
    });
  }
}

/**
 * Create an Event Bus Debugger instance
 */
export function createEventBusDebugger(eventBus: EventBus): EventBusDebugger {
  return new EventBusDebugger(eventBus);
}

