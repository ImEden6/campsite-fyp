/**
 * Grid Layer
 * Renders the grid pattern
 */

import React from 'react';
import { useMapEditor } from '../../hooks/useMapEditor';
import { useEditorService } from '../../hooks/useEditorService';
import type { Size } from '@/types';

interface GridLayerProps {
  size: Size;
}

export const GridLayer: React.FC<GridLayerProps> = ({ size }) => {
  const { renderer } = useMapEditor();
  const { showGrid, gridSize } = useEditorService();

  if (!showGrid) {
    return null;
  }

  return (
    <g className="grid-layer">
      {renderer.renderGrid({
        gridSize,
        width: size.width,
        height: size.height,
      })}
      <rect
        width={size.width}
        height={size.height}
        fill="url(#grid-pattern)"
        pointerEvents="none"
      />
    </g>
  );
};

