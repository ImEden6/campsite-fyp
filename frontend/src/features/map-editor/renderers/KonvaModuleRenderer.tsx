/**
 * Konva Module Renderer
 * Helper component for rendering individual modules with Konva
 */

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { AnyModule, ModuleType, Position } from '@/types';
import type { RenderProps } from '../core/renderer';
import { useKonvaAnimation } from '../hooks/useKonvaAnimation';
import { useKonvaStage } from '../hooks/useKonvaStage';
import { useEditorService } from '../hooks/useEditorService';

interface KonvaModuleRendererProps {
  module: AnyModule;
  props: RenderProps;
  shouldAnimate?: boolean;
  isFocused?: boolean;
  onDragStart?: (moduleId: string, offset: Position) => void;
  onDragMove?: (moduleId: string, position: Position) => void;
  onDragEnd?: (moduleId: string) => void;
}

const getModuleColor = (type: ModuleType): string => {
  const colorMap: Record<ModuleType, string> = {
    campsite: '#3B82F6',
    toilet: '#8B5CF6',
    storage: '#F59E0B',
    building: '#10B981',
    parking: '#6B7280',
    road: '#4B5563',
    water_source: '#06B6D4',
    electricity: '#F59E0B',
    waste_disposal: '#EF4444',
    recreation: '#10B981',
    custom: '#6366F1',
  };
  return colorMap[type] || '#6B7280';
};

const getModuleIcon = (type: ModuleType): string => {
  const iconMap: Record<ModuleType, string> = {
    campsite: '🏕️',
    toilet: '🚻',
    storage: '📦',
    building: '🏢',
    parking: '🅿️',
    road: '🛣️',
    water_source: '💧',
    electricity: '⚡',
    waste_disposal: '🗑️',
    recreation: '🎮',
    custom: '⚙️',
  };
  return iconMap[type] || '⚙️';
};

/**
 * Konva Module Renderer Component
 * Renders a single module with Konva components
 */
export const KonvaModuleRenderer: React.FC<KonvaModuleRendererProps> = ({
  module,
  props,
  shouldAnimate = false,
  isFocused = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const { x, y } = module.position;
  const { width, height } = module.size;
  const color = useMemo(() => getModuleColor(module.type), [module.type]);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const groupRef = useRef<Konva.Group>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const { stageRef, screenToCanvas } = useKonvaStage();
  const { currentTool, snapToGrid, getGridSize } = useEditorService();
  
  const rotation = module.rotation || 0;
  const baseOpacity = props.opacity ?? (module.visible ? 0.8 : 0.4);
  const opacity = isDragging ? baseOpacity * 0.5 : (isHovered ? Math.min(0.95, baseOpacity + 0.15) : baseOpacity);
  
  // Determine if module should be draggable
  const isDraggable = currentTool === 'select' && !module.locked && onDragStart && onDragMove && onDragEnd;

  const strokeColor = props.hasValidationErrors
    ? '#EF4444'
    : props.isSelected
      ? '#0EA5E9'
      : isHovered
        ? '#0EA5E9'
        : color;
  const strokeWidth = props.hasValidationErrors ? 3 : props.isSelected ? 2 : isHovered ? 2 : 1;

  const handleClick = () => {
    props.onSelect?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Handle drag start
  const handleDragStart = useCallback((_e: KonvaEventObject<DragEvent>) => {
    if (!isDraggable || !stageRef.current) return;

    _e.cancelBubble = true;
    setIsDragging(true);

    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Calculate drag offset (mouse position relative to module center in canvas coordinates)
    const canvasPos = screenToCanvas(pointer);
    dragOffsetRef.current = {
      x: canvasPos.x - x,
      y: canvasPos.y - y,
    };

    // Emit drag start event
    onDragStart?.(module.id, dragOffsetRef.current);
  }, [isDraggable, stageRef, screenToCanvas, x, y, module.id, onDragStart]);

  // Handle drag move (throttled with RAF)
  const handleDragMove = useCallback((_e: KonvaEventObject<DragEvent>) => {
    if (!isDraggable || !isDragging || !stageRef.current) return;

    // Cancel previous RAF if pending
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Schedule update with RAF
    rafRef.current = requestAnimationFrame(() => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const canvasPos = screenToCanvas(pointer);

      // Calculate new position using offset
      let newX = canvasPos.x - dragOffsetRef.current.x;
      let newY = canvasPos.y - dragOffsetRef.current.y;

      // Apply grid snapping if enabled
      if (snapToGrid) {
        const gridSize = getGridSize();
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      const newPosition: Position = { x: newX, y: newY };

      // Emit drag move event
      onDragMove?.(module.id, newPosition);
    });
  }, [isDraggable, isDragging, stageRef, screenToCanvas, snapToGrid, getGridSize, module.id, onDragMove]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    
    // Cancel any pending RAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Emit drag end event
    onDragEnd?.(module.id);
  }, [isDragging, module.id, onDragEnd]);

  // Animate module position when shouldAnimate is true
  useKonvaAnimation(
    groupRef,
    shouldAnimate ? { x, y, rotation } : {},
    {
      duration: 200,
      skipIfReducedMotion: true,
      skipIfOutsideViewport: true,
      stageRef,
    }
  );

  // Render shape based on module type
  const renderShape = useMemo(() => {
    switch (module.type) {
      case 'electricity':
      case 'waste_disposal':
        // Circle shape
        return (
          <Circle
            x={width / 2}
            y={height / 2}
            radius={Math.min(width, height) / 2}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            perfectDrawEnabled={false}
          />
        );

      case 'recreation':
        // Rounded rectangle
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            cornerRadius={8}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            perfectDrawEnabled={false}
          />
        );

      default:
        // Rectangle (default) - includes road, water_source, and all others
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            perfectDrawEnabled={false}
          />
        );
    }
  }, [module.type, width, height, color, strokeColor, strokeWidth, opacity]);

  // Render icon (emoji text)
  const renderIcon = useMemo(() => {
    const icon = getModuleIcon(module.type);
    const fontSize = Math.min(width, height) * 0.4;

    return (
      <Text
        x={width / 2}
        y={height / 2}
        text={icon}
        fontSize={fontSize}
        fill="white"
        opacity={0.9}
        listening={false}
        perfectDrawEnabled={false}
        align="center"
        verticalAlign="middle"
        offsetX={0}
        offsetY={fontSize / 2}
      />
    );
  }, [module.type, width, height]);

  // Render module name label
  const renderLabel = useMemo(() => {
    if (!module.metadata || !('name' in module.metadata)) {
      return null;
    }

    const labelText = String(module.metadata.name);
    const fontSize = 10;

    return (
      <Text
        x={width / 2}
        y={height + 12}
        text={labelText}
        fontSize={fontSize}
        fill="#374151"
        opacity={0.8}
        listening={false}
        perfectDrawEnabled={false}
        align="center"
        verticalAlign="top"
        offsetX={0}
        offsetY={0}
      />
    );
  }, [module.metadata, width, height]);

  // Render focus indicator
  const renderFocusIndicator = useMemo(() => {
    if (!isFocused) return null;

    return (
      <Rect
        x={-4}
        y={-4}
        width={width + 8}
        height={height + 8}
        stroke="#3B82F6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  }, [isFocused, width, height]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      offsetX={width / 2}
      offsetY={height / 2}
      draggable={!!isDraggable}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      listening={true}
      moduleId={module.id}
    >
      {renderShape}
      {renderIcon}
      {renderLabel}
      {renderFocusIndicator}
    </Group>
  );
};

