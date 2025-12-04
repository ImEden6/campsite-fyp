/**
 * Service Interfaces
 * Contracts for map editor services
 */

import type { CampsiteMap, AnyModule, Position, Size, ModuleType } from '@/types';
import type { ValidationResult } from '@/utils/validationUtils';
import type { ReactNode } from 'react';

// ============================================================================
// MAP SERVICE INTERFACE
// ============================================================================

export interface IMapService {
  /**
   * Get a map by ID
   */
  getMap(id: string): CampsiteMap | null;

  /**
   * Get all maps
   */
  getAllMaps(): CampsiteMap[];

  /**
   * Update map metadata
   */
  updateMap(id: string, updates: Partial<CampsiteMap>): Promise<void>;

  /**
   * Add a module to a map
   */
  addModule(mapId: string, module: AnyModule): Promise<void>;

  /**
   * Update a module
   */
  updateModule(mapId: string, module: AnyModule): Promise<void>;

  /**
   * Remove a module from a map
   */
  removeModule(mapId: string, moduleId: string): Promise<void>;

  /**
   * Get modules for a map
   */
  getModules(mapId: string): AnyModule[];

  /**
   * Get a module by ID
   */
  getModule(mapId: string, moduleId: string): AnyModule | null;
}

// ============================================================================
// EDITOR SERVICE INTERFACE
// ============================================================================

export type ToolType = 'select' | 'move' | 'rotate' | 'scale' | 'draw' | 'measure';

export interface IEditorService {
  /**
   * Get currently selected module IDs
   */
  getSelection(): string[];

  /**
   * Select modules
   */
  selectModules(moduleIds: string[]): void;

  /**
   * Add modules to selection
   */
  addToSelection(moduleIds: string[]): void;

  /**
   * Remove modules from selection
   */
  removeFromSelection(moduleIds: string[]): void;

  /**
   * Clear selection
   */
  clearSelection(): void;

  /**
   * Get current tool
   */
  getCurrentTool(): ToolType;

  /**
   * Set current tool
   */
  setTool(tool: ToolType): void;

  /**
   * Get grid visibility
   */
  isGridVisible(): boolean;

  /**
   * Toggle grid visibility
   */
  toggleGrid(): void;

  /**
   * Get grid size
   */
  getGridSize(): number;

  /**
   * Set grid size
   */
  setGridSize(size: number): void;

  /**
   * Get snap to grid setting
   */
  isSnapToGrid(): boolean;

  /**
   * Toggle snap to grid
   */
  toggleSnapToGrid(): void;

  /**
   * Get rulers visibility
   */
  areRulersVisible(): boolean;

  /**
   * Toggle rulers visibility
   */
  toggleRulers(): void;

  /**
   * Get layer visibility
   */
  isLayerVisible(layer: ModuleType): boolean;

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layer: ModuleType): void;

  /**
   * Get current state (internal method for reactive hooks)
   */
  getState(): {
    selectedModuleIds: string[];
    currentTool: ToolType;
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
    showRulers: boolean;
    layerVisibility: Record<ModuleType, boolean>;
  };

  /**
   * Subscribe to state changes (internal method for reactive hooks)
   */
  subscribe(callback: (state: {
    selectedModuleIds: string[];
    currentTool: ToolType;
    showGrid: boolean;
    gridSize: number;
    snapToGrid: boolean;
    showRulers: boolean;
    layerVisibility: Record<ModuleType, boolean>;
  }) => void): () => void;
}

// ============================================================================
// HISTORY SERVICE INTERFACE
// ============================================================================

export interface IHistoryService {
  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Undo last command
   */
  undo(): Promise<void>;

  /**
   * Redo last undone command
   */
  redo(): Promise<void>;

  /**
   * Clear history
   */
  clearHistory(): void;

  /**
   * Get undo stack size
   */
  getUndoStackSize(): number;

  /**
   * Get redo stack size
   */
  getRedoStackSize(): number;

  /**
   * Get last command description
   */
  getLastCommandDescription(): string | null;

  /**
   * Get next command description (for redo)
   */
  getNextCommandDescription(): string | null;
}

// ============================================================================
// VALIDATION SERVICE INTERFACE
// ============================================================================

export interface IValidationService {
  /**
   * Validate a module
   */
  validateModule(module: AnyModule, mapBounds?: CampsiteMap['bounds']): ValidationResult;

  /**
   * Validate module position
   */
  validatePosition(position: Position, size: Size, bounds?: CampsiteMap['bounds']): ValidationResult;

  /**
   * Validate module size
   */
  validateSize(size: Size): ValidationResult;

  /**
   * Validate module rotation
   */
  validateRotation(rotation: number): ValidationResult;

  /**
   * Validate module property value
   */
  validatePropertyValue(
    property: string,
    value: unknown,
    moduleType: ModuleType
  ): ValidationResult;

  /**
   * Clamp position to boundaries
   */
  clampToBoundaries(
    position: Position,
    size: Size,
    bounds: CampsiteMap['bounds']
  ): Position;

  /**
   * Enforce minimum size
   */
  enforceMinimumSize(size: Size): Size;
}

// ============================================================================
// RENDERER INTERFACE
// ============================================================================

export interface RenderProps {
  isSelected?: boolean;
  hasValidationErrors?: boolean;
  opacity?: number;
  onSelect?: () => void;
  onMove?: (position: Position) => void;
  onResize?: (size: Size) => void;
  onRotate?: (rotation: number) => void;
}

export interface GridOptions {
  gridSize: number;
  width: number;
  height: number;
  color?: string;
}

export interface IRenderer {
  /**
   * Render a module
   */
  renderModule(module: AnyModule, props: RenderProps): ReactNode;

  /**
   * Render grid
   */
  renderGrid(options: GridOptions): ReactNode;

  /**
   * Render background image
   */
  renderBackground(imageUrl: string, size: Size): ReactNode;

  /**
   * Render selection handles
   */
  renderSelectionHandles(
    modules: AnyModule[],
    onTransform?: (transform: { position?: Position; size?: Size; rotation?: number }) => void
  ): ReactNode;
}

