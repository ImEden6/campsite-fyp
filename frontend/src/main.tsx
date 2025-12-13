import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from '@/config/react-query';
import { ErrorBoundaryWithFeedback } from '@/components/ErrorBoundaryWithFeedback';
import '@styles/index.css';

// Import test utility in dev mode - uses dynamic imports so won't affect bundle
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
