/**
 * Bundle Size Monitoring Configuration
 * Tracks and reports bundle size metrics
 */

interface BundleMetrics {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
  }>;
  timestamp: number;
}

/**
 * Initialize bundle monitoring
 * Only runs in development mode
 */
export function initBundleMonitoring(): void {
  if (import.meta.env.DEV) {
    console.log('📦 Bundle monitoring initialized');
    
    // Log performance entries for resources
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          const scripts = resources.filter(r => r.name.includes('.js'));
          const styles = resources.filter(r => r.name.includes('.css'));
          
          const totalScriptSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          const totalStyleSize = styles.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          
          console.group('📊 Bundle Size Report');
          console.log(`Total JS: ${formatBytes(totalScriptSize)}`);
          console.log(`Total CSS: ${formatBytes(totalStyleSize)}`);
          console.log(`Total: ${formatBytes(totalScriptSize + totalStyleSize)}`);
          
          // Log largest chunks
          const sortedScripts = scripts
            .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
            .slice(0, 10);
          
          console.log('\nLargest JS chunks:');
          sortedScripts.forEach((script, i) => {
            const name = script.name.split('/').pop() || 'unknown';
            console.log(`${i + 1}. ${name}: ${formatBytes(script.transferSize || 0)}`);
          });
          
          console.groupEnd();
        }, 1000);
      });
    }
  }
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get current bundle metrics
 * @returns Bundle metrics object
 */
export function getBundleMetrics(): BundleMetrics | null {
  if (!('performance' in window)) return null;
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scripts = resources.filter(r => r.name.includes('.js'));
  
  const chunks = scripts.map(script => ({
    name: script.name.split('/').pop() || 'unknown',
    size: script.transferSize || 0,
  }));
  
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  
  return {
    totalSize,
    chunks,
    timestamp: Date.now(),
  };
}

/**
 * Report bundle metrics to analytics
 * @param metrics - Bundle metrics
 */
export function reportBundleMetrics(metrics: BundleMetrics): void {
  // Send to analytics service (e.g., Google Analytics, custom endpoint)
  if (import.meta.env.PROD) {
    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/bundle-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    }).catch(() => {
      // Silently fail - don't break app for analytics
    });
  }
}

/**
 * Check if bundle size exceeds threshold
 * @param threshold - Size threshold in bytes
 * @returns True if exceeds threshold
 */
export function checkBundleSizeThreshold(threshold: number = 500000): boolean {
  const metrics = getBundleMetrics();
  if (!metrics) return false;
  
  const exceeds = metrics.totalSize > threshold;
  
  if (exceeds && import.meta.env.DEV) {
    console.warn(
      `⚠️ Bundle size (${formatBytes(metrics.totalSize)}) exceeds threshold (${formatBytes(threshold)})`
    );
  }
  
  return exceeds;
}
