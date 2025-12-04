/**
 * Module Shapes
 * SVG components for rendering different module types
 */

import React from 'react';
import type { AnyModule, ModuleType, Position, Size } from '@/types';

interface ModuleShapesProps {
  module: AnyModule;
  isSelected?: boolean;
  hasValidationErrors?: boolean;
  opacity?: number;
  onSelect?: (e?: React.MouseEvent) => void;
  onMove?: (position: Position) => void;
  onResize?: (size: Size) => void;
  onRotate?: (rotation: number) => void;
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

export const ModuleShapes: React.FC<ModuleShapesProps> = ({
  module,
  isSelected = false,
  hasValidationErrors = false,
  opacity = 0.8,
  onSelect,
}) => {
  const { x, y } = module.position;
  const { width, height } = module.size;
  const color = getModuleColor(module.type);
  const rotation = module.rotation || 0;

  // Build transform string
  const transform = `translate(${x}, ${y}) rotate(${rotation} ${width / 2} ${height / 2})`;

  const strokeColor = hasValidationErrors
    ? '#EF4444'
    : isSelected
      ? '#0EA5E9'
      : color;
  const strokeWidth = hasValidationErrors ? 3 : isSelected ? 2 : 1;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(e);
  };

  const renderShape = () => {
    switch (module.type) {
      case 'water_source':
      case 'electricity':
      case 'waste_disposal':
        // Circle shape
        return (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={Math.min(width, height) / 2}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );

      case 'recreation':
        // Rounded rectangle
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={8}
            ry={8}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );

      case 'road':
        // Rounded rectangle (path-like)
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={height / 4}
            ry={height / 4}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );

      default:
        // Rectangle (default)
        return (
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
          />
        );
    }
  };

  const renderIcon = () => {
    // Simple text icon for now - can be replaced with SVG icons later
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

    return (
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.min(width, height) * 0.4}
        fill="white"
        opacity={0.9}
        pointerEvents="none"
      >
        {iconMap[module.type] || '⚙️'}
      </text>
    );
  };

  return (
    <g
      transform={transform}
      onClick={handleClick}
      className={`module module-${module.type} cursor-pointer`}
      data-module-id={module.id}
    >
      {renderShape()}
      {renderIcon()}
      {module.metadata && 'name' in module.metadata && (
        <text
          x={width / 2}
          y={height + 12}
          textAnchor="middle"
          fontSize="10"
          fill="#374151"
          opacity={0.8}
          pointerEvents="none"
        >
          {String(module.metadata.name)}
        </text>
      )}
    </g>
  );
};

