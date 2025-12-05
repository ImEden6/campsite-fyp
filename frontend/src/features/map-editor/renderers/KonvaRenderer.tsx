/**
 * Konva Renderer
 * Implements IRenderer using Konva.js components
 */

import type { IRenderer, RenderProps, GridOptions } from '../core/renderer';
import type { AnyModule, Size, Position } from '@/types';
import { KonvaModuleRenderer } from './KonvaModuleRenderer';
import { KonvaGridRenderer } from './KonvaGridRenderer';
import { KonvaSelectionHandles } from './KonvaSelectionHandles';
import { KonvaBackgroundImage } from './KonvaBackgroundImage';

export class KonvaRenderer implements IRenderer {
  /**
   * Render a module
   */
  renderModule(module: AnyModule, props: RenderProps): React.ReactNode {
    return (
      <KonvaModuleRenderer
        key={module.id}
        module={module}
        props={props}
        shouldAnimate={props.shouldAnimate}
        isFocused={props.isFocused}
        onDragStart={props.onDragStart}
        onDragMove={props.onDragMove}
        onDragEnd={props.onDragEnd}
      />
    );
  }

  /**
   * Render grid
   */
  renderGrid(options: GridOptions): React.ReactNode {
    // Determine if dark mode (will be passed from parent component)
    const isDark =
      typeof window !== 'undefined' &&
      document.documentElement.classList.contains('dark');

    return (
      <KonvaGridRenderer key={`grid-${options.gridSize}-${options.width}-${options.height}`} options={options} isDark={isDark} />
    );
  }

  /**
   * Render background image
   */
  renderBackground(imageUrl: string, size: Size): React.ReactNode {
    return (
      <KonvaBackgroundImage
        key={imageUrl}
        imageUrl={imageUrl}
        width={size.width}
        height={size.height}
      />
    );
  }

  /**
   * Render selection handles
   */
  renderSelectionHandles(
    modules: AnyModule[],
    onTransform?: (transform: {
      position?: Position;
      size?: Size;
      rotation?: number;
    }) => void
  ): React.ReactNode {
    if (modules.length === 0) {
      return null;
    }

    return (
      <KonvaSelectionHandles
        key={`selection-${modules.map((m) => m.id).join('-')}`}
        modules={modules}
        onTransform={onTransform}
      />
    );
  }
}

