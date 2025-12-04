/**
 * Viewport Service
 * Manages viewport state (zoom, position) and viewport operations
 */

import type { Position } from '@/types';
import type { EventBus } from '../infrastructure/EventBus';
import type {
  ViewportChangeEvent,
} from '../core/events';
import { EDITOR_CONSTANTS } from '@/constants/editorConstants';

export interface ViewportState {
  zoom: number;
  position: Position;
}

export interface ViewportBounds {
  width: number;
  height: number;
}

export interface IViewportService {
  /**
   * Get current viewport state
   */
  getViewport(): ViewportState;

  /**
   * Set viewport state
   */
  setViewport(viewport: Partial<ViewportState>): void;

  /**
   * Zoom in
   */
  zoomIn(): void;

  /**
   * Zoom out
   */
  zoomOut(): void;

  /**
   * Fit map to screen
   */
  fitToScreen(mapSize: ViewportBounds, containerSize: ViewportBounds): void;

  /**
   * Zoom to selection
   */
  zoomToSelection(
    selectionBounds: { minX: number; minY: number; maxX: number; maxY: number },
    containerSize: ViewportBounds
  ): void;

  /**
   * Reset viewport to default
   */
  reset(): void;
}

export class ViewportService implements IViewportService {
  private viewport: ViewportState = {
    zoom: EDITOR_CONSTANTS.DEFAULT_ZOOM,
    position: { x: 0, y: 0 },
  };

  constructor(private eventBus: EventBus) {}

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  setViewport(viewport: Partial<ViewportState>): void {
    const newViewport: ViewportState = {
      zoom: viewport.zoom ?? this.viewport.zoom,
      position: viewport.position ?? { ...this.viewport.position },
    };

    // Clamp zoom
    newViewport.zoom = Math.max(
      EDITOR_CONSTANTS.MIN_ZOOM,
      Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newViewport.zoom)
    );

    this.viewport = newViewport;
    this.emitChange();
  }

  zoomIn(): void {
    const newZoom = Math.min(
      EDITOR_CONSTANTS.MAX_ZOOM,
      this.viewport.zoom * EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR
    );
    this.setViewport({ zoom: newZoom });
    this.eventBus.emit('viewport:zoom-in', {});
  }

  zoomOut(): void {
    const newZoom = Math.max(
      EDITOR_CONSTANTS.MIN_ZOOM,
      this.viewport.zoom / EDITOR_CONSTANTS.ZOOM_SCALE_FACTOR
    );
    this.setViewport({ zoom: newZoom });
    this.eventBus.emit('viewport:zoom-out', {});
  }

  fitToScreen(mapSize: ViewportBounds, containerSize: ViewportBounds): void {
    const scaleX = containerSize.width / mapSize.width;
    const scaleY = containerSize.height / mapSize.height;
    const newZoom = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

    const clampedZoom = Math.max(
      EDITOR_CONSTANTS.MIN_ZOOM,
      Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newZoom)
    );

    const newPosition: Position = {
      x: (containerSize.width - mapSize.width * clampedZoom) / 2,
      y: (containerSize.height - mapSize.height * clampedZoom) / 2,
    };

    this.setViewport({ zoom: clampedZoom, position: newPosition });
    this.eventBus.emit('viewport:fit-to-screen', {});
  }

  zoomToSelection(
    selectionBounds: { minX: number; minY: number; maxX: number; maxY: number },
    containerSize: ViewportBounds
  ): void {
    const selectionWidth = selectionBounds.maxX - selectionBounds.minX;
    const selectionHeight = selectionBounds.maxY - selectionBounds.minY;

    if (selectionWidth === 0 || selectionHeight === 0) {
      return;
    }

    const scaleX = containerSize.width / selectionWidth;
    const scaleY = containerSize.height / selectionHeight;
    const newZoom = Math.min(scaleX, scaleY) * 0.8; // 80% to add padding

    const clampedZoom = Math.max(
      EDITOR_CONSTANTS.MIN_ZOOM,
      Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newZoom)
    );

    // Center the selection
    const centerX = (selectionBounds.minX + selectionBounds.maxX) / 2;
    const centerY = (selectionBounds.minY + selectionBounds.maxY) / 2;

    const newPosition: Position = {
      x: containerSize.width / 2 - centerX * clampedZoom,
      y: containerSize.height / 2 - centerY * clampedZoom,
    };

    this.setViewport({ zoom: clampedZoom, position: newPosition });
    this.eventBus.emit('viewport:zoom-to-selection', {});
  }

  reset(): void {
    this.setViewport({
      zoom: EDITOR_CONSTANTS.DEFAULT_ZOOM,
      position: { x: 0, y: 0 },
    });
    this.eventBus.emit('viewport:reset', {});
  }

  private emitChange(): void {
    const event: ViewportChangeEvent = {
      zoom: this.viewport.zoom,
      position: this.viewport.position,
    };
    this.eventBus.emit('viewport:change', event);
  }
}

