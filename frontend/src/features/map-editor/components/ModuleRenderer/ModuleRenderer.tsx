/**
 * Module Renderer
 * Renders a single module using SVG
 * This is a wrapper that uses ModuleShapes
 */

import React from 'react';
import { ModuleShapes } from './ModuleShapes';
import type { AnyModule, Position, Size } from '@/types';

interface ModuleRendererProps {
  module: AnyModule;
  isSelected?: boolean;
  hasValidationErrors?: boolean;
  onSelect?: () => void;
  onMove?: (position: Position) => void;
  onResize?: (size: Size) => void;
  onRotate?: (rotation: number) => void;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = (props) => {
  return <ModuleShapes {...props} />;
};

