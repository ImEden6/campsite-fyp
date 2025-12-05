/**
 * Konva Selection Handles
 * Helper component for rendering selection handles with Konva
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Group, Rect, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { AnyModule, Position, Size } from '@/types';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';
import { calculateRotation, getBoundsCenter } from '@/utils/transformUtils';
import { normalizeRotation } from '@/utils/validationUtils';

interface KonvaSelectionHandlesProps {
  modules: AnyModule[];
  onTransform?: (transform: {
    position?: Position;
    size?: Size;
    rotation?: number;
  }) => void;
}

/**
 * Calculate bounding box for multiple modules
 */
const calculateBounds = (modules: AnyModule[]) => {
  return modules.reduce(
    (acc, module) => {
      const minX = Math.min(acc.minX, module.position.x);
      const minY = Math.min(acc.minY, module.position.y);
      const maxX = Math.max(
        acc.maxX,
        module.position.x + module.size.width
      );
      const maxY = Math.max(
        acc.maxY,
        module.position.y + module.size.height
      );
      return { minX, minY, maxX, maxY };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
};

/**
 * Konva Selection Handles Component
 * Renders selection rectangle and transform handles
 */
export const KonvaSelectionHandles: React.FC<KonvaSelectionHandlesProps> = ({
  modules,
  onTransform,
}) => {
  // Track resize state (currently unused but may be needed for visual feedback)
  const [_isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  // Cleanup state on unmount
  useEffect(() => {
    return () => {
      setIsResizing(false);
      setResizeStart(null);
      setIsRotating(false);
    };
  }, []);

  const bounds = useMemo(() => calculateBounds(modules), [modules]);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const handleSize = 8;
  const handleOffset = handleSize / 2;
  const HANDLE_RADIUS = 6;
  const HANDLE_DISTANCE = 40; // Distance above the module

  // Track Shift key state for snap angles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Calculate center point and bounds for rotation (only for single module)
  const rotationData = useMemo(() => {
    if (modules.length !== 1) return null;
    const module = modules[0];
    if (!module) return null;
    const bounds = {
      x: module.position.x,
      y: module.position.y,
      width: module.size.width,
      height: module.size.height,
    };
    return {
      center: getBoundsCenter(bounds),
      bounds,
    };
  }, [modules]);

  // Handle rotation mouse down
  const handleRotateStart = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!onTransform || modules.length !== 1 || !rotationData) return;

      e.cancelBubble = true;
      setIsRotating(true);
    },
    [onTransform, modules, rotationData]
  );

  // Handle rotation mouse move (attached to stage)
  const handleRotateMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!onTransform || !isRotating || modules.length !== 1 || !rotationData) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      // Calculate rotation angle
      const module = modules[0];
      if (!module) return;
      const currentRotation = module.rotation || 0;
      const shouldSnap = isShiftPressed;
      const result = calculateRotation(rotationData.center, canvasPos, {
        snapAngle: shouldSnap ? 15 : undefined,
        currentRotation,
      });

      const validatedAngle = normalizeRotation(result.angle);

      onTransform({
        rotation: validatedAngle,
      });
    },
    [onTransform, isRotating, modules, rotationData, isShiftPressed]
  );

  // Handle rotation mouse up
  const handleRotateEnd = useCallback(() => {
    setIsRotating(false);
  }, []);

  // Attach global mouse move and mouse up listeners when rotating
  useEffect(() => {
    if (!isRotating) return;

    const group = groupRef.current;
    if (!group) return;

    const stage = group.getStage();
    if (!stage) return;

    stage.on('mousemove', handleRotateMove);
    stage.on('mouseup', handleRotateEnd);
    stage.on('mouseleave', handleRotateEnd);

    return () => {
      stage.off('mousemove', handleRotateMove);
      stage.off('mouseup', handleRotateEnd);
      stage.off('mouseleave', handleRotateEnd);
    };
  }, [isRotating, handleRotateMove, handleRotateEnd]);

  // Handle resize drag start
  const handleResizeStart = useCallback(
    (
      e: KonvaEventObject<DragEvent>,
      _corner: 'nw' | 'ne' | 'sw' | 'se'
    ) => {
      if (!onTransform || modules.length !== 1) return;

      e.cancelBubble = true;
      setIsResizing(true);

      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      setResizeStart({
        x: canvasPos.x,
        y: canvasPos.y,
        width,
        height,
      });
    },
    [onTransform, modules, width, height]
  );

  // Handle resize drag move
  const handleResizeMove = useCallback(
    (e: KonvaEventObject<DragEvent>, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      if (!onTransform || !resizeStart || modules.length !== 1) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const deltaX = canvasPos.x - resizeStart.x;
      const deltaY = canvasPos.y - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newPosition: Position | undefined;

      const module = modules[0];
      if (!module) return;
      const startX = module.position.x;
      const startY = module.position.y;

      // Calculate new size and position based on corner
      switch (corner) {
        case 'nw': {
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height - deltaY;
          newPosition = {
            x: startX + deltaX,
            y: startY + deltaY,
          };
          break;
        }
        case 'ne': {
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height - deltaY;
          newPosition = {
            x: startX,
            y: startY + deltaY,
          };
          break;
        }
        case 'sw': {
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height + deltaY;
          newPosition = {
            x: startX + deltaX,
            y: startY,
          };
          break;
        }
        case 'se': {
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height + deltaY;
          // Position doesn't change
          break;
        }
      }

      // Enforce minimum size
      const minSize = EDITOR_CONSTANTS.MIN_MODULE_SIZE.width;
      newWidth = Math.max(minSize, newWidth);
      newHeight = Math.max(minSize, newHeight);

      onTransform({
        size: { width: newWidth, height: newHeight },
        position: newPosition,
      });
    },
    [onTransform, resizeStart, modules]
  );

  // Handle resize drag end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeStart(null);
  }, []);

  // Render selection rectangle (dashed border)
  const renderSelectionRect = useMemo(() => {
    return (
      <Rect
        x={bounds.minX}
        y={bounds.minY}
        width={width}
        height={height}
        fill="none"
        stroke="#0EA5E9"
        strokeWidth={2}
        dash={[4, 4]}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }, [bounds.minX, bounds.minY, width, height]);

  // Render resize handles (only for single module)
  const renderResizeHandles = useMemo(() => {
    if (modules.length !== 1 || !onTransform) {
      return null;
    }

    const handles = [
      {
        x: bounds.minX - handleOffset,
        y: bounds.minY - handleOffset,
        corner: 'nw' as const,
        cursor: 'nwse-resize',
      },
      {
        x: bounds.maxX - handleOffset,
        y: bounds.minY - handleOffset,
        corner: 'ne' as const,
        cursor: 'nesw-resize',
      },
      {
        x: bounds.minX - handleOffset,
        y: bounds.maxY - handleOffset,
        corner: 'sw' as const,
        cursor: 'nesw-resize',
      },
      {
        x: bounds.maxX - handleOffset,
        y: bounds.maxY - handleOffset,
        corner: 'se' as const,
        cursor: 'nwse-resize',
      },
    ];

    return handles.map((handle, index) => (
      <Rect
        key={index}
        x={handle.x}
        y={handle.y}
        width={handleSize}
        height={handleSize}
        fill="#0EA5E9"
        stroke="#fff"
        strokeWidth={1}
        draggable={true}
        onDragStart={(e) => handleResizeStart(e, handle.corner)}
        onDragMove={(e) => handleResizeMove(e, handle.corner)}
        onDragEnd={handleResizeEnd}
        perfectDrawEnabled={false}
      />
    ));
  }, [
    modules.length,
    onTransform,
    bounds.minX,
    bounds.minY,
    bounds.maxX,
    bounds.maxY,
    handleOffset,
    handleSize,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  ]);

  // Render rotation handle (only for single module)
  const renderRotationHandle = useMemo(() => {
    if (modules.length !== 1 || !onTransform || !rotationData) {
      return null;
    }

    const handleX = rotationData.center.x;
    const handleY = bounds.minY - HANDLE_DISTANCE;

    return (
      <Group>
        {/* Line connecting center to handle */}
        <Line
          points={[rotationData.center.x, rotationData.center.y, handleX, handleY]}
          stroke="#0EA5E9"
          strokeWidth={1}
          dash={[5, 5]}
          listening={false}
          perfectDrawEnabled={false}
        />
        {/* Rotation handle */}
        <Circle
          x={handleX}
          y={handleY}
          radius={HANDLE_RADIUS}
          fill="#0EA5E9"
          stroke="#fff"
          strokeWidth={2}
          onMouseDown={handleRotateStart}
          perfectDrawEnabled={false}
        />
      </Group>
    );
  }, [
    modules.length,
    onTransform,
    rotationData,
    bounds.minY,
    handleRotateStart,
  ]);

  // Only render if we have valid bounds (after all hooks)
  if (
    bounds.minX === Infinity ||
    bounds.minY === Infinity ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return (
    <Group ref={groupRef} listening={true}>
      {renderSelectionRect}
      {renderResizeHandles}
      {renderRotationHandle}
    </Group>
  );
};

