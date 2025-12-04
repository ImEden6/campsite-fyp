/**
 * SVG Renderer
 * Implements IRenderer using native SVG elements
 */

import React from 'react';
import type { IRenderer, RenderProps, GridOptions } from '../core/renderer';
import type { AnyModule, Size } from '@/types';
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
    const { gridSize, color = '#e5e7eb' } = options;

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
        aria-label="Map background image"
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
            onResize={(newSize, newPosition) => onTransform({ 
              size: newSize,
              position: newPosition 
            })}
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
  onResize: (size: Size, position?: { x: number; y: number }) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
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
    { x: x - handleOffset, y: y - handleOffset, cursor: 'nwse-resize', corner: 'nw' },
    { x: x + width - handleOffset, y: y - handleOffset, cursor: 'nesw-resize', corner: 'ne' },
    { x: x - handleOffset, y: y + height - handleOffset, cursor: 'nesw-resize', corner: 'sw' },
    { x: x + width - handleOffset, y: y + height - handleOffset, cursor: 'nwse-resize', corner: 'se' },
  ];

  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    
    // Get SVG element for coordinate conversion
    const svgElement = e.currentTarget.ownerSVGElement;
    if (!svgElement) return;
    
    // Convert screen coordinates to SVG coordinates
    const convertToSVGCoords = (clientX: number, clientY: number) => {
      const point = svgElement.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const screenCTM = svgElement.getScreenCTM();
      if (!screenCTM) {
        // Fallback: assume no transform (1:1 mapping)
        const svgRect = svgElement.getBoundingClientRect();
        return {
          x: clientX - svgRect.left,
          y: clientY - svgRect.top,
        };
      }
      const svgPoint = point.matrixTransform(screenCTM.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    };
    
    const startPoint = convertToSVGCoords(e.clientX, e.clientY);
    const startWidth = width;
    const startHeight = height;
    const startXPos = x;
    const startYPos = y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPoint = convertToSVGCoords(moveEvent.clientX, moveEvent.clientY);
      const deltaX = currentPoint.x - startPoint.x;
      const deltaY = currentPoint.y - startPoint.y;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;
      
      // Calculate new size and position based on corner being dragged
      // The opposite corner stays fixed, so position changes accordingly
      switch (corner) {
        case 'nw': {
          // Southeast corner stays fixed, northwest corner moves
          newWidth = startWidth - deltaX;
          newHeight = startHeight - deltaY;
          // Position moves with the dragged corner
          newX = startXPos + deltaX;
          newY = startYPos + deltaY;
          break;
        }
        case 'ne': {
          // Southwest corner stays fixed, northeast corner moves
          newWidth = startWidth + deltaX;
          newHeight = startHeight - deltaY;
          // Only Y position changes (X stays same)
          newY = startYPos + deltaY;
          break;
        }
        case 'sw': {
          // Northeast corner stays fixed, southwest corner moves
          newWidth = startWidth - deltaX;
          newHeight = startHeight + deltaY;
          // Only X position changes (Y stays same)
          newX = startXPos + deltaX;
          break;
        }
        case 'se': {
          // Northwest corner stays fixed, southeast corner moves
          newWidth = startWidth + deltaX;
          newHeight = startHeight + deltaY;
          // Position doesn't change
          break;
        }
      }
      
      // Enforce minimum size
      const minSize = 20;
      const widthBeforeClamp = newWidth;
      const heightBeforeClamp = newHeight;
      newWidth = Math.max(minSize, newWidth);
      newHeight = Math.max(minSize, newHeight);
      
      // Adjust position if size was clamped to maintain opposite corner position
      if (widthBeforeClamp < minSize) {
        const widthDiff = newWidth - widthBeforeClamp;
        if (corner === 'nw' || corner === 'sw') {
          newX -= widthDiff;
        }
      }
      if (heightBeforeClamp < minSize) {
        const heightDiff = newHeight - heightBeforeClamp;
        if (corner === 'nw' || corner === 'ne') {
          newY -= heightDiff;
        }
      }
      
      // Only pass position if it changed
      const positionChanged = newX !== startXPos || newY !== startYPos;
      onResize(
        { width: newWidth, height: newHeight },
        positionChanged ? { x: newX, y: newY } : undefined
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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
          onMouseDown={(e) => handleMouseDown(e, handle.corner)}
        />
      ))}
    </>
  );
};

