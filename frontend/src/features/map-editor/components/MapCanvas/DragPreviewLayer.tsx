/**
 * DragPreviewLayer Component
 * Renders semi-transparent preview of modules being dragged
 */

import React from 'react';
import { Layer } from 'react-konva';
import type { AnyModule } from '@/types';
import { KonvaModuleRenderer } from '../../renderers/KonvaModuleRenderer';

interface DragPreviewLayerProps {
  draggedModules: Array<{
    module: AnyModule;
    offset: { x: number; y: number };
    currentPosition: { x: number; y: number };
  }>;
}

/**
 * DragPreviewLayer Component
 * Renders non-interactive preview of dragged modules
 */
export const DragPreviewLayer: React.FC<DragPreviewLayerProps> = ({ draggedModules }) => {
  if (draggedModules.length === 0) {
    return null;
  }

  return (
    <Layer listening={false}>
      {draggedModules.map(({ module, currentPosition }) => (
        <KonvaModuleRenderer
          key={`drag-${module.id}`}
          module={{
            ...module,
            position: currentPosition, // Use currentPosition directly for preview
          }}
          props={{
            opacity: 0.5,
            isSelected: false,
            hasValidationErrors: false,
          }}
          shouldAnimate={false}
          isFocused={false}
        />
      ))}
    </Layer>
  );
};

