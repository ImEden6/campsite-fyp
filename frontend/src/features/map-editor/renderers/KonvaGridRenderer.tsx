/**
 * Konva Grid Renderer
 * Helper component for rendering grid with Konva
 */

import React, { useMemo } from 'react';
import { Group, Line } from 'react-konva';
import type { GridOptions } from '../core/renderer';

interface KonvaGridRendererProps {
  options: GridOptions;
  isDark?: boolean;
}

/**
 * Konva Grid Renderer Component
 * Renders grid lines with Konva components
 */
export const KonvaGridRenderer: React.FC<KonvaGridRendererProps> = React.memo(
  ({ options, isDark = false }) => {
    const { gridSize, width, height, color } = options;

    const gridColor = useMemo(
      () =>
        color ??
        (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)'),
      [color, isDark]
    );

    const verticalLines = useMemo(() => {
      const count = Math.ceil(width / gridSize);
      return Array.from({ length: count }, (_, i) => {
        const x = i * gridSize;
        return (
          <Line
            key={`grid-v-${i}`}
            points={[x, 0, x, height]}
            stroke={gridColor}
            strokeWidth={0.5}
            opacity={0.5}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      });
    }, [width, height, gridSize, gridColor]);

    const horizontalLines = useMemo(() => {
      const count = Math.ceil(height / gridSize);
      return Array.from({ length: count }, (_, i) => {
        const y = i * gridSize;
        return (
          <Line
            key={`grid-h-${i}`}
            points={[0, y, width, y]}
            stroke={gridColor}
            strokeWidth={0.5}
            opacity={0.5}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      });
    }, [width, height, gridSize, gridColor]);

    return (
      <Group listening={false} perfectDrawEnabled={false} cache={true}>
        {verticalLines}
        {horizontalLines}
      </Group>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if dimensions, grid size, or color changes
    return (
      prevProps.options.width === nextProps.options.width &&
      prevProps.options.height === nextProps.options.height &&
      prevProps.options.gridSize === nextProps.options.gridSize &&
      prevProps.options.color === nextProps.options.color &&
      prevProps.isDark === nextProps.isDark
    );
  }
);

KonvaGridRenderer.displayName = 'KonvaGridRenderer';

