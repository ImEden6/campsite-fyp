/**
 * Viewport Culling Hook
 * Filters modules to only include those visible in the viewport for performance optimization
 */

import { useMemo } from 'react';
import type { AnyModule, ViewportState } from '@/types';

interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate viewport bounds in canvas coordinates
 */
function getViewportBounds(
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number
): ViewportBounds {
  const zoom = viewport.zoom;
  const pos = viewport.position;

  // Convert viewport position to canvas coordinates
  const viewportX = -pos.x / zoom;
  const viewportY = -pos.y / zoom;
  const viewportWidth = canvasWidth / zoom;
  const viewportHeight = canvasHeight / zoom;

  return {
    x: viewportX,
    y: viewportY,
    width: viewportWidth,
    height: viewportHeight,
  };
}

/**
 * Check if a module intersects with the viewport
 */
function moduleIntersectsViewport(
  module: AnyModule,
  viewportBounds: ViewportBounds
): boolean {
  const moduleRight = module.position.x + module.size.width;
  const moduleBottom = module.position.y + module.size.height;
  const viewportRight = viewportBounds.x + viewportBounds.width;
  const viewportBottom = viewportBounds.y + viewportBounds.height;

  // Add padding to account for module size and rotation
  const padding = Math.max(module.size.width, module.size.height) * 0.5;

  return (
    module.position.x - padding < viewportRight &&
    moduleRight + padding > viewportBounds.x &&
    module.position.y - padding < viewportBottom &&
    moduleBottom + padding > viewportBounds.y
  );
}

/**
 * Hook to filter modules based on viewport visibility
 * @param modules - Array of modules to filter
 * @param viewport - Current viewport state
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param enabled - Whether culling is enabled (default: true)
 * @returns Filtered array of visible modules
 */
export function useViewportCulling(
  modules: AnyModule[],
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
  enabled: boolean = true
): AnyModule[] {
  return useMemo(() => {
    if (!enabled || modules.length === 0 || canvasWidth === 0 || canvasHeight === 0) {
      return modules;
    }

    const viewportBounds = getViewportBounds(viewport, canvasWidth, canvasHeight);
    
    return modules.filter(module => 
      moduleIntersectsViewport(module, viewportBounds)
    );
  }, [modules, viewport, canvasWidth, canvasHeight, enabled]);
}

