import React, { useState, useEffect } from 'react';
import { Activity, Zap, HardDrive, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { performanceMonitor } from '@/config/performance';

// Diagnostic logging for icon imports
console.log('[PerformanceDashboard] Icons imported:', {
  Activity: typeof Activity,
  Zap: typeof Zap,
  HardDrive: typeof HardDrive,
  Clock: typeof Clock,
  TrendingUp: typeof TrendingUp,
  TrendingDown: typeof TrendingDown,
});

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
}

/**
 * Performance Dashboard Component
 * Displays real-time performance metrics for debugging
 */
export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [memory, setMemory] = useState<Record<string, number> | null>(null);
  const [navigation, setNavigation] = useState<Record<string, number> | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const showDashboard = import.meta.env.DEV || localStorage.getItem('show-performance-dashboard') === 'true';
    setIsVisible(showDashboard);

    if (!showDashboard) return;

    const updateMetrics = () => {
      // Get navigation timing
      const navTiming = performanceMonitor.getNavigationTiming();
      setNavigation(navTiming);

      // Get memory usage
      const memUsage = performanceMonitor.getMemoryUsage();
      setMemory(memUsage);

      // Get custom measures
      const measures = performanceMonitor.getMeasures();
      const metricsList: PerformanceMetric[] = Object.entries(measures).map(([name, value]) => ({
        name,
        value: Math.round(value),
        unit: 'ms',
        status: value < 1000 ? 'good' : value < 3000 ? 'warning' : 'error',
      }));

      setMetrics(metricsList);
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <Activity className="w-4 h-4" />;
      case 'error':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-auto">
      <div className="sticky top-0 bg-linear-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Performance Monitor</h3>
          </div>
          <button
            onClick={() => {
              localStorage.setItem('show-performance-dashboard', 'false');
              setIsVisible(false);
            }}
            className="text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Memory Usage */}
        {memory && memory.usedJSHeapSize !== undefined && memory.totalJSHeapSize !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <HardDrive className="w-4 h-4 mr-2 text-gray-600" />
              <h4 className="font-medium text-sm text-gray-700">Memory Usage</h4>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Used:</span>
                <span className="font-mono">{(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-mono">{(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage:</span>
                <span className={`font-mono ${(memory.usagePercent ?? 0) > 80 ? 'text-red-600' : 'text-green-600'}`}>
                  {(memory.usagePercent ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Timing */}
        {navigation && navigation.totalTime !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 mr-2 text-gray-600" />
              <h4 className="font-medium text-sm text-gray-700">Page Load</h4>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">DNS Lookup:</span>
                <span className="font-mono">{(navigation.dnsLookup ?? 0).toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TCP Connection:</span>
                <span className="font-mono">{(navigation.tcpConnection ?? 0).toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Request:</span>
                <span className="font-mono">{(navigation.request ?? 0).toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response:</span>
                <span className="font-mono">{(navigation.response ?? 0).toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DOM Processing:</span>
                <span className="font-mono">{(navigation.domProcessing ?? 0).toFixed(0)} ms</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Total:</span>
                <span className={`font-mono ${navigation.totalTime > 3000 ? 'text-red-600' : 'text-green-600'}`}>
                  {navigation.totalTime.toFixed(0)} ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Custom Metrics */}
        {metrics.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center mb-2">
              <Activity className="w-4 h-4 mr-2 text-gray-600" />
              <h4 className="font-medium text-sm text-gray-700">Custom Metrics</h4>
            </div>
            <div className="space-y-2">
              {metrics.map((metric) => (
                <div
                  key={metric.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 truncate flex-1">{metric.name}</span>
                  <div className={`flex items-center px-2 py-1 rounded ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                    <span className="ml-1 font-mono">
                      {metric.value} {metric.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => performanceMonitor.clear()}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Clear Metrics
          </button>
          <button
            onClick={() => {
              console.log('Navigation Timing:', navigation);
              console.log('Memory Usage:', memory);
              console.log('Custom Metrics:', metrics);
            }}
            className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700"
          >
            Log to Console
          </button>
        </div>
      </div>
    </div>
  );
};