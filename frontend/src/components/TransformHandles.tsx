/**
 * TransformHandles Component
 * Renders 8 resize handles for module transformation
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { 
  calculateResize, 
  type ResizeHandle, 
  type Bounds,
  type ResizeResult 
} from '@/utils/transformUtils';
import { 
  validateSize, 
  enforceMinimumSize
} from '@/utils/validationUtils';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';
import type { Position, Size } from '@/types';
import { rafThrottle, performanceMonitor } from '@/utils/performanceUtils';

export interface TransformHandlesProps {
  bounds: Bounds;
  rotation: number;
  onResize: (newBounds: { position: Position; size: Size }) => void;
  onResizeStart?: () => void;
  onResizeEnd: () => void;
  snapToGrid: boolean;
  gridSize: number;
  minSize?: Size;
  maxSize?: Size;
  preserveAspectRatio?: boolean;
}

interface HandleConfig {
  position: ResizeHandle;
  x: number;
  y: number;
  cursor: string;
}

const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#0EA5E9';
const HANDLE_STROKE_COLOR = '#FFFFFF';
const HANDLE_STROKE_WIDTH = 2;

export const TransformHandles: React.FC<TransformHandlesProps> = ({
  bounds,
  rotation,
  onResize,
  onResizeStart,
  onResizeEnd,
  snapToGrid,
  gridSize,
  minSize = { width: 20, height: 20 },
  maxSize,
  preserveAspectRatio = false,
}) => {
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [startMousePos, setStartMousePos] = useState<Position>({ x: 0, y: 0 });
  const [startBounds, setStartBounds] = useState<Bounds>(bounds);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const groupRef = useRef<Konva.Group>(null);

  // Track Shift key state
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

  // Calculate handle positions
  const getHandleConfigs = useCallback((): HandleConfig[] => {
    const { x, y, width, height } = bounds;
    const halfSize = HANDLE_SIZE / 2;

    return [
      // Corner handles
      {
        position: 'top-left' as ResizeHandle,
        x: x - halfSize,
        y: y - halfSize,
        cursor: 'nw-resize',
      },
      {
        position: 'top-right' as ResizeHandle,
        x: x + width - halfSize,
        y: y - halfSize,
        cursor: 'ne-resize',
      },
      {
        position: 'bottom-left' as ResizeHandle,
        x: x - halfSize,
        y: y + height - halfSize,
        cursor: 'sw-resize',
      },
      {
        position: 'bottom-right' as ResizeHandle,
        x: x + width - halfSize,
        y: y + height - halfSize,
        cursor: 'se-resize',
      },
      // Edge handles
      {
        position: 'top-center' as ResizeHandle,
        x: x + width / 2 - halfSize,
        y: y - halfSize,
        cursor: 'n-resize',
      },
      {
        position: 'bottom-center' as ResizeHandle,
        x: x + width / 2 - halfSize,
        y: y + height - halfSize,
        cursor: 's-resize',
      },
      {
        position: 'middle-left' as ResizeHandle,
        x: x - halfSize,
        y: y + height / 2 - halfSize,
        cursor: 'w-resize',
      },
      {
        position: 'middle-right' as ResizeHandle,
        x: x + width - halfSize,
        y: y + height / 2 - halfSize,
        cursor: 'e-resize',
      },
    ];
  }, [bounds]);

  const handleMouseDown = useCallback(
    (handle: ResizeHandle, e: KonvaEventObject<MouseEvent>) => {
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

      setActiveHandle(handle);
      setStartMousePos(canvasPos);
      setStartBounds(bounds);
      
      // Call onResizeStart callback
      if (onResizeStart) {
        onResizeStart();
      }
    },
    [bounds, onResizeStart]
  );

  // Throttle mouse move using RAF for smooth 60 FPS performance
  const handleMouseMove = useMemo(
    () =>
      rafThrottle((e: KonvaEventObject<MouseEvent>) => {
        if (!activeHandle) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        const end = performanceMonitor.start('handle-resize');

        try {
          // Convert screen coordinates to canvas coordinates
          const canvasPos = {
            x: (pointerPos.x - stage.x()) / stage.scaleX(),
            y: (pointerPos.y - stage.y()) / stage.scaleY(),
          };

          // Calculate new bounds using transform utilities
          const shouldPreserveAspectRatio = preserveAspectRatio || isShiftPressed;

          const result: ResizeResult = calculateResize(
            activeHandle,
            startBounds,
            canvasPos,
            startMousePos,
            {
              preserveAspectRatio: shouldPreserveAspectRatio,
              snapToGrid,
              gridSize,
              minSize,
              maxSize,
            }
          );

          // Validate the new size
          const sizeValidation = validateSize(result.size);
          if (!sizeValidation.isValid) {
            // Enforce minimum size constraints
            result.size = enforceMinimumSize(result.size);

            errorLogger.warn(
              ErrorCategory.VALIDATION,
              'Resize operation resulted in invalid size, enforcing minimum constraints',
              {
                handle: activeHandle,
                attemptedSize: result.size,
                errors: sizeValidation.errors,
              }
            );
          }

          // Update display size during resize
          setDisplaySize({
            width: Math.round(result.size.width),
            height: Math.round(result.size.height),
          });

          onResize(result);
        } catch (error) {
          errorLogger.error(
            ErrorCategory.TRANSFORM,
            'Error during resize operation',
            { handle: activeHandle, bounds: startBounds },
            error instanceof Error ? error : new Error('Unknown resize error')
          );
        } finally {
          end();
        }
      }),
    [
      activeHandle,
      startBounds,
      startMousePos,
      snapToGrid,
      gridSize,
      minSize,
      maxSize,
      preserveAspectRatio,
      isShiftPressed,
      onResize,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (activeHandle) {
      setActiveHandle(null);
      setDisplaySize(null);
      onResizeEnd();
    }
  }, [activeHandle, onResizeEnd]);

  // Attach global mouse move and mouse up listeners when dragging
  useEffect(() => {
    if (!activeHandle) return;

    const stage = groupRef.current?.getStage();
    if (!stage) return;

    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);
    stage.on('mouseleave', handleMouseUp);

    return () => {
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
      stage.off('mouseleave', handleMouseUp);
    };
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  // Memoize handle configs to avoid recalculation
  const handleConfigs = useMemo(() => getHandleConfigs(), [getHandleConfigs]);

  return (
    <Group ref={groupRef} rotation={rotation}>
      {handleConfigs.map((config) => {
        const isHovered = hoveredHandle === config.position;
        const isActive = activeHandle === config.position;
        
        return (
          <Rect
            key={config.position}
            x={config.x}
            y={config.y}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill={isActive ? '#0284C7' : isHovered ? '#38BDF8' : HANDLE_COLOR}
            stroke={HANDLE_STROKE_COLOR}
            strokeWidth={HANDLE_STROKE_WIDTH}
            cornerRadius={2}
            scaleX={isHovered || isActive ? 1.2 : 1}
            scaleY={isHovered || isActive ? 1.2 : 1}
            shadowColor={isHovered || isActive ? 'rgba(0, 0, 0, 0.3)' : undefined}
            shadowBlur={isHovered || isActive ? 4 : 0}
            onMouseDown={(e) => handleMouseDown(config.position, e)}
            onMouseEnter={(e) => {
              setHoveredHandle(config.position);
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = config.cursor;
              }
            }}
            onMouseLeave={(e) => {
              if (!activeHandle) {
                setHoveredHandle(null);
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = 'default';
                }
              }
            }}
            // Prevent dragging the handle itself
            draggable={false}
          />
        );
      })}
      
      {/* Display current size during resize */}
      {displaySize && (
        <Group>
          <Rect
            x={bounds.x + bounds.width / 2 - 50}
            y={bounds.y + bounds.height / 2 - 15}
            width={100}
            height={30}
            fill="rgba(255, 255, 255, 0.95)"
            cornerRadius={4}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
          />
          <Text
            x={bounds.x + bounds.width / 2 - 50}
            y={bounds.y + bounds.height / 2 - 10}
            width={100}
            text={`${displaySize.width} × ${displaySize.height}`}
            fontSize={14}
            fontFamily="Inter"
            fontStyle="bold"
            fill="#374151"
            align="center"
          />
        </Group>
      )}
    </Group>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(TransformHandles, (prevProps, nextProps) => {
  return (
    prevProps.bounds.x === nextProps.bounds.x &&
    prevProps.bounds.y === nextProps.bounds.y &&
    prevProps.bounds.width === nextProps.bounds.width &&
    prevProps.bounds.height === nextProps.bounds.height &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.snapToGrid === nextProps.snapToGrid &&
    prevProps.gridSize === nextProps.gridSize
  );
});
