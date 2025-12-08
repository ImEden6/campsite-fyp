/**
 * TransformHandles
 * Renders resize and rotation handles for a selected module.
 * Only shows when exactly one module is selected.
 */

import React, { useRef, useCallback, useState } from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import type { Position, Size } from '@/types';
import { calculateResize, calculateRotation, type ResizeHandle } from '@/utils/transformUtils';

const HANDLE_SIZE = 8;
const ROTATION_HANDLE_OFFSET = 30;
const ROTATION_HANDLE_RADIUS = 6;
const HANDLE_FILL = '#ffffff';
const HANDLE_STROKE = '#3b82f6';
const ROTATION_LINE_COLOR = '#3b82f6';

interface TransformHandlesProps {
    position: Position;
    size: Size;
    rotation: number;
    snapToGrid: boolean;
    gridSize: number;
    onResizeStart?: () => void;
    onResize?: (position: Position, size: Size) => void;
    onResizeEnd?: (position: Position, size: Size) => void;
    onRotateStart?: () => void;
    onRotate?: (angle: number) => void;
    onRotateEnd?: (angle: number) => void;
}

interface HandleConfig {
    name: ResizeHandle;
    x: number;
    y: number;
    cursor: string;
}

export const TransformHandles: React.FC<TransformHandlesProps> = ({
    position,
    size,
    rotation,
    snapToGrid,
    gridSize,
    onResizeStart,
    onResize,
    onResizeEnd,
    onRotateStart,
    onRotate,
    onRotateEnd,
}) => {
    const [activeHandle, setActiveHandle] = useState<ResizeHandle | 'rotate' | null>(null);
    const startMousePos = useRef<Position | null>(null);
    const startBounds = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

    // Calculate handle positions
    const handles: HandleConfig[] = [
        { name: 'top-left', x: 0, y: 0, cursor: 'nwse-resize' },
        { name: 'top-center', x: size.width / 2, y: 0, cursor: 'ns-resize' },
        { name: 'top-right', x: size.width, y: 0, cursor: 'nesw-resize' },
        { name: 'middle-left', x: 0, y: size.height / 2, cursor: 'ew-resize' },
        { name: 'middle-right', x: size.width, y: size.height / 2, cursor: 'ew-resize' },
        { name: 'bottom-left', x: 0, y: size.height, cursor: 'nesw-resize' },
        { name: 'bottom-center', x: size.width / 2, y: size.height, cursor: 'ns-resize' },
        { name: 'bottom-right', x: size.width, y: size.height, cursor: 'nwse-resize' },
    ];

    // Rotation handle position (above top-center)
    const rotationHandlePos = {
        x: size.width / 2,
        y: -ROTATION_HANDLE_OFFSET,
    };

    // Get center point for rotation calculations
    const getCenter = useCallback((): Position => ({
        x: position.x + size.width / 2,
        y: position.y + size.height / 2,
    }), [position, size]);

    // Handle resize drag start
    const handleResizeDragStart = useCallback((handle: ResizeHandle) => (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        setActiveHandle(handle);

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (pointerPos) {
            startMousePos.current = pointerPos;
            startBounds.current = { ...position, ...size };
            onResizeStart?.();
        }
    }, [position, size, onResizeStart]);

    // Handle resize drag move
    const handleResizeDragMove = useCallback((handle: ResizeHandle) => (e: Konva.KonvaEventObject<DragEvent>) => {
        if (!startMousePos.current || !startBounds.current || activeHandle !== handle) return;

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const result = calculateResize(
            handle,
            startBounds.current,
            pointerPos,
            startMousePos.current,
            {
                snapToGrid,
                gridSize,
                minSize: { width: 20, height: 20 },
            }
        );

        onResize?.(result.position, result.size);

        // Reset handle position (it will be repositioned by parent)
        e.target.position({ x: 0, y: 0 });
    }, [activeHandle, snapToGrid, gridSize, onResize]);

    // Handle resize drag end
    const handleResizeDragEnd = useCallback((handle: ResizeHandle) => (e: Konva.KonvaEventObject<DragEvent>) => {
        if (activeHandle !== handle || !startMousePos.current || !startBounds.current) return;

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const result = calculateResize(
            handle,
            startBounds.current,
            pointerPos,
            startMousePos.current,
            {
                snapToGrid,
                gridSize,
                minSize: { width: 20, height: 20 },
            }
        );

        onResizeEnd?.(result.position, result.size);

        setActiveHandle(null);
        startMousePos.current = null;
        startBounds.current = null;
    }, [activeHandle, snapToGrid, gridSize, onResizeEnd]);

    // Handle rotation drag start
    const handleRotationDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        setActiveHandle('rotate');
        onRotateStart?.();
    }, [onRotateStart]);

    // Handle rotation drag move
    const handleRotationDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (activeHandle !== 'rotate') return;

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const center = getCenter();
        const shiftPressed = e.evt.shiftKey;

        const result = calculateRotation(center, pointerPos, {
            snapAngle: shiftPressed ? 15 : undefined,
            currentRotation: rotation,
        });

        onRotate?.(result.angle);

        // Reset handle position
        e.target.position({ x: rotationHandlePos.x, y: rotationHandlePos.y });
    }, [activeHandle, getCenter, rotation, rotationHandlePos, onRotate]);

    // Handle rotation drag end
    const handleRotationDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (activeHandle !== 'rotate') return;

        const stage = e.target.getStage();
        const pointerPos = stage?.getPointerPosition();
        if (!pointerPos) return;

        const center = getCenter();
        const shiftPressed = e.evt.shiftKey;

        const result = calculateRotation(center, pointerPos, {
            snapAngle: shiftPressed ? 15 : undefined,
            currentRotation: rotation,
        });

        onRotateEnd?.(result.angle);

        setActiveHandle(null);
    }, [activeHandle, getCenter, rotation, onRotateEnd]);

    return (
        <Group
            x={position.x}
            y={position.y}
            rotation={rotation}
        >
            {/* Resize handles */}
            {handles.map((handle) => (
                <Rect
                    key={handle.name}
                    x={handle.x - HANDLE_SIZE / 2}
                    y={handle.y - HANDLE_SIZE / 2}
                    width={HANDLE_SIZE}
                    height={HANDLE_SIZE}
                    fill={HANDLE_FILL}
                    stroke={HANDLE_STROKE}
                    strokeWidth={1}
                    draggable
                    onDragStart={handleResizeDragStart(handle.name)}
                    onDragMove={handleResizeDragMove(handle.name)}
                    onDragEnd={handleResizeDragEnd(handle.name)}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = handle.cursor;
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            ))}

            {/* Line connecting to rotation handle */}
            <Line
                points={[size.width / 2, 0, size.width / 2, -ROTATION_HANDLE_OFFSET + ROTATION_HANDLE_RADIUS]}
                stroke={ROTATION_LINE_COLOR}
                strokeWidth={1}
                dash={[4, 2]}
                listening={false}
            />

            {/* Rotation handle */}
            <Circle
                x={rotationHandlePos.x}
                y={rotationHandlePos.y}
                radius={ROTATION_HANDLE_RADIUS}
                fill={HANDLE_FILL}
                stroke={HANDLE_STROKE}
                strokeWidth={1}
                draggable
                onDragStart={handleRotationDragStart}
                onDragMove={handleRotationDragMove}
                onDragEnd={handleRotationDragEnd}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
            />
        </Group>
    );
};

export default TransformHandles;
