/**
 * useKonvaAnimation Hook
 * Provides smooth animations for Konva nodes with performance guards
 */

import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { prefersReducedMotion } from '@/utils/accessibility';

export interface AnimationOptions {
  duration?: number;
  easing?: (t: number, b: number, c: number, d: number) => number;
  skipIfReducedMotion?: boolean;
  skipIfOutsideViewport?: boolean;
  stageRef?: React.RefObject<Konva.Stage>;
  isUserInitiated?: boolean; // Only animate if this is a user-initiated action
  enabled?: boolean; // Master switch to enable/disable animation
}

/**
 * Hook for animating Konva node properties
 * @param nodeRef - Ref to the Konva node to animate
 * @param targetProps - Target properties to animate to
 * @param options - Animation options
 */
export function useKonvaAnimation(
  nodeRef: React.RefObject<Konva.Node>,
  targetProps: { x?: number; y?: number; rotation?: number; width?: number; height?: number },
  options: AnimationOptions = {}
) {
  const tweenRef = useRef<Konva.Tween | null>(null);
  const prevValuesRef = useRef<{ x?: number; y?: number; rotation?: number; width?: number; height?: number }>({});
  const {
    duration = 200,
    easing,
    skipIfReducedMotion = true,
    skipIfOutsideViewport = false,
    stageRef,
    isUserInitiated = false,
    enabled = true,
  } = options;

  // Destructure to stabilize dependencies
  const { x, y, rotation, width, height } = targetProps;

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

    // Helper to safely set width/height on nodes that support it
    const setNodeSize = (node: Konva.Node, w?: number, h?: number) => {
      if (w !== undefined && 'width' in node.attrs) {
        (node as Konva.Rect).width(w);
      }
      if (h !== undefined && 'height' in node.attrs) {
        (node as Konva.Rect).height(h);
      }
    };

    // Skip animation if disabled
    if (!enabled) {
      // Still update values immediately
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      setNodeSize(node, width, height);
      node.getLayer()?.batchDraw();
      return;
    }

    // Only animate user-initiated actions
    if (!isUserInitiated) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      setNodeSize(node, width, height);
      node.getLayer()?.batchDraw();
      // Update previous values
      prevValuesRef.current = { x, y, rotation, width, height };
      return;
    }

    // Check if values actually changed
    const prevValues = prevValuesRef.current;
    const hasChanged =
      (x !== undefined && x !== prevValues.x) ||
      (y !== undefined && y !== prevValues.y) ||
      (rotation !== undefined && rotation !== prevValues.rotation) ||
      (width !== undefined && width !== prevValues.width) ||
      (height !== undefined && height !== prevValues.height);

    if (!hasChanged) return;

    // Update previous values
    prevValuesRef.current = { x, y, rotation, width, height };

    // Skip animation if user prefers reduced motion
    if (skipIfReducedMotion && prefersReducedMotion()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      setNodeSize(node, width, height);
      node.getLayer()?.batchDraw();
      return;
    }

    // Skip animation if module is outside viewport
    if (skipIfOutsideViewport && !isInViewport()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      setNodeSize(node, width, height);
      node.getLayer()?.batchDraw();
      return;
    }

    // Clean up previous tween
    if (tweenRef.current) {
      tweenRef.current.destroy();
    }

    // Create new tween
    interface TweenConfig {
      node: Konva.Node;
      duration: number;
      easing?: (t: number, b: number, c: number, d: number) => number;
      onFinish: () => void;
      x?: number;
      y?: number;
      rotation?: number;
      width?: number;
      height?: number;
    }

    const tweenConfig: TweenConfig = {
      node,
      duration: duration / 1000, // Konva uses seconds
      easing: easing || Konva.Easings.EaseInOut,
      onFinish: () => {
        tweenRef.current = null;
      },
    };

    // Only include properties that are defined
    if (x !== undefined) tweenConfig.x = x;
    if (y !== undefined) tweenConfig.y = y;
    if (rotation !== undefined) tweenConfig.rotation = rotation;
    if (width !== undefined && 'width' in node.attrs) {
      tweenConfig.width = width;
    }
    if (height !== undefined && 'height' in node.attrs) {
      tweenConfig.height = height;
    }

    const tween = new Konva.Tween(tweenConfig);

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
    width,
    height,
    duration,
    easing,
    skipIfReducedMotion,
    skipIfOutsideViewport,
    isInViewport,
    isUserInitiated,
    enabled,
  ]);
}

