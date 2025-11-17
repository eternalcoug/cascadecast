import React, { useState, useEffect } from 'react';
import { Activity, Zap, Database, Wifi, Clock, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheSize: number;
  networkRequests: number;
  errorCount: number;
  lastUpdated: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showDetails = false,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheSize: 0,
    networkRequests: 0,
    errorCount: 0,
    lastUpdated: Date.now()
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      const performance = window.performance;
      const memory = (performance as any).memory;
      
      // Calculate load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? navigation.loadEventEnd - navigation.navigationStart : 0;
      
      // Calculate render time (approximate)
      const renderTime = navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0;
      
      // Memory usage (if available)
      const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
      
      // Cache size (localStorage)
      let cacheSize = 0;
      try {
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            cacheSize += localStorage[key].length;
          }
        }
        cacheSize = cacheSize / 1024; // KB
      } catch (error) {
        // Ignore storage access errors
      }
      
      // Network requests
      const networkRequests = performance.getEntriesByType('resource').length;
      
      // Error count from stored logs
      let errorCount = 0;
      try {
        const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
        errorCount = errorLog.length;
      } catch (error) {
        // Ignore parsing errors
      }
      
      setMetrics({
        loadTime: Math.round(loadTime),
        renderTime: Math.round(renderTime),
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        cacheSize: Math.round(cacheSize * 100) / 100,
        networkRequests,
        errorCount,
        lastUpdated: Date.now()
      });
    };

    // Initial update
    updateMetrics();
    
    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [enabled]);

  // Performance observer for real-time metrics
  useEffect(() => {
    if (!enabled || typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }

    return () => observer.disconnect();
  }, [enabled]);

  const getPerformanceStatus = () => {
    if (metrics.loadTime > 3000) return { status: 'poor', color: 'text-red-600' };
    if (metrics.loadTime > 1500) return { status: 'fair', color: 'text-yellow-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const getMemoryStatus = () => {
    if (metrics.memoryUsage > 100) return { status: 'high', color: 'text-red-600' };
    if (metrics.memoryUsage > 50) return { status: 'medium', color: 'text-yellow-600' };
    return { status: 'low', color: 'text-green-600' };
  };

  if (!enabled) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-40 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Performance Monitor"
      >
        <Activity className="h-4 w-4" />
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-xl border p-4 min-w-80 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Performance
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Load Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Load Time</span>
              </div>
              <span className={`font-medium ${getPerformanceStatus().color}`}>
                {metrics.loadTime}ms
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span>Memory</span>
              </div>
              <span className={`font-medium ${getMemoryStatus().color}`}>
                {metrics.memoryUsage}MB
              </span>
            </div>

            {/* Cache Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span>Cache</span>
              </div>
              <span className="font-medium text-gray-700">
                {metrics.cacheSize}KB
              </span>
            </div>

            {/* Network Requests */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span>Requests</span>
              </div>
              <span className="font-medium text-gray-700">
                {metrics.networkRequests}
              </span>
            </div>

            {/* Error Count */}
            {metrics.errorCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>Errors</span>
                </div>
                <span className="font-medium text-red-600">
                  {metrics.errorCount}
                </span>
              </div>
            )}

            {/* Detailed Metrics */}
            {showDetails && (
              <>
                <hr className="my-3" />
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Render Time:</span>
                    <span>{metrics.renderTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span>{new Date(metrics.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </>
            )}

            {/* Performance Tips */}
            <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
              <div className="font-medium text-blue-800 mb-1">Tips:</div>
              <ul className="text-blue-700 space-y-1">
                {metrics.loadTime > 3000 && (
                  <li>• Consider enabling caching</li>
                )}
                {metrics.memoryUsage > 100 && (
                  <li>• High memory usage detected</li>
                )}
                {metrics.cacheSize > 1000 && (
                  <li>• Cache size is large, consider cleanup</li>
                )}
                {metrics.errorCount > 5 && (
                  <li>• Multiple errors detected</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Performance measurement utilities
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(startMark);
    fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
  } else {
    fn();
  }
};

type MeasureAsyncFunction = <T>(name: string, fn: () => Promise<T>) => Promise<T>;

export const measureAsync: MeasureAsyncFunction = async (name, fn) => {
  if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    return result;
  } else {
    return await fn();
  }
};

// Web Vitals measurement
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  const observeLCP = () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      
      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        console.warn('LCP observation not supported:', error);
      }
    }
  };

  // First Input Delay
  const observeFID = () => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        observer.observe({ type: 'first-input', buffered: true });
      } catch (error) {
        console.warn('FID observation not supported:', error);
      }
    }
  };

  // Cumulative Layout Shift
  const observeCLS = () => {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      
      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('CLS observation not supported:', error);
      }
    }
  };

  observeLCP();
  observeFID();
  observeCLS();
};