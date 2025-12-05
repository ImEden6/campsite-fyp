/**
 * Renderer Factory
 * Factory for creating renderer instances
 */

import type { IRenderer } from '../core/renderer';
import { SVGRenderer } from './SVGRenderer';
import { KonvaRenderer } from './KonvaRenderer';

export type RendererType = 'svg' | 'konva';

/**
 * Create a renderer instance
 */
export function createRenderer(type: RendererType = 'svg'): IRenderer {
  switch (type) {
    case 'svg':
      return new SVGRenderer();
    case 'konva':
      return new KonvaRenderer();
    default:
      throw new Error(`Unknown renderer type: ${type}`);
  }
}

