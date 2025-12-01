/**
 * Hook to lazy-load Framer Motion
 * Use this in non-critical components to reduce initial bundle size
 */

import { useState, useEffect } from 'react';

type FramerMotionModule = typeof import('framer-motion');

let framerMotionCache: FramerMotionModule | null = null;
let loadingPromise: Promise<FramerMotionModule> | null = null;

/**
 * Lazy load Framer Motion module
 */
function loadFramerMotion(): Promise<FramerMotionModule> {
  if (framerMotionCache) {
    return Promise.resolve(framerMotionCache);
  }
  
  if (!loadingPromise) {
    loadingPromise = import('framer-motion').then((module) => {
      framerMotionCache = module;
      loadingPromise = null;
      return module;
    });
  }
  
  return loadingPromise;
}

/**
 * Hook to use lazy-loaded Framer Motion
 * Returns motion and AnimatePresence components
 */
export function useLazyFramerMotion() {
  const [framerMotion, setFramerMotion] = useState<FramerMotionModule | null>(framerMotionCache);
  const [isLoading, setIsLoading] = useState(!framerMotionCache);

  useEffect(() => {
    if (!framerMotion) {
      setIsLoading(true);
      loadFramerMotion().then((module) => {
        setFramerMotion(module);
        setIsLoading(false);
      });
    }
  }, [framerMotion]);

  return {
    motion: framerMotion?.motion,
    AnimatePresence: framerMotion?.AnimatePresence,
    isLoading,
  };
}

/**
 * Preload Framer Motion (call this when you know it will be needed soon)
 */
export function preloadFramerMotion(): void {
  if (!framerMotionCache && !loadingPromise) {
    loadFramerMotion();
  }
}

