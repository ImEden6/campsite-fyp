/**
 * SelectionBoundingBox Component
 * Renders a bounding box around multiple selected modules with transform handles
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Group, Rect } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import TransformHandles from './TransformHandles';
import RotationHandle from './RotationHandle';
import {
  calculateBoundingBox,
  type Bounds,
} from '@/utils/transformUtils';
import type { AnyModule, Position, Size } from '@/types';
import { rafThrottle, performanceMonitor } from '@/utils/performanceUtils';

export interface SelectionBoundingBoxProps {
  modules: AnyModule[];
  onTransform: (transform: {
    translation?: { x: number; y: number };
    scale?: { x: number; y: number };
    rotation?: number;
  }) => void;
  onTransformStart?: () => void;
  onTransformEnd: () => void;
  snapToGrid: boolean;
  gridSize: number;
}

const BOUNDING_BOX_COLOR = '#0EA5E9';
const BOUNDING_BOX_DASH = [10, 5];
const BOUNDING_BOX_STROKE_WIDTH = 2;

export const SelectionBoundingBox: React.FC<SelectionBoundingBoxProps> = ({
  modules,
  onTransform,
  onTransformStart,
  onTransformEnd,
  snapToGrid,
  gridSize,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startMousePos, setStartMousePos] = useState<Position>({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState<Bounds | null>(null);
  const [currentRotation, setCurrentRotation] = useState(0);

  // Memoize bounding box calculation to avoid recalculating on every render
  const boundingBox = useMemo(() => {
    return calculateBoundingBox(
      modules.map((m) => ({
        position: m.position,
        size: m.size,
        rotation: m.rotation || 0,
      }))
    );
  }, [modules]);

  // Calculate center point for rotation (used by child components)
  // const center = getBoundsCenter(boundingBox);

  // Handle group move (translate all modules together)
  const handleDragStart = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Convert screen coordinates to canvas coordinates
      const canvasPos = {
        x: (pointerPos.x - stage.x()) / stage.scaleX(),
        y: (pointerPos.y - stage.y()) / stage.scaleY(),
      };

      setIsDragging(true);
      setStartMousePos(canvasPos);
      setStartBounds(boundingBox);

      if (onTransformStart) {
        onTransformStart();
      }
    },
    [boundingBox, onTransformStart]
  );

  // Throttle drag move using RAF for smooth 60 FPS performance
  const handleDragMove = useMemo(
    () =>
      rafThrottle((e: KonvaEventObject<MouseEvent>) => {
        if (!isDragging || !startBounds) return;

        const end = performanceMonitor.start('group-drag');

        try {
          const stage = e.target.getStage();
          if (!stage) return;

          const pointerPos = stage.getPointerPosition();
          if (!pointerPos) return;

          // Convert screen coordinates to canvas coordinates
          const canvasPos = {
            x: (pointerPos.x - stage.x()) / stage.scaleX(),
            y: (pointerPos.y - stage.y()) / stage.scaleY(),
          };

          let dx = canvasPos.x - startMousePos.x;
          let dy = canvasPos.y - startMousePos.y;

          // Apply snap to grid
          if (snapToGrid) {
            dx = Math.round(dx / gridSize) * gridSize;
            dy = Math.round(dy / gridSize) * gridSize;
          }

          // Emit translation transform
          onTransform({
            translation: { x: dx, y: dy },
          });
        } finally {
          end();
        }
      }),
    [isDragging, startBounds, startMousePos, snapToGrid, gridSize, onTransform]
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setStartBounds(null);
      onTransformEnd();
    }
  }, [isDragging, onTransformEnd]);

  // Attach global mouse move and mouse up listeners when dragging
  useEffect(() => {
    if (!isDragging) return;

    const stage = groupRef.current?.getStage();
    if (!stage) return;

    stage.on('mousemove', handleDragMove);
    stage.on('mouseup', handleDragEnd);
    stage.on('mouseleave', handleDragEnd);

    return () => {
      stage.off('mousemove', handleDragMove);
      stage.off('mouseup', handleDragEnd);
      stage.off('mouseleave', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle group resize (scale all modules proportionally)
  const handleResizeStart = useCallback(() => {
    setStartBounds(boundingBox);
    if (onTransformStart) {
      onTransformStart();
    }
  }, [boundingBox, onTransformStart]);

  // Throttle resize using RAF
  const handleResize = useMemo(
    () =>
      rafThrottle((newBounds: { position: Position; size: Size }) => {
        if (!startBounds) return;

        const end = performanceMonitor.start('group-resize');

        try {
          // Calculate scale factors
          const scaleX = newBounds.size.width / startBounds.width;
          const scaleY = newBounds.size.height / startBounds.height;

          // Calculate translation (change in top-left corner)
          const dx = newBounds.position.x - startBounds.x;
          const dy = newBounds.position.y - startBounds.y;

          // Emit scale and translation transform
          onTransform({
            scale: { x: scaleX, y: scaleY },
            translation: { x: dx, y: dy },
          });
        } finally {
          end();
        }
      }),
    [startBounds, onTransform]
  );

  const handleResizeEnd = useCallback(() => {
    setStartBounds(null);
    onTransformEnd();
  }, [onTransformEnd]);

  // Handle group rotate (rotate all modules around center)
  const handleRotateStart = useCallback(() => {
    setCurrentRotation(0);
    if (onTransformStart) {
      onTransformStart();
    }
  }, [onTransformStart]);

  // Throttle rotation using RAF
  const handleRotate = useMemo(
    () =>
      rafThrottle((newRotation: number) => {
        const end = performanceMonitor.start('group-rotate');

        try {
          setCurrentRotation(newRotation);

          // Emit rotation transform
          onTransform({
            rotation: newRotation,
          });
        } finally {
          end();
        }
      }),
    [onTransform]
  );

  const handleRotateEnd = useCallback(() => {
    setCurrentRotation(0);
    onTransformEnd();
  }, [onTransformEnd]);

  if (modules.length === 0) {
    return null;
  }

  return (
    <Group ref={groupRef}>
      {/* Bounding box with dashed border */}
      <Rect
        x={boundingBox.x}
        y={boundingBox.y}
        width={boundingBox.width}
        height={boundingBox.height}
        stroke={isDragging ? '#38BDF8' : BOUNDING_BOX_COLOR}
        strokeWidth={isDragging ? 3 : BOUNDING_BOX_STROKE_WIDTH}
        dash={BOUNDING_BOX_DASH}
        fill={isDragging ? 'rgba(14, 165, 233, 0.05)' : 'transparent'}
        shadowColor={isDragging ? 'rgba(14, 165, 233, 0.3)' : undefined}
        shadowBlur={isDragging ? 8 : 0}
        onMouseDown={handleDragStart}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }
        }}
      />

      {/* Transform handles for group resize */}
      <TransformHandles
        bounds={boundingBox}
        rotation={0}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        snapToGrid={snapToGrid}
        gridSize={gridSize}
        minSize={{ width: 40, height: 40 }}
        preserveAspectRatio={false}
      />

      {/* Rotation handle for group rotation */}
      <RotationHandle
        bounds={boundingBox}
        currentRotation={currentRotation}
        onRotateStart={handleRotateStart}
        onRotate={handleRotate}
        onRotateEnd={handleRotateEnd}
        snapAngle={15}
      />
    </Group>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(SelectionBoundingBox, (prevProps, nextProps) => {
  // Only re-render if modules or settings change
  if (prevProps.modules.length !== nextProps.modules.length) {
    return false;
  }
  
  // Check if any module has changed
  for (let i = 0; i < prevProps.modules.length; i++) {
    const prevModule = prevProps.modules[i];
    const nextModule = nextProps.modules[i];
    
    // Skip if either module is undefined (shouldn't happen, but TypeScript safety)
    if (!prevModule || !nextModule) {
      return false;
    }
    
    if (
      prevModule.id !== nextModule.id ||
      prevModule.position.x !== nextModule.position.x ||
      prevModule.position.y !== nextModule.position.y ||
      prevModule.size.width !== nextModule.size.width ||
      prevModule.size.height !== nextModule.size.height ||
      prevModule.rotation !== nextModule.rotation
    ) {
      return false;
    }
  }
  
  return (
    prevProps.snapToGrid === nextProps.snapToGrid &&
    prevProps.gridSize === nextProps.gridSize
  );
});
