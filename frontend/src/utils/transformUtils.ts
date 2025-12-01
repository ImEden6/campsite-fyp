/**
 * Transform Utilities
 * Provides geometric calculation functions for module transformations
 */

import type { Position, Size } from '@/types';

export type ResizeHandle = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeResult {
  position: Position;
  size: Size;
}

export interface RotationResult {
  angle: number;
}

/**
 * Calculate new bounds when resizing from a specific handle
 */
export function calculateResize(
  handle: ResizeHandle,
  currentBounds: Bounds,
  mousePosition: Position,
  startMousePosition: Position,
  options: {
    preserveAspectRatio?: boolean;
    snapToGrid?: boolean;
    gridSize?: number;
    minSize?: Size;
    maxSize?: Size;
  } = {}
): ResizeResult {
  const {
    preserveAspectRatio = false,
    snapToGrid = false,
    gridSize = 20,
    minSize = { width: 20, height: 20 },
    maxSize,
  } = options;

  const dx = mousePosition.x - startMousePosition.x;
  const dy = mousePosition.y - startMousePosition.y;

  let newX = currentBounds.x;
  let newY = currentBounds.y;
  let newWidth = currentBounds.width;
  let newHeight = currentBounds.height;

  const aspectRatio = currentBounds.width / currentBounds.height;

  // Calculate new dimensions based on handle
  switch (handle) {
    case 'top-left':
      newX = currentBounds.x + dx;
      newY = currentBounds.y + dy;
      newWidth = currentBounds.width - dx;
      newHeight = currentBounds.height - dy;
      if (preserveAspectRatio) {
        const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
        const sign = dx > 0 || dy > 0 ? -1 : 1;
        newWidth = currentBounds.width + sign * avgDelta;
        newHeight = newWidth / aspectRatio;
        newX = currentBounds.x + currentBounds.width - newWidth;
        newY = currentBounds.y + currentBounds.height - newHeight;
      }
      break;

    case 'top-center':
      newY = currentBounds.y + dy;
      newHeight = currentBounds.height - dy;
      if (preserveAspectRatio) {
        newWidth = newHeight * aspectRatio;
        newX = currentBounds.x + (currentBounds.width - newWidth) / 2;
      }
      break;

    case 'top-right':
      newY = currentBounds.y + dy;
      newWidth = currentBounds.width + dx;
      newHeight = currentBounds.height - dy;
      if (preserveAspectRatio) {
        const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
        const sign = dx > 0 || dy < 0 ? 1 : -1;
        newWidth = currentBounds.width + sign * avgDelta;
        newHeight = newWidth / aspectRatio;
        newY = currentBounds.y + currentBounds.height - newHeight;
      }
      break;

    case 'middle-left':
      newX = currentBounds.x + dx;
      newWidth = currentBounds.width - dx;
      if (preserveAspectRatio) {
        newHeight = newWidth / aspectRatio;
        newY = currentBounds.y + (currentBounds.height - newHeight) / 2;
      }
      break;

    case 'middle-right':
      newWidth = currentBounds.width + dx;
      if (preserveAspectRatio) {
        newHeight = newWidth / aspectRatio;
        newY = currentBounds.y + (currentBounds.height - newHeight) / 2;
      }
      break;

    case 'bottom-left':
      newX = currentBounds.x + dx;
      newWidth = currentBounds.width - dx;
      newHeight = currentBounds.height + dy;
      if (preserveAspectRatio) {
        const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
        const sign = dx > 0 || dy < 0 ? -1 : 1;
        newWidth = currentBounds.width + sign * avgDelta;
        newHeight = newWidth / aspectRatio;
        newX = currentBounds.x + currentBounds.width - newWidth;
      }
      break;

    case 'bottom-center':
      newHeight = currentBounds.height + dy;
      if (preserveAspectRatio) {
        newWidth = newHeight * aspectRatio;
        newX = currentBounds.x + (currentBounds.width - newWidth) / 2;
      }
      break;

    case 'bottom-right':
      newWidth = currentBounds.width + dx;
      newHeight = currentBounds.height + dy;
      if (preserveAspectRatio) {
        const avgDelta = (Math.abs(dx) + Math.abs(dy)) / 2;
        const sign = dx > 0 || dy > 0 ? 1 : -1;
        newWidth = currentBounds.width + sign * avgDelta;
        newHeight = newWidth / aspectRatio;
      }
      break;
  }

  // Apply minimum size constraints
  if (newWidth < minSize.width) {
    if (handle.includes('left')) {
      newX = currentBounds.x + currentBounds.width - minSize.width;
    }
    newWidth = minSize.width;
  }
  if (newHeight < minSize.height) {
    if (handle.includes('top')) {
      newY = currentBounds.y + currentBounds.height - minSize.height;
    }
    newHeight = minSize.height;
  }

  // Apply maximum size constraints
  if (maxSize) {
    if (newWidth > maxSize.width) {
      if (handle.includes('left')) {
        newX = currentBounds.x + currentBounds.width - maxSize.width;
      }
      newWidth = maxSize.width;
    }
    if (newHeight > maxSize.height) {
      if (handle.includes('top')) {
        newY = currentBounds.y + currentBounds.height - maxSize.height;
      }
      newHeight = maxSize.height;
    }
  }

  // Apply snap to grid
  if (snapToGrid) {
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;
    newWidth = Math.round(newWidth / gridSize) * gridSize;
    newHeight = Math.round(newHeight / gridSize) * gridSize;
  }

  return {
    position: { x: newX, y: newY },
    size: { width: newWidth, height: newHeight },
  };
}

