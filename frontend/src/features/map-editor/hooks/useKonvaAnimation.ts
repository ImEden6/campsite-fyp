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

  // Helper to validate numeric values
  const isValidNumber = (value: number | undefined): boolean => {
    return value !== undefined && !isNaN(value) && isFinite(value);
  };

  // Helper to safely set width/height on nodes that support it
  const setNodeSize = useCallback((node: Konva.Node, w?: number, h?: number) => {
    // Use setAttr for safer property setting that works with all node types
    if (w !== undefined && isValidNumber(w) && 'setAttr' in node) {
      node.setAttr('width', w);
    }
    if (h !== undefined && isValidNumber(h) && 'setAttr' in node) {
      node.setAttr('height', h);
    }
  }, []);

  // Helper to apply all values immediately without animation
  const applyValuesImmediately = useCallback((node: Konva.Node) => {
    if (x !== undefined && isValidNumber(x)) node.x(x);
    if (y !== undefined && isValidNumber(y)) node.y(y);
    if (rotation !== undefined && isValidNumber(rotation)) node.rotation(rotation);
    setNodeSize(node, width, height);
    node.getLayer()?.batchDraw();
  }, [x, y, rotation, width, height, setNodeSize]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    // Skip animation if disabled
    if (!enabled) {
      // Still update values immediately
      applyValuesImmediately(node);
      return;
    }

    // Only animate user-initiated actions
    if (!isUserInitiated) {
      // Apply changes immediately without animation
      applyValuesImmediately(node);
      // Update previous values
      prevValuesRef.current = { x, y, rotation, width, height };
      return;
    }

    // Validate and check if values actually changed
    const prevValues = prevValuesRef.current;
    const hasChanged =
      (x !== undefined && isValidNumber(x) && x !== prevValues.x) ||
      (y !== undefined && isValidNumber(y) && y !== prevValues.y) ||
      (rotation !== undefined && isValidNumber(rotation) && rotation !== prevValues.rotation) ||
      (width !== undefined && isValidNumber(width) && width !== prevValues.width) ||
      (height !== undefined && isValidNumber(height) && height !== prevValues.height);

    if (!hasChanged) return;

    // Update previous values
    prevValuesRef.current = { x, y, rotation, width, height };

    // Skip animation if user prefers reduced motion
    if (skipIfReducedMotion && prefersReducedMotion()) {
      // Apply changes immediately without animation
      applyValuesImmediately(node);
      return;
    }

    // Skip animation if module is outside viewport
    if (skipIfOutsideViewport && !isInViewport()) {
      // Apply changes immediately without animation
      applyValuesImmediately(node);
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

    // Only include properties that are defined and valid
    if (x !== undefined && isValidNumber(x)) tweenConfig.x = x;
    if (y !== undefined && isValidNumber(y)) tweenConfig.y = y;
    if (rotation !== undefined && isValidNumber(rotation)) tweenConfig.rotation = rotation;
    if (width !== undefined && isValidNumber(width) && 'setAttr' in node) {
      tweenConfig.width = width;
    }
    if (height !== undefined && isValidNumber(height) && 'setAttr' in node) {
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
    applyValuesImmediately,
  ]);
}

