import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { captureMessage, addBreadcrumb } from './sentry';

interface CustomWindow extends Window {
  gtag: (...args: unknown[]) => void;
}

interface PerformanceWithMemory extends Performance {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Web Vitals thresholds
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP) - should be < 2.5s
  LCP: { good: 2500, needsImprovement: 4000 },
  // Interaction to Next Paint (INP) - should be < 200ms (replaces FID)
  INP: { good: 200, needsImprovement: 500 },
  // Cumulative Layout Shift (CLS) - should be < 0.1
  CLS: { good: 0.1, needsImprovement: 0.25 },
  // First Contentful Paint (FCP) - should be < 1.8s
  FCP: { good: 1800, needsImprovement: 3000 },
  // Time to First Byte (TTFB) - should be < 800ms
  TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Get rating for a metric
 */
export const getRating = (
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Send metric to analytics
 */
const sendToAnalytics = (metric: Metric) => {
  const { name, value, id, rating } = metric;
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name}:`, {
      value: Math.round(value),
      rating,
      id,
    });
  }
  
  // Add breadcrumb for Sentry
  addBreadcrumb(
    `Web Vital: ${name}`,
    'performance',
    rating === 'good' ? 'info' : rating === 'needs-improvement' ? 'warning' : 'error',
    {
      value: Math.round(value),
      rating,
      id,
    }
  );
  
  // Report poor metrics to Sentry
  if (rating === 'poor') {
    captureMessage(
      `Poor ${name} performance: ${Math.round(value)}`,
      'warning',
      {
        metric: name,
        value: Math.round(value),
        rating,
        id,
      }
    );
  }
  
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as CustomWindow).gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(value),
      event_label: id,
      non_interaction: true,
    });
  }
};

/**
 * Initialize Web Vitals tracking
 */
export const initWebVitals = () => {
  try {
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics); // Replaced onFID with onINP (web-vitals v3)
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    
    console.log('Web Vitals tracking initialized');
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
};

/**
 * Custom performance metrics
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();
  
  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    try {
      const timestamp = performance.now();
      this.marks.set(name, timestamp);
      performance.mark(name);
      
      addBreadcrumb(
        `Performance Mark: ${name}`,
        'performance',
        'info',
        { timestamp }
      );
    } catch (error) {
      console.error('Failed to mark performance:', error);
    }
  }
  
  /**
   * Measure the duration between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    try {
      const end = endMark ? this.marks.get(endMark) : performance.now();
      const start = this.marks.get(startMark);
      
      if (!start || !end) {
        console.warn(`Missing marks for measurement: ${name}`);
        return null;
      }
      
      const duration = end - start;
      this.measures.set(name, duration);
      
      // Create performance measure
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${name}: ${Math.round(duration)}ms`);
      }
      
      // Add breadcrumb
      addBreadcrumb(
        `Performance Measure: ${name}`,
        'performance',
        duration > 1000 ? 'warning' : 'info',
        { duration: Math.round(duration) }
      );
      
      // Report slow operations
      if (duration > 3000) {
        captureMessage(
          `Slow operation: ${name} took ${Math.round(duration)}ms`,
          'warning',
          { operation: name, duration: Math.round(duration) }
        );
      }
      
      return duration;
    } catch (error) {
      console.error('Failed to measure performance:', error);
      return null;
    }
  }
  
  /**
   * Get all measures
   */
  getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }
  
  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
  
  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): Record<string, number> | null {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!navigation) return null;
      
      return {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnection: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domComplete - navigation.domInteractive,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
      };
    } catch (error) {
      console.error('Failed to get navigation timing:', error);
      return null;
    }
  }
  
  /**
   * Get resource timing metrics
   */
  getResourceTiming(): Array<{
    name: string;
    duration: number;
    size: number;
    type: string;
  }> {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      return resources.map((resource) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize || 0,
        type: resource.initiatorType,
      }));
    } catch (error) {
      console.error('Failed to get resource timing:', error);
      return [];
    }
  }
  
  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): Record<string, number> | null {
    try {
      if ('memory' in performance) {
        const memory = (performance as PerformanceWithMemory).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get memory usage:', error);
      return null;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to track component mount time
 */
export const usePerformanceTracking = (componentName: string) => {
  if (typeof window === 'undefined') return;
  
  const startMark = `${componentName}-mount-start`;
  const endMark = `${componentName}-mount-end`;
  
  performanceMonitor.mark(startMark);
  
  // Return cleanup function
  return () => {
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${componentName}-mount`, startMark, endMark);
  };
};
