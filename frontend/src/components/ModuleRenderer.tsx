/**
 * ModuleRenderer
 * Renders a single campsite module on the Konva canvas.
 * Handles visual representation based on module type and selection state.
 */

import React, { useRef, useCallback } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { AnyModule, Position, ModuleType } from '@/types';

// Module type color mapping
const MODULE_COLORS: Record<ModuleType, string> = {
    campsite: '#4ade80',      // green
    toilet: '#60a5fa',        // blue
    storage: '#a78bfa',       // purple
    building: '#f97316',      // orange
    parking: '#6b7280',       // gray
    road: '#78716c',          // stone
    water_source: '#22d3ee',  // cyan
    electricity: '#facc15',   // yellow
    waste_disposal: '#ef4444', // red
    recreation: '#ec4899',    // pink
    custom: '#8b5cf6',        // violet
};

const SELECTED_STROKE_COLOR = '#3b82f6';
const SELECTED_STROKE_WIDTH = 2;
const LOCKED_OPACITY = 0.6;
const DRAG_THRESHOLD = 5;

interface ModuleRendererProps {
    module: AnyModule;
    isSelected: boolean;
    onSelect: (id: string, additive: boolean) => void;
    onDragStart?: (id: string, position: Position) => void;
    onDragMove?: (id: string, position: Position) => void;
    onDragEnd?: (id: string, position: Position) => void;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({
    module,
    isSelected,
    onSelect,
    onDragStart,
    onDragMove,
    onDragEnd,
}) => {
    const groupRef = useRef<Konva.Group>(null);
    const dragStartPos = useRef<Position | null>(null);
    const isDragging = useRef(false);

    const { id, type, position, size, rotation, locked, visible, metadata } = module;

    // Get display name from metadata
    const displayName = (metadata as { name?: string }).name || type;

    // Handle click for selection
    const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true; // Prevent stage click
        const additive = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        onSelect(id, additive);
    }, [id, onSelect]);

    // Handle drag start
    const handleDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (locked) {
            e.target.stopDrag();
            return;
        }

        dragStartPos.current = { x: e.target.x(), y: e.target.y() };
        isDragging.current = false;
    }, [locked]);

    // Handle drag move with threshold
    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (!dragStartPos.current) return;

        const currentPos = { x: e.target.x(), y: e.target.y() };
        const dx = currentPos.x - dragStartPos.current.x;
        const dy = currentPos.y - dragStartPos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Start actual drag only after threshold
        if (!isDragging.current && distance >= DRAG_THRESHOLD) {
            isDragging.current = true;
            onDragStart?.(id, dragStartPos.current);
        }

        if (isDragging.current) {
            onDragMove?.(id, currentPos);
        }
    }, [id, onDragStart, onDragMove]);

    // Handle drag end
    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (isDragging.current) {
            const finalPos = { x: e.target.x(), y: e.target.y() };
            onDragEnd?.(id, finalPos);
        } else if (dragStartPos.current) {
            // Reset position if threshold wasn't met
            e.target.position(dragStartPos.current);
        }

        dragStartPos.current = null;
        isDragging.current = false;
    }, [id, onDragEnd]);

    if (!visible) {
        return null;
    }

    const fillColor = MODULE_COLORS[type] || MODULE_COLORS.custom;
    const opacity = locked ? LOCKED_OPACITY : 1;

    // Calculate font size based on module size
    const fontSize = Math.min(size.width / 8, size.height / 4, 14);
    const showLabel = fontSize >= 8;

    return (
        <Group
            ref={groupRef}
            id={id}
            x={position.x}
            y={position.y}
            rotation={rotation}
            draggable={!locked}
            onClick={handleClick}
            onTap={handleClick}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            opacity={opacity}
        >
            {/* Module shape */}
            <Rect
                width={size.width}
                height={size.height}
                fill={fillColor}
                cornerRadius={4}
                stroke={isSelected ? SELECTED_STROKE_COLOR : '#374151'}
                strokeWidth={isSelected ? SELECTED_STROKE_WIDTH : 1}
                shadowColor={isSelected ? SELECTED_STROKE_COLOR : undefined}
                shadowBlur={isSelected ? 8 : 0}
                shadowOpacity={0.3}
            />

            {/* Module label */}
            {showLabel && (
                <Text
                    text={displayName}
                    width={size.width}
                    height={size.height}
                    fontSize={fontSize}
                    fontFamily="Inter, system-ui, sans-serif"
                    fill="#1f2937"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                    ellipsis={true}
                    wrap="none"
                />
            )}
        </Group>
    );
};

export default ModuleRenderer;
