/**
 * Background Layer
 * Renders the map background image using Konva
 */

import React from 'react';
import { Layer } from 'react-konva';
import { useMapEditor } from '../../hooks/useMapEditor';
import type { Size } from '@/types';

interface BackgroundLayerProps {
  imageUrl: string;
  size: Size;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  imageUrl,
  size,
}) => {
  const { renderer } = useMapEditor();

  return (
    <Layer listening={false} perfectDrawEnabled={false}>
      {renderer.renderBackground(imageUrl, size)}
    </Layer>
  );
};

