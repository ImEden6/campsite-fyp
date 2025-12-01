/**
 * History Manager
 * Manages undo/redo functionality for map editor
 */

import type { CampsiteMap } from '@/types';

export type HistoryActionType =
  | 'module_add'
  | 'module_delete'
  | 'module_move'
  | 'module_resize'
  | 'module_rotate'
  | 'module_update'
  | 'bulk_operation';

export interface HistoryAction {
  type: HistoryActionType;
  moduleIds?: string[];
  moduleId?: string;
  count?: number;
  description?: string;
}

export interface HistoryState {
  mapState: CampsiteMap;
  timestamp: number;
  action: HistoryAction;
}

export interface HistoryManagerConfig {
  maxHistorySize?: number;
}

/**
 * HistoryManager class for managing undo/redo operations
 */
export class HistoryManager {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private maxHistorySize: number;

  constructor(config: HistoryManagerConfig = {}) {
    this.maxHistorySize = config.maxHistorySize || 50;
  }

  /**
   * Push a new state to the history
   */
  pushState(mapState: CampsiteMap, action: HistoryAction): void {
    // Clone the state to prevent mutations
    const clonedState = this.cloneState(mapState);

    const historyState: HistoryState = {
      mapState: clonedState,
      timestamp: Date.now(),
      action,
    };

    // Add to undo stack
    this.undoStack.push(historyState);

    // Limit stack size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  /**
   * Undo the last action
   */
  undo(): CampsiteMap | null {
    if (!this.canUndo()) {
      return null;
    }

    const currentState = this.undoStack.pop()!;
    this.redoStack.push(currentState);

    // Return the previous state (now at the top of undo stack)
    const lastState = this.undoStack[this.undoStack.length - 1];
    if (lastState) {
      return this.cloneState(lastState.mapState);
    }

    // If no more states in undo stack, return null
    return null;
  }

  /**
   * Redo the last undone action
   */
  redo(): CampsiteMap | null {
    if (!this.canRedo()) {
      return null;
    }

    const stateToRestore = this.redoStack.pop()!;
    this.undoStack.push(stateToRestore);

    return this.cloneState(stateToRestore.mapState);
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 1; // Need at least 2 states (current + previous)
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get the current undo stack size
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * Get the current redo stack size
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Get the last action in the undo stack
   */
  getLastAction(): HistoryAction | null {
    const lastState = this.undoStack[this.undoStack.length - 1];
    return lastState ? lastState.action : null;
  }

  /**
   * Get the next action in the redo stack
   */
  getNextAction(): HistoryAction | null {
    const nextState = this.redoStack[this.redoStack.length - 1];
    return nextState ? nextState.action : null;
  }

  /**
   * Clone a map state using structuredClone
   */
  private cloneState(mapState: CampsiteMap): CampsiteMap {
    try {
      // Use structuredClone for deep cloning
      return structuredClone(mapState);
    } catch (error) {
      // Fallback to JSON clone if structuredClone fails
      console.warn('structuredClone failed, falling back to JSON clone:', error);
      return JSON.parse(JSON.stringify(mapState));
    }
  }

  /**
   * Get a snapshot of the current history state (for debugging)
   */
  getSnapshot(): {
    undoStackSize: number;
    redoStackSize: number;
    lastAction: HistoryAction | null;
    nextAction: HistoryAction | null;
  } {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      lastAction: this.getLastAction(),
      nextAction: this.getNextAction(),
    };
  }
}

/**
 * Create a new HistoryManager instance
 */
export function createHistoryManager(config?: HistoryManagerConfig): HistoryManager {
  return new HistoryManager(config);
}
