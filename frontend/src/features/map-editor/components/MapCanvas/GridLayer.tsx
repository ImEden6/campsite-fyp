/**
 * Grid Layer
 * Renders the grid pattern using Konva
 */

import React from 'react';
import { Layer } from 'react-konva';
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
    <Layer listening={false} perfectDrawEnabled={false}>
      {renderer.renderGrid({
        gridSize,
        width: size.width,
        height: size.height,
      })}
    </Layer>
  );
};

