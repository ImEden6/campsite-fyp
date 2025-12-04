/**
 * Editor Service
 * Implements IEditorService for editor state management
 */

import { create } from 'zustand';
import type { IEditorService, ToolType } from '../core/services';
import type { ModuleType } from '@/types';
import { EventBus } from '../infrastructure/EventBus';
import type { EventBus as IEventBus } from '../infrastructure/EventBus';

interface EditorState {
  selectedModuleIds: string[];
  currentTool: ToolType;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  layerVisibility: Record<ModuleType, boolean>;
}

const defaultState: EditorState = {
  selectedModuleIds: [],
  currentTool: 'select',
  showGrid: true,
  gridSize: 20,
  snapToGrid: true,
  showRulers: true,
  layerVisibility: {
    campsite: true,
    toilet: true,
    storage: true,
    building: true,
    parking: true,
    road: true,
    water_source: true,
    electricity: true,
    waste_disposal: true,
    recreation: true,
    custom: true,
  },
};

export class EditorService implements IEditorService {
  private store = create<EditorState>(() => defaultState);
  private eventBus: IEventBus;

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;

    // Listen to module:select events
    this.eventBus.on('module:select', (payload) => {
      const current = this.getSelection();
      if (payload.multiSelect) {
        // Add to selection if not already selected, remove if selected
        if (current.includes(payload.moduleId)) {
          this.removeFromSelection([payload.moduleId]);
        } else {
          this.addToSelection([payload.moduleId]);
        }
      } else {
        // Single select - replace selection
        this.selectModules([payload.moduleId]);
      }
    });

    // Listen to selection:clear events
    this.eventBus.on('selection:clear', () => {
      // Only clear if there's actually a selection to avoid circular calls
      const current = this.getSelection();
      if (current.length > 0) {
        // Update state directly without emitting event to avoid circular dependency
        this.store.setState({ selectedModuleIds: [] });
        this.eventBus.emit('selection:change', { selectedModuleIds: [] });
      }
    });
  }

  getSelection(): string[] {
    return this.store.getState().selectedModuleIds;
  }

  selectModules(moduleIds: string[]): void {
    this.store.setState({ selectedModuleIds: moduleIds });
    this.eventBus.emit('selection:change', { selectedModuleIds: moduleIds });
  }

  addToSelection(moduleIds: string[]): void {
    const current = this.getSelection();
    const newSelection = [...new Set([...current, ...moduleIds])];
    this.selectModules(newSelection);
  }

  removeFromSelection(moduleIds: string[]): void {
    const current = this.getSelection();
    const newSelection = current.filter((id) => !moduleIds.includes(id));
    this.selectModules(newSelection);
  }

  clearSelection(): void {
    this.store.setState({ selectedModuleIds: [] });
    this.eventBus.emit('selection:clear', {});
  }

  getCurrentTool(): ToolType {
    return this.store.getState().currentTool;
  }

  setTool(tool: ToolType): void {
    this.store.setState({ currentTool: tool });
    this.eventBus.emit('tool:change', { tool });
  }

  isGridVisible(): boolean {
    return this.store.getState().showGrid;
  }

  toggleGrid(): void {
    const newValue = !this.isGridVisible();
    this.store.setState({ showGrid: newValue });
    this.eventBus.emit('grid:toggle', { enabled: newValue });
  }

  getGridSize(): number {
    return this.store.getState().gridSize;
  }

  setGridSize(size: number): void {
    this.store.setState({ gridSize: size });
  }

  isSnapToGrid(): boolean {
    return this.store.getState().snapToGrid;
  }

  toggleSnapToGrid(): void {
    const newValue = !this.isSnapToGrid();
    this.store.setState({ snapToGrid: newValue });
    this.eventBus.emit('snap-to-grid:toggle', { enabled: newValue });
  }

  areRulersVisible(): boolean {
    return this.store.getState().showRulers;
  }

  toggleRulers(): void {
    const newValue = !this.areRulersVisible();
    this.store.setState({ showRulers: newValue });
    this.eventBus.emit('ruler:toggle', { enabled: newValue });
  }

  isLayerVisible(layer: ModuleType): boolean {
    return this.store.getState().layerVisibility[layer] ?? true;
  }

  toggleLayerVisibility(layer: ModuleType): void {
    const current = this.store.getState().layerVisibility;
    const newVisibility = {
      ...current,
      [layer]: !current[layer],
    };
    this.store.setState({ layerVisibility: newVisibility });
  }

  // Internal method to subscribe to state changes
  subscribe(callback: (state: EditorState) => void): () => void {
    return this.store.subscribe(callback);
  }

  // Internal method to get current state
  getState(): EditorState {
    return this.store.getState();
  }
}

