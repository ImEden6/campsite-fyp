/**
 * SVG Renderer
 * Implements IRenderer using native SVG elements
 */

import React from 'react';
import type { IRenderer, RenderProps, GridOptions } from '../core/renderer';
import type { AnyModule, ModuleType, Size } from '@/types';
import { ModuleShapes } from '../components/ModuleRenderer/ModuleShapes';

export class SVGRenderer implements IRenderer {
  renderModule(module: AnyModule, props: RenderProps): React.ReactNode {
    return (
      <ModuleShapes
        module={module}
        isSelected={props.isSelected}
        hasValidationErrors={props.hasValidationErrors}
        opacity={props.opacity ?? (module.visible ? 0.8 : 0.4)}
        onSelect={props.onSelect}
        onMove={props.onMove}
        onResize={props.onResize}
        onRotate={props.onRotate}
      />
    );
  }

  renderGrid(options: GridOptions): React.ReactNode {
    const { gridSize, width, height, color = '#e5e7eb' } = options;

    return (
      <defs>
        <pattern
          id="grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
    );
  }

  renderBackground(imageUrl: string, size: Size): React.ReactNode {
    return (
      <image
        href={imageUrl}
        x="0"
        y="0"
        width={size.width}
        height={size.height}
        preserveAspectRatio="none"
      />
    );
  }

  renderSelectionHandles(
    modules: AnyModule[],
    onTransform?: (transform: {
      position?: { x: number; y: number };
      size?: Size;
      rotation?: number;
    }) => void
  ): React.ReactNode {
    if (modules.length === 0) {
      return null;
    }

    // Calculate bounding box
    const bounds = modules.reduce(
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

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    return (
      <g className="selection-handles">
        {/* Selection rectangle */}
        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={width}
          height={height}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="2"
          strokeDasharray="4 4"
          pointerEvents="none"
        />
        {/* Resize handles (if single module) */}
        {modules.length === 1 && onTransform && (
          <SelectionHandles
            x={bounds.minX}
            y={bounds.minY}
            width={width}
            height={height}
            onResize={(newSize) => onTransform({ size: newSize })}
          />
        )}
      </g>
    );
  }
}

// Simple selection handles component
interface SelectionHandlesProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onResize: (size: Size) => void;
}

const SelectionHandles: React.FC<SelectionHandlesProps> = ({
  x,
  y,
  width,
  height,
  onResize,
}) => {
  const handleSize = 8;
  const handleOffset = handleSize / 2;

  const handles = [
    { x: x - handleOffset, y: y - handleOffset, cursor: 'nwse-resize' },
    { x: x + width - handleOffset, y: y - handleOffset, cursor: 'nesw-resize' },
    { x: x - handleOffset, y: y + height - handleOffset, cursor: 'nesw-resize' },
    { x: x + width - handleOffset, y: y + height - handleOffset, cursor: 'nwse-resize' },
  ];

  return (
    <>
      {handles.map((handle, index) => (
        <rect
          key={index}
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={handleSize}
          fill="#0EA5E9"
          stroke="#fff"
          strokeWidth="1"
          cursor={handle.cursor}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Handle resize logic here
          }}
        />
      ))}
    </>
  );
};

