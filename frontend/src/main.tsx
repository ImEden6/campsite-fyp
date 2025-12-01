import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from '@/config/react-query';
import { ErrorBoundaryWithFeedback } from '@/components/ErrorBoundaryWithFeedback';
import '@styles/index.css';

// Initialize lucide-react icon registry early to prevent registration errors
// This ensures the icon registry is ready before any lazy-loaded components use icons
console.log('[Main] Starting lucide-react import...');
import * as lucideReact from 'lucide-react';
console.log('[Main] lucide-react imported successfully', {
  hasActivity: 'Activity' in lucideReact,
  activityType: typeof lucideReact.Activity,
  moduleKeys: Object.keys(lucideReact).slice(0, 10),
});
// Store on window for debugging and ensure it's available globally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__lucideReact = lucideReact;
  // Also ensure Activity is available immediately
  if (lucideReact.Activity) {
    (window as unknown as Record<string, unknown>).__lucideActivity = lucideReact.Activity;
  }
}

// Import test utility in dev mode
if (import.meta.env.DEV) {
  import('@/utils/test-icon-init');
}

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

// Defer non-critical initializations to reduce main-thread blocking
// Use requestIdleCallback for non-critical work, fallback to setTimeout
const deferInit = (fn: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};

// DndContext wrapper component
// eslint-disable-next-line react-refresh/only-export-components
const DndContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  );

  return (
    <DndContext sensors={sensors}>
      {children}
    </DndContext>
  );
};

// Sentry is lazy-loaded on first error - don't import it here to keep it out of initial bundle
// The ErrorBoundaryWithFeedback component will handle error reporting

// Defer non-critical initializations to reduce initial main-thread work
deferInit(() => {
  import('@/config/performance').then(m => m.initWebVitals());
  import('@/config/bundle-monitor').then(m => m.initBundleMonitoring());
  import('@/utils/resourceHints').then(m => m.initResourceHints());
  import('@/utils/accessibility').then(m => m.initializeInputDetection());
});

// Get root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Render application
// Only use StrictMode in development to avoid double renders in production
const root = ReactDOM.createRoot(rootElement);
const AppRoot = process.env.NODE_ENV === 'development' ? (
  <React.StrictMode>
    <ErrorBoundaryWithFeedback>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <DndContextProvider>
            <App />
          </DndContextProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundaryWithFeedback>
  </React.StrictMode>
) : (
  <ErrorBoundaryWithFeedback>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DndContextProvider>
          <App />
        </DndContextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundaryWithFeedback>
);

root.render(AppRoot);
