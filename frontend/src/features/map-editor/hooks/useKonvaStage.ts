/**
 * useKonvaStage Hook
 * Manages Konva Stage instance, viewport synchronization, and coordinate conversion
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import { useViewportService } from './useViewportService';
import { useMapEditor } from './useMapEditor';
import { useEditorService } from './useEditorService';

export interface UseKonvaStageReturn {
  stageRef: React.RefObject<Konva.Stage>;
  containerRef: React.RefObject<HTMLDivElement>;
  stageSize: { width: number; height: number };
  getStage: () => Konva.Stage | null;
  getPointerPosition: () => { x: number; y: number } | null;
  screenToCanvas: (screenPos: { x: number; y: number }) => { x: number; y: number };
  canvasToScreen: (canvasPos: { x: number; y: number }) => { x: number; y: number };
  updateStageSize: () => void;
}

/**
 * Hook for managing Konva Stage instance
 */
export function useKonvaStage(): UseKonvaStageReturn {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const viewportService = useViewportService();
  const { eventBus } = useMapEditor();
  const { currentTool } = useEditorService();

  /**
   * Update stage size based on container dimensions
   */
  const updateStageSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    }
  }, []);

  /**
   * Get Stage instance
   */
  const getStage = useCallback((): Konva.Stage | null => {
    return stageRef.current;
  }, []);

  /**
   * Get pointer position in screen coordinates
   */
  const getPointerPosition = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getPointerPosition();
  }, []);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback(
    (screenPos: { x: number; y: number }): { x: number; y: number } => {
      const stage = stageRef.current;
      if (!stage) return screenPos;

      // Get stage transform
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();
      const posX = stage.x();
      const posY = stage.y();

      // Convert: canvasX = (screenX - stage.x()) / stage.scaleX()
      return {
        x: (screenPos.x - posX) / scaleX,
        y: (screenPos.y - posY) / scaleY,
      };
    },
    []
  );

  /**
   * Convert canvas coordinates to screen coordinates
   */
  const canvasToScreen = useCallback(
    (canvasPos: { x: number; y: number }): { x: number; y: number } => {
      const stage = stageRef.current;
      if (!stage) return canvasPos;

      // Get stage transform
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();
      const posX = stage.x();
      const posY = stage.y();

      // Convert: screenX = canvasX * stage.scaleX() + stage.x()
      return {
        x: canvasPos.x * scaleX + posX,
        y: canvasPos.y * scaleY + posY,
      };
    },
    []
  );

  // Initialize stage size
  useEffect(() => {
    updateStageSize();
  }, [updateStageSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateStageSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateStageSize]);

  // Sync function to apply viewport to stage
  const syncViewportToStage = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const viewport = viewportService.getViewport();

    // Apply zoom as scale
    stage.scale({ x: viewport.zoom, y: viewport.zoom });

    // Apply pan as position
    stage.position({ x: viewport.position.x, y: viewport.position.y });

    // Force redraw
    stage.batchDraw();
  }, [viewportService]);

  // Initial sync on mount
  useEffect(() => {
    syncViewportToStage();
  }, [syncViewportToStage]);

  // Listen for viewport changes via EventBus
  useEffect(() => {
    const unsubscribe = eventBus.on('viewport:change', () => {
      syncViewportToStage();
    });

    return unsubscribe;
  }, [eventBus, syncViewportToStage]);

  // Cursor management - set cursor based on tool and hovered element
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleMouseMove = () => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const container = stage.container();
      const shape = stage.getIntersection(pointer);

      if (shape?.attrs.moduleId && currentTool === 'select') {
        container.style.cursor = 'pointer';
      } else if (currentTool === 'move') {
        container.style.cursor = 'grab';
      } else {
        container.style.cursor = 'default';
      }
    };

    stage.on('mousemove', handleMouseMove);
    return () => {
      stage.off('mousemove', handleMouseMove);
    };
  }, [stageRef, currentTool]);

  return {
    stageRef,
    containerRef,
    stageSize,
    getStage,
    getPointerPosition,
    screenToCanvas,
    canvasToScreen,
    updateStageSize,
  };
}