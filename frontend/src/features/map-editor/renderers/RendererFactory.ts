/**
 * Renderer Factory
 * Factory for creating renderer instances
 */

import type { IRenderer } from '../core/renderer';
import { SVGRenderer } from './SVGRenderer';

export type RendererType = 'svg';

/**
 * Create a renderer instance
 */
export function createRenderer(type: RendererType = 'svg'): IRenderer {
  switch (type) {
    case 'svg':
      return new SVGRenderer();
    default:
      throw new Error(`Unknown renderer type: ${type}`);
  }
}