/**
 * Calculate rotation angle from mouse position relative to center point
 */
export function calculateRotation(
  center: Position,
  mousePosition: Position,
  options: {
    snapAngle?: number;
    currentRotation?: number;
  } = {}
): RotationResult {
  const { snapAngle } = options;

  // Calculate angle using atan2
  const dx = mousePosition.x - center.x;
  const dy = mousePosition.y - center.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize to 0-360 range
  angle = (angle + 360) % 360;

  // Apply snap to angle increments
  if (snapAngle && snapAngle > 0) {
    angle = Math.round(angle / snapAngle) * snapAngle;
  }

  return { angle };
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Snap size to grid
 */
export function snapSizeToGrid(size: Size, gridSize: number): Size {
  return {
    width: Math.round(size.width / gridSize) * gridSize,
    height: Math.round(size.height / gridSize) * gridSize,
  };
}

/**
 * Clamp position within boundaries
 */
export function clampPosition(
  position: Position,
  size: Size,
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Position {
  return {
    x: Math.max(bounds.minX, Math.min(position.x, bounds.maxX - size.width)),
    y: Math.max(bounds.minY, Math.min(position.y, bounds.maxY - size.height)),
  };
}

/**
 * Clamp size within min/max constraints
 */
export function clampSize(
  size: Size,
  minSize: Size = { width: 20, height: 20 },
  maxSize?: Size
): Size {
  let width = Math.max(minSize.width, size.width);
  let height = Math.max(minSize.height, size.height);

  if (maxSize) {
    width = Math.min(maxSize.width, width);
    height = Math.min(maxSize.height, height);
  }

  return { width, height };
}

/**
 * Preserve aspect ratio when resizing
 */
export function preserveAspectRatio(
  size: Size,
  originalSize: Size,
  axis: 'width' | 'height' | 'both' = 'both'
): Size {
  const aspectRatio = originalSize.width / originalSize.height;

  if (axis === 'width') {
    return {
      width: size.width,
      height: size.width / aspectRatio,
    };
  } else if (axis === 'height') {
    return {
      width: size.height * aspectRatio,
      height: size.height,
    };
  } else {
    // Use the larger change to determine the new size
    const widthRatio = size.width / originalSize.width;
    const heightRatio = size.height / originalSize.height;
    const ratio = Math.max(widthRatio, heightRatio);

    return {
      width: originalSize.width * ratio,
      height: originalSize.height * ratio,
    };
  }
}

/**
 * Calculate bounding box for multiple modules
 */
export function calculateBoundingBox(
  modules: Array<{ position: Position; size: Size; rotation: number }>
): Bounds {
  if (modules.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  modules.forEach((module) => {
    // For simplicity, we calculate bounding box without considering rotation
    // A more accurate implementation would rotate the corners and find the actual bounds
    const x1 = module.position.x;
    const y1 = module.position.y;
    const x2 = module.position.x + module.size.width;
    const y2 = module.position.y + module.size.height;

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get center point of bounds
 */
export function getBoundsCenter(bounds: Bounds): Position {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

/**
 * Rotate point around center
 */
export function rotatePoint(
  point: Position,
  center: Position,
  angleDegrees: number
): Position {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
