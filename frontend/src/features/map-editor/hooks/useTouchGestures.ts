/**
 * useTouchGestures Hook
 * Handles touch gestures including pinch zoom and pan
 */

import { useState, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';

interface TouchState {
  touches: Touch[];
  lastDistance?: number;
  isPinching: boolean;
}

/**
 * Calculate distance between two touch points
 */
function calculateDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

const MIN_PINCH_DISTANCE = 10; // pixels - minimum threshold to prevent jitter

export interface UseTouchGesturesOptions {
  onPinchZoom?: (delta: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }) => void;
}

/**
 * Hook for handling touch gestures
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}) {
  const { onPinchZoom, onPan } = options;
  const [touchState, setTouchState] = useState<TouchState>({
    touches: [],
    isPinching: false,
  });

  const handleTouchStart = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      const touches = Array.from(e.evt.touches);

      if (touches.length > 1 && touches[0] && touches[1]) {
        // Multi-touch: prevent default, handle pinch
        e.evt.preventDefault();

        const distance = calculateDistance(touches[0], touches[1]);
        setTouchState({
          touches,
          lastDistance: distance,
          isPinching: true,
        });
      } else if (touches.length === 1) {
        // Single touch: let Konva handle (don't preventDefault)
        setTouchState({
          touches,
          isPinching: false,
        });
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      const touches = Array.from(e.evt.touches);

      if (touches.length > 1 && touchState.isPinching && onPinchZoom && touches[0] && touches[1]) {
        // Pinch zoom
        e.evt.preventDefault();

        const distance = calculateDistance(touches[0], touches[1]);
        if (touchState.lastDistance !== undefined) {
          // Ignore tiny movements to prevent jitter
          if (Math.abs(distance - touchState.lastDistance) < MIN_PINCH_DISTANCE) {
            return;
          }

          const delta = distance / touchState.lastDistance;
          const center = {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2,
          };
          onPinchZoom(delta, center);
        }

        setTouchState((prev) => ({ ...prev, lastDistance: distance }));
      } else if (touches.length === 1 && onPan) {
        // Single touch pan (if needed)
        // Note: Konva handles single touch drag automatically
        // This is only for custom pan handling if needed
      }
      // Single touch: let Konva handle naturally
    },
    [touchState.isPinching, touchState.lastDistance, onPinchZoom, onPan]
  );

  const handleTouchEnd = useCallback(
    (e: KonvaEventObject<TouchEvent>) => {
      const touches = Array.from(e.evt.touches);

      if (touches.length < 2) {
        setTouchState({
          touches,
          isPinching: false,
          lastDistance: undefined,
        });
      }
    },
    []
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

