/**
 * Unit tests for HistoryManager
 * Tests push, undo, redo operations and history limits
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HistoryManager, createHistoryManager, type HistoryAction } from '../historyManager';
import type { CampsiteMap, AnyModule } from '@/types';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  let mockMap: CampsiteMap;

  beforeEach(() => {
    historyManager = new HistoryManager({ maxHistorySize: 5 });
    
    mockMap = {
      id: 'map-1',
      name: 'Test Map',
      description: 'Test Description',
      imageUrl: '/test.jpg',
      imageSize: { width: 1000, height: 800 },
      scale: 1,
      bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 800 },
      modules: [],
      metadata: {
        address: '123 Test St',
        coordinates: { latitude: 0, longitude: 0 },
        timezone: 'UTC',
        capacity: 100,
        amenities: [],
        rules: [],
        emergencyContacts: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('pushState', () => {
    it('should push a new state to the undo stack', () => {
      const action: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      historyManager.pushState(mockMap, action);

      expect(historyManager.getUndoStackSize()).toBe(1);
      expect(historyManager.getLastAction()).toEqual(action);
    });

    it('should clear redo stack when new state is pushed', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_delete', moduleId: 'module-1' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      
      expect(historyManager.getRedoStackSize()).toBe(1);
      
      const action3: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      historyManager.pushState(mockMap, action3);
      
      expect(historyManager.getRedoStackSize()).toBe(0);
    });

    it('should limit stack size to maxHistorySize', () => {
      for (let i = 0; i < 10; i++) {
        const action: HistoryAction = { type: 'module_add', moduleId: `module-${i}` };
        historyManager.pushState(mockMap, action);
      }

      expect(historyManager.getUndoStackSize()).toBe(5);
    });

    it('should clone the state to prevent mutations', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_update', moduleId: 'module-1' };
      
      historyManager.pushState(mockMap, action1);
      
      const modifiedMap = { ...mockMap, name: 'Modified Name' };
      historyManager.pushState(modifiedMap, action2);
      
      const undoneState = historyManager.undo();
      expect(undoneState).not.toBeNull();
      expect(undoneState?.name).toBe('Test Map');
    });
  });

  describe('undo', () => {
    it('should return null when undo stack is empty', () => {
      const result = historyManager.undo();
      expect(result).toBeNull();
    });

    it('should return null when only one state exists', () => {
      const action: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      historyManager.pushState(mockMap, action);
      
      const result = historyManager.undo();
      expect(result).toBeNull();
    });

    it('should return previous state and move current to redo stack', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      
      const modifiedMap = { ...mockMap, name: 'Modified Map' };
      historyManager.pushState(modifiedMap, action2);
      
      const result = historyManager.undo();
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Map');
      expect(historyManager.getRedoStackSize()).toBe(1);
      expect(historyManager.getUndoStackSize()).toBe(1);
    });

    it('should handle multiple undo operations', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      const action3: HistoryAction = { type: 'module_add', moduleId: 'module-3' };
      
      historyManager.pushState({ ...mockMap, name: 'State 1' }, action1);
      historyManager.pushState({ ...mockMap, name: 'State 2' }, action2);
      historyManager.pushState({ ...mockMap, name: 'State 3' }, action3);
      
      historyManager.undo();
      const result = historyManager.undo();
      
      expect(result?.name).toBe('State 1');
      expect(historyManager.getRedoStackSize()).toBe(2);
    });
  });

  describe('redo', () => {
    it('should return null when redo stack is empty', () => {
      const result = historyManager.redo();
      expect(result).toBeNull();
    });

    it('should restore state from redo stack', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      
      historyManager.pushState({ ...mockMap, name: 'State 1' }, action1);
      historyManager.pushState({ ...mockMap, name: 'State 2' }, action2);
      
      historyManager.undo();
      const result = historyManager.redo();
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('State 2');
      expect(historyManager.getRedoStackSize()).toBe(0);
      expect(historyManager.getUndoStackSize()).toBe(2);
    });

    it('should handle multiple redo operations', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      const action3: HistoryAction = { type: 'module_add', moduleId: 'module-3' };
      
      historyManager.pushState({ ...mockMap, name: 'State 1' }, action1);
      historyManager.pushState({ ...mockMap, name: 'State 2' }, action2);
      historyManager.pushState({ ...mockMap, name: 'State 3' }, action3);
      
      historyManager.undo();
      historyManager.undo();
      
      historyManager.redo();
      const result = historyManager.redo();
      
      expect(result?.name).toBe('State 3');
      expect(historyManager.getRedoStackSize()).toBe(0);
    });
  });

  describe('canUndo', () => {
    it('should return false when no states exist', () => {
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should return false when only one state exists', () => {
      const action: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      historyManager.pushState(mockMap, action);
      
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should return true when multiple states exist', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      
      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false when redo stack is empty', () => {
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      
      expect(historyManager.canRedo()).toBe(true);
    });

    it('should return false after new action is pushed', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      const action3: HistoryAction = { type: 'module_add', moduleId: 'module-3' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      historyManager.pushState(mockMap, action3);
      
      expect(historyManager.canRedo()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear both undo and redo stacks', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_add', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      
      historyManager.clear();
      
      expect(historyManager.getUndoStackSize()).toBe(0);
      expect(historyManager.getRedoStackSize()).toBe(0);
      expect(historyManager.canUndo()).toBe(false);
      expect(historyManager.canRedo()).toBe(false);
    });
  });

  describe('getLastAction', () => {
    it('should return null when no actions exist', () => {
      expect(historyManager.getLastAction()).toBeNull();
    });

    it('should return the last action', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_delete', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      
      expect(historyManager.getLastAction()).toEqual(action2);
    });
  });

  describe('getNextAction', () => {
    it('should return null when redo stack is empty', () => {
      expect(historyManager.getNextAction()).toBeNull();
    });

    it('should return the next action from redo stack', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_delete', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      
      expect(historyManager.getNextAction()).toEqual(action2);
    });
  });

  describe('getSnapshot', () => {
    it('should return current history state snapshot', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_delete', moduleId: 'module-2' };
      
      historyManager.pushState(mockMap, action1);
      historyManager.pushState(mockMap, action2);
      historyManager.undo();
      
      const snapshot = historyManager.getSnapshot();
      
      expect(snapshot.undoStackSize).toBe(1);
      expect(snapshot.redoStackSize).toBe(1);
      expect(snapshot.lastAction).toEqual(action1);
      expect(snapshot.nextAction).toEqual(action2);
    });
  });

  describe('createHistoryManager', () => {
    it('should create a new HistoryManager instance', () => {
      const manager = createHistoryManager();
      expect(manager).toBeInstanceOf(HistoryManager);
    });

    it('should use default maxHistorySize of 50', () => {
      const manager = createHistoryManager();
      
      for (let i = 0; i < 60; i++) {
        const action: HistoryAction = { type: 'module_add', moduleId: `module-${i}` };
        manager.pushState(mockMap, action);
      }
      
      expect(manager.getUndoStackSize()).toBe(50);
    });

    it('should accept custom maxHistorySize', () => {
      const manager = createHistoryManager({ maxHistorySize: 10 });
      
      for (let i = 0; i < 20; i++) {
        const action: HistoryAction = { type: 'module_add', moduleId: `module-${i}` };
        manager.pushState(mockMap, action);
      }
      
      expect(manager.getUndoStackSize()).toBe(10);
    });
  });

  describe('state cloning', () => {
    it('should deep clone nested objects', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_update', moduleId: 'module-1' };
      
      const mapWithModule: CampsiteMap = {
        ...mockMap,
        modules: [{
          id: 'module-1',
          type: 'campsite',
          position: { x: 100, y: 100 },
          size: { width: 200, height: 100 },
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          metadata: {
            name: 'Test Site',
            capacity: 4,
            amenities: ['water', 'electric'],
            pricing: { basePrice: 50, seasonalMultiplier: 1.2 },
            accessibility: true,
            electricHookup: true,
            waterHookup: true,
            sewerHookup: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }] as AnyModule[],
      };
      
      historyManager.pushState(mapWithModule, action1);
      
      // Modify and push new state
      const modifiedMap = {
        ...mapWithModule,
        modules: [{
          ...mapWithModule.modules[0],
          metadata: {
            ...(mapWithModule.modules[0] as any).metadata,
            name: 'Modified Site',
          },
        }] as AnyModule[],
      };
      historyManager.pushState(modifiedMap, action2);
      
      const undoneState = historyManager.undo();
      expect(undoneState).not.toBeNull();
      expect((undoneState?.modules[0] as any).metadata.name).toBe('Test Site');
    });

    it('should handle arrays in metadata', () => {
      const action1: HistoryAction = { type: 'module_add', moduleId: 'module-1' };
      const action2: HistoryAction = { type: 'module_update', moduleId: 'module-1' };
      
      const mapWithMetadata: CampsiteMap = {
        ...mockMap,
        metadata: {
          ...mockMap.metadata,
          amenities: ['wifi', 'pool', 'laundry'],
        },
      };
      
      historyManager.pushState(mapWithMetadata, action1);
      
      const modifiedMap = {
        ...mapWithMetadata,
        metadata: {
          ...mapWithMetadata.metadata,
          amenities: ['wifi', 'pool', 'laundry', 'playground'],
        },
      };
      historyManager.pushState(modifiedMap, action2);
      
      const undoneState = historyManager.undo();
      expect(undoneState).not.toBeNull();
      expect(undoneState?.metadata.amenities).toEqual(['wifi', 'pool', 'laundry']);
    });
  });
});
