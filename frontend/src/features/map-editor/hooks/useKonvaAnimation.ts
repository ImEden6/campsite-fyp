/**
 * useKonvaAnimation Hook
 * Provides smooth animations for Konva nodes with performance guards
 */

import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { prefersReducedMotion } from '@/utils/accessibility';

export interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  skipIfReducedMotion?: boolean;
  skipIfOutsideViewport?: boolean;
  stageRef?: React.RefObject<Konva.Stage>;
}

/**
 * Hook for animating Konva node properties
 * @param nodeRef - Ref to the Konva node to animate
 * @param targetProps - Target properties to animate to
 * @param options - Animation options
 */
export function useKonvaAnimation(
  nodeRef: React.RefObject<Konva.Node>,
  targetProps: { x?: number; y?: number; rotation?: number },
  options: AnimationOptions = {}
) {
  const tweenRef = useRef<Konva.Tween | null>(null);
  const prevValuesRef = useRef<{ x?: number; y?: number; rotation?: number }>({});
  const {
    duration = 200,
    easing,
    skipIfReducedMotion = true,
    skipIfOutsideViewport = false,
    stageRef,
  } = options;

  // Destructure to stabilize dependencies
  const { x, y, rotation } = targetProps;

  // Check if module is in viewport
  const isInViewport = useCallback(() => {
    if (!skipIfOutsideViewport || !stageRef?.current || !nodeRef.current) {
      return true; // Assume visible if can't determine
    }

    const stage = stageRef.current;
    const node = nodeRef.current;

    const viewport = stage.getClientRect();
    const nodeRect = node.getClientRect();

    return !(
      nodeRect.x > viewport.x + viewport.width ||
      nodeRect.x + nodeRect.width < viewport.x ||
      nodeRect.y > viewport.y + viewport.height ||
      nodeRect.y + nodeRect.height < viewport.y
    );
  }, [skipIfOutsideViewport, stageRef, nodeRef]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    // Check if values actually changed
    const prevValues = prevValuesRef.current;
    const hasChanged =
      (x !== undefined && x !== prevValues.x) ||
      (y !== undefined && y !== prevValues.y) ||
      (rotation !== undefined && rotation !== prevValues.rotation);

    if (!hasChanged) return;

    // Update previous values
    prevValuesRef.current = { x, y, rotation };

    // Skip animation if user prefers reduced motion
    if (skipIfReducedMotion && prefersReducedMotion()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      node.getLayer()?.batchDraw();
      return;
    }

    // Skip animation if module is outside viewport
    if (skipIfOutsideViewport && !isInViewport()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      node.getLayer()?.batchDraw();
      return;
    }

    // Clean up previous tween
    if (tweenRef.current) {
      tweenRef.current.destroy();
    }

    // Create new tween
    const tween = new Konva.Tween({
      node,
      duration: duration / 1000, // Konva uses seconds
      easing: easing || Konva.Easings.EaseInOut,
      x: x !== undefined ? x : node.x(),
      y: y !== undefined ? y : node.y(),
      rotation: rotation !== undefined ? rotation : node.rotation(),
      onFinish: () => {
        tweenRef.current = null;
      },
    });

    tweenRef.current = tween;
    tween.play();

    // Cleanup on unmount or dependency change
    return () => {
      if (tweenRef.current) {
        tweenRef.current.destroy();
        tweenRef.current = null;
      }
    };
  }, [
    nodeRef,
    x,
    y,
    rotation,
    duration,
    easing,
    skipIfReducedMotion,
    skipIfOutsideViewport,
    isInViewport,
  ]);
}

