/**
 * RotationHandle Component
 * Renders a rotation handle above the module for rotating modules
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Group, Circle, Line, Text, Rect } from 'react-konva';
import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { calculateRotation, getBoundsCenter, type Bounds } from '@/utils/transformUtils';
import { validateRotation, normalizeRotation } from '@/utils/validationUtils';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';
import type { Position } from '@/types';
import { rafThrottle, performanceMonitor } from '@/utils/performanceUtils';

export interface RotationHandleProps {
  bounds: Bounds;
  currentRotation: number;
  onRotate: (newRotation: number) => void;
  onRotateStart?: () => void;
  onRotateEnd: () => void;
  snapAngle?: number; // Default 15 degrees when Shift is held
}

const HANDLE_RADIUS = 6;
const HANDLE_COLOR = '#0EA5E9';
const HANDLE_STROKE_COLOR = '#FFFFFF';
const HANDLE_STROKE_WIDTH = 2;
const HANDLE_DISTANCE = 40; // Distance above the module
const LINE_COLOR = '#0EA5E9';
const LINE_DASH = [5, 5];

export const RotationHandle: React.FC<RotationHandleProps> = ({
  bounds,
  currentRotation,
  onRotate,
  onRotateStart,
  onRotateEnd,
  snapAngle = 15,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [displayAngle, setDisplayAngle] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<Konva.Group>(null);

  // Memoize center point calculation
  const center = useMemo(() => getBoundsCenter(bounds), [bounds]);

  // Memoize handle position
  const handlePosition = useMemo(() => ({
    x: center.x,
    y: bounds.y - HANDLE_DISTANCE,
  }), [center, bounds.y]);

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

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      setIsRotating(true);
      
      // Call onRotateStart callback
      if (onRotateStart) {
        onRotateStart();
      }
    },
    [onRotateStart]
  );

  // Throttle mouse move using RAF for smooth 60 FPS performance
  const handleMouseMove = useMemo(
    () =>
      rafThrottle((e: KonvaEventObject<MouseEvent>) => {
        if (!isRotating) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        const end = performanceMonitor.start('handle-rotate');

        try {
          // Convert screen coordinates to canvas coordinates
          const canvasPos: Position = {
            x: (pointerPos.x - stage.x()) / stage.scaleX(),
            y: (pointerPos.y - stage.y()) / stage.scaleY(),
          };

          // Calculate rotation angle using transform utilities
          const shouldSnap = isShiftPressed;
          const result = calculateRotation(center, canvasPos, {
            snapAngle: shouldSnap ? snapAngle : undefined,
            currentRotation,
          });

          // Validate rotation angle
          const rotationValidation = validateRotation(result.angle);
          let validatedAngle = result.angle;

          if (!rotationValidation.isValid) {
            // Normalize rotation to valid range
            validatedAngle = normalizeRotation(result.angle);

            errorLogger.warn(
              ErrorCategory.VALIDATION,
              'Rotation angle normalized to valid range',
              {
                attemptedAngle: result.angle,
                normalizedAngle: validatedAngle,
                errors: rotationValidation.errors,
              }
            );
          }

          setDisplayAngle(validatedAngle);
          onRotate(validatedAngle);
        } catch (error) {
          errorLogger.error(
            ErrorCategory.TRANSFORM,
            'Error during rotation operation',
            { center, currentRotation },
            error instanceof Error ? error : new Error('Unknown rotation error')
          );
        } finally {
          end();
        }
      }),
    [isRotating, center, isShiftPressed, snapAngle, currentRotation, onRotate]
  );

  const handleMouseUp = useCallback(() => {
    if (isRotating) {
      setIsRotating(false);
      setDisplayAngle(null);
      onRotateEnd();
    }
  }, [isRotating, onRotateEnd]);

  // Attach global mouse move and mouse up listeners when rotating
  useEffect(() => {
    if (!isRotating) return;

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
  }, [isRotating, handleMouseMove, handleMouseUp]);

  return (
    <Group ref={groupRef}>
      {/* Connecting dashed line from module center to handle */}
      <Line
        points={[center.x, bounds.y, handlePosition.x, handlePosition.y]}
        stroke={LINE_COLOR}
        strokeWidth={1}
        dash={LINE_DASH}
        perfectDrawEnabled={false}
      />

      {/* Rotation handle */}
      <Circle
        x={handlePosition.x}
        y={handlePosition.y}
        radius={HANDLE_RADIUS}
        fill={isRotating ? '#0284C7' : isHovered ? '#38BDF8' : HANDLE_COLOR}
        stroke={HANDLE_STROKE_COLOR}
        strokeWidth={HANDLE_STROKE_WIDTH}
        scaleX={isHovered || isRotating ? 1.2 : 1}
        scaleY={isHovered || isRotating ? 1.2 : 1}
        shadowColor={isHovered || isRotating ? 'rgba(0, 0, 0, 0.3)' : undefined}
        shadowBlur={isHovered || isRotating ? 4 : 0}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => {
          setIsHovered(true);
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = isRotating ? 'grabbing' : 'grab';
          }
        }}
        onMouseLeave={(e) => {
          if (!isRotating) {
            setIsHovered(false);
            const container = e.target.getStage()?.container();
            if (container) {
              container.style.cursor = 'default';
            }
          }
        }}
        draggable={false}
      />

      {/* Display current angle during rotation */}
      {displayAngle !== null && (
        <Group>
          <Rect
            x={handlePosition.x - 35}
            y={handlePosition.y - 30}
            width={70}
            height={24}
            fill="rgba(255, 255, 255, 0.95)"
            cornerRadius={4}
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={4}
            shadowOffset={{ x: 0, y: 2 }}
            perfectDrawEnabled={false}
          />
          <Text
            x={handlePosition.x - 35}
            y={handlePosition.y - 26}
            width={70}
            text={`${Math.round(displayAngle)}°`}
            fontSize={14}
            fontFamily="Inter"
            fontStyle="bold"
            fill="#374151"
            align="center"
            perfectDrawEnabled={false}
          />
        </Group>
      )}
    </Group>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(RotationHandle, (prevProps, nextProps) => {
  return (
    prevProps.bounds.x === nextProps.bounds.x &&
    prevProps.bounds.y === nextProps.bounds.y &&
    prevProps.bounds.width === nextProps.bounds.width &&
    prevProps.bounds.height === nextProps.bounds.height &&
    prevProps.currentRotation === nextProps.currentRotation &&
    prevProps.snapAngle === nextProps.snapAngle
  );
});
