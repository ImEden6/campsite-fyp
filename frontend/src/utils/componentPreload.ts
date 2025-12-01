/**
 * Component Preloading Utilities
 * Preload lazy-loaded components before they're needed
 */

type PreloadableComponent = {
  preload?: () => Promise<unknown>;
};

/**
 * Preload a lazy-loaded component
 * @param component - Lazy component with preload method
 */
export function preloadComponent(component: PreloadableComponent): void {
  if (component.preload) {
    component.preload();
  }
}

/**
 * Preload multiple components
 * @param components - Array of lazy components
 */
export function preloadComponents(components: PreloadableComponent[]): void {
  components.forEach(preloadComponent);
}

/**
 * Preload component on hover (for links)
 * @param component - Lazy component to preload
 * @returns Hover event handler
 */
export function preloadOnHover(component: PreloadableComponent) {
  return () => {
    preloadComponent(component);
  };
}

/**
 * Preload component on idle
 * @param component - Lazy component to preload
 * @param timeout - Timeout in ms (default: 2000)
 */
export function preloadOnIdle(
  component: PreloadableComponent,
  timeout: number = 2000
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preloadComponent(component), { timeout });
  } else {
    setTimeout(() => preloadComponent(component), timeout);
  }
}

/**
 * Preload components based on user role
 * @param role - User role
 * @param componentMap - Map of roles to components
 */
export function preloadByRole(
  role: string,
  componentMap: Record<string, PreloadableComponent[]>
): void {
  const components = componentMap[role];
  if (components) {
    preloadComponents(components);
  }
}

/**
 * Create a preloadable lazy component
 * @param importFn - Dynamic import function
 * @returns Lazy component with preload method
 */
export function lazyWithPreload<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
) {
  const Component = React.lazy(importFn);
  (Component as PreloadableComponent).preload = importFn;
  return Component;
}

// React import for lazy
import React from 'react';
