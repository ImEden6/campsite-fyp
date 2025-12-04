/**
 * Map Editor Event Types
 * Type-safe event definitions for the map editor system
 */

import type { AnyModule, Position, Size, ModuleType, CampsiteMap } from '@/types';

// ============================================================================
// EVENT TYPE DEFINITIONS
// ============================================================================

/**
 * Module-related events
 */
export interface ModuleSelectEvent {
  moduleId: string;
  multiSelect: boolean;
}

export interface ModuleMoveEvent {
  moduleId: string;
  position: Position;
}

export interface ModuleResizeEvent {
  moduleId: string;
  size: Size;
}

export interface ModuleRotateEvent {
  moduleId: string;
  rotation: number;
}

export interface ModuleAddEvent {
  module: AnyModule;
  mapId: string;
}

export interface ModuleDeleteEvent {
  moduleIds: string[];
  mapId: string;
}

export interface ModuleUpdateEvent {
  moduleId: string;
  updates: Partial<AnyModule>;
  mapId: string;
}

/**
 * Selection events
 */
export interface SelectionChangeEvent {
  selectedModuleIds: string[];
}

export interface SelectionClearEvent {
  // No additional data needed
}

/**
 * Tool events
 */
export type ToolType = 'select' | 'move' | 'rotate' | 'scale' | 'draw' | 'measure';

export interface ToolChangeEvent {
  tool: ToolType;
}

/**
 * Viewport events
 */
export interface ViewportChangeEvent {
  zoom: number;
  position: Position;
}

/**
 * History events
 */
export interface HistoryUndoEvent {
  // No additional data needed
}

export interface HistoryRedoEvent {
  // No additional data needed
}

/**
 * UI preference events
 */
export interface GridToggleEvent {
  enabled: boolean;
}

export interface RulerToggleEvent {
  enabled: boolean;
}

export interface SnapToGridToggleEvent {
  enabled: boolean;
}

/**
 * Map events
 */
export interface MapLoadEvent {
  mapId: string;
  map: CampsiteMap;
}

export interface MapSaveEvent {
  mapId: string;
  success: boolean;
}

/**
 * Validation events
 */
export interface ModuleValidationEvent {
  moduleId: string;
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// EVENT MAP TYPE
// ============================================================================

/**
 * Map of all event types to their payload types
 */
export interface MapEditorEvents {
  'module:select': ModuleSelectEvent;
  'module:move': ModuleMoveEvent;
  'module:resize': ModuleResizeEvent;
  'module:rotate': ModuleRotateEvent;
  'module:add': ModuleAddEvent;
  'module:delete': ModuleDeleteEvent;
  'module:update': ModuleUpdateEvent;
  'selection:change': SelectionChangeEvent;
  'selection:clear': SelectionClearEvent;
  'tool:change': ToolChangeEvent;
  'viewport:change': ViewportChangeEvent;
  'history:undo': HistoryUndoEvent;
  'history:redo': HistoryRedoEvent;
  'grid:toggle': GridToggleEvent;
  'ruler:toggle': RulerToggleEvent;
  'snap-to-grid:toggle': SnapToGridToggleEvent;
  'map:load': MapLoadEvent;
  'map:save': MapSaveEvent;
  'module:validation': ModuleValidationEvent;
}

/**
 * Event name type
 */
export type MapEditorEventName = keyof MapEditorEvents;

/**
 * Event handler type
 */
export type MapEditorEventHandler<T extends MapEditorEventName> = (
  payload: MapEditorEvents[T]
) => void;

/**
 * Generic event handler
 */
export type EventHandler = (payload: unknown) => void;

