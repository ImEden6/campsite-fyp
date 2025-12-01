/**
 * Map Grid Component
 * Cached grid rendering for better performance
 */

import React, { useMemo } from 'react';
import { Group, Rect } from 'react-konva';

interface MapGridProps {
  width: number;
  height: number;
  gridSize: number;
  isDark: boolean;
}

/**
 * Memoized grid component that only re-renders when dimensions or grid size changes
 */
export const MapGrid: React.FC<MapGridProps> = React.memo(({ width, height, gridSize, isDark }) => {
  const gridColor = useMemo(() => 
    isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)',
    [isDark]
  );

  const verticalLines = useMemo(() => {
    const count = Math.ceil(width / gridSize);
    return Array.from({ length: count }, (_, i) => (
      <Rect
        key={`grid-v-${i}`}
        x={i * gridSize}
        y={0}
        width={1.5}
        height={height}
        fill={gridColor}
        listening={false}
        perfectDrawEnabled={false}
      />
    ));
  }, [width, height, gridSize, gridColor]);

  const horizontalLines = useMemo(() => {
    const count = Math.ceil(height / gridSize);
    return Array.from({ length: count }, (_, i) => (
      <Rect
        key={`grid-h-${i}`}
        x={0}
        y={i * gridSize}
        width={width}
        height={1.5}
        fill={gridColor}
        listening={false}
        perfectDrawEnabled={false}
      />
    ));
  }, [width, height, gridSize, gridColor]);

  return (
    <Group
      listening={false}
      perfectDrawEnabled={false}
      // Enable caching for static grid
      cache={true}
    >
      {verticalLines}
      {horizontalLines}
    </Group>
  );
}, (prevProps, nextProps) => {
  // Only re-render if dimensions or grid size changes
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.gridSize === nextProps.gridSize &&
    prevProps.isDark === nextProps.isDark
  );
});

MapGrid.displayName = 'MapGrid';

