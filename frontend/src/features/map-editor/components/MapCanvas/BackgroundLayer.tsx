/**
 * Background Layer
 * Renders the map background image
 */

import React from 'react';
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
    <g className="background-layer">
      {renderer.renderBackground(imageUrl, size)}
    </g>
  );
};

