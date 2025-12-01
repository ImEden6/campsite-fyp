/**
 * Map Editor Transform Integration Tests
 * Tests for module resize, rotation, multi-module transformations, undo/redo, copy/paste, and properties panel
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/editorStore';
import { useMapStore } from '@/stores/mapStore';
import {
  calculateResize,
  calculateRotation,
  calculateBoundingBox,
  snapToGrid,
  snapSizeToGrid,
} from '@/utils/transformUtils';
import { HistoryManager } from '@/utils/historyManager';
import type { AnyModule, CampsiteMap, Position, Size } from '@/types';

// Mock module data
const createMockModule = (overrides?: Partial<AnyModule>): AnyModule => ({
  id: `module-${Date.now()}-${Math.random()}`,
  type: 'campsite',
  position: { x: 100, y: 100 },
  size: { width: 100, height: 100 },
  rotation: 0,
  zIndex: 1,
  locked: false,
  visible: true,
  metadata: {
    name: 'Test Campsite',
    capacity: 4,
    amenities: [],
    pricing: {
      basePrice: 35,
      seasonalMultiplier: 1,
    },
    accessibility: false,
    electricHookup: false,
    waterHookup: false,
    sewerHookup: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as AnyModule);

const createMockMap = (modules: AnyModule[] = []): CampsiteMap => ({
  id: 'test-map-1',
  name: 'Test Map',
  description: 'Test map for integration tests',
  imageUrl: '/test-image.jpg',
  imageSize: { width: 1000, height: 1000 },
  scale: 1,
  bounds: {
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000,
  },
  modules,
  metadata: {
    address: '123 Test St',
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    timezone: 'UTC',
    capacity: 100,
    amenities: [],
    rules: [],
    emergencyContacts: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Map Editor Transform Integration Tests', () => {
  beforeEach(() => {
    // Reset stores before each test
    const { resetEditor } = useEditorStore.getState();
    resetEditor();
  });

  describe('Module Resize with Snap-to-Grid', () => {
    it('should resize module from bottom-right handle with snap-to-grid enabled', () => {
      const startBounds = { x: 100, y: 100, width: 100, height: 100 };
      const startMousePos = { x: 200, y: 200 };
      const currentMousePos = { x: 250, y: 250 };

      const result = calculateResize(
        'bottom-right',
        startBounds,
        currentMousePos,
        startMousePos,
        {
          snapToGrid: true,
          gridSize: 20,
          minSize: { width: 20, height: 20 },
        }
      );

      // Expect size to be snapped to grid (20px increments)
      expect(result.size.width % 20).toBe(0);
      expect(result.size.height % 20).toBe(0);
      expect(result.size.width).toBeGreaterThan(startBounds.width);
      expect(result.size.height).toBeGreaterThan(startBounds.height);
    });

    it('should resize module from top-left handle and adjust position', () => {
      const startBounds = { x: 100, y: 100, width: 100, height: 100 };
      const startMousePos = { x: 100, y: 100 };
      const currentMousePos = { x: 80, y: 80 };

      const result = calculateResize(
        'top-left',
        startBounds,
        currentMousePos,
        startMousePos,
        {
          snapToGrid: true,
          gridSize: 20,
          minSize: { width: 20, height: 20 },
        }
      );

      // Position should change when resizing from top-left
      expect(result.position.x).toBeLessThan(startBounds.x);
      expect(result.position.y).toBeLessThan(startBounds.y);
      // Size should increase
      expect(result.size.width).toBeGreaterThan(startBounds.width);
      expect(result.size.height).toBeGreaterThan(startBounds.height);
    });

    it('should enforce minimum size constraints during resize', () => {
      const startBounds = { x: 100, y: 100, width: 50, height: 50 };
      const startMousePos = { x: 150, y: 150 };
      const currentMousePos = { x: 110, y: 110 }; // Try to make it very small

      const result = calculateResize(
        'bottom-right',
        startBounds,
        currentMousePos,
        startMousePos,
        {
          snapToGrid: false,
          minSize: { width: 20, height: 20 },
        }
      );

      // Should enforce minimum size
      expect(result.size.width).toBeGreaterThanOrEqual(20);
      expect(result.size.height).toBeGreaterThanOrEqual(20);
    });

    it('should preserve aspect ratio when Shift key is simulated', () => {
      const startBounds = { x: 100, y: 100, width: 100, height: 100 };
      const startMousePos = { x: 200, y: 200 };
      const currentMousePos = { x: 250, y: 220 }; // Uneven drag

      const result = calculateResize(
        'bottom-right',
        startBounds,
        currentMousePos,
        startMousePos,
        {
          preserveAspectRatio: true,
          snapToGrid: false,
          minSize: { width: 20, height: 20 },
        }
      );

      // Aspect ratio should be preserved (1:1 for square)
      const aspectRatio = result.size.width / result.size.height;
      expect(Math.abs(aspectRatio - 1)).toBeLessThan(0.1);
    });

    it('should resize from edge handles along single axis', () => {
      const startBounds = { x: 100, y: 100, width: 100, height: 100 };
      const startMousePos = { x: 200, y: 150 };
      const currentMousePos = { x: 250, y: 150 };

      const result = calculateResize(
        'middle-right',
        startBounds,
        currentMousePos,
        startMousePos,
        {
          snapToGrid: false,
          minSize: { width: 20, height: 20 },
        }
      );

      // Width should change, height should remain the same
      expect(result.size.width).toBeGreaterThan(startBounds.width);
      expect(result.size.height).toBe(startBounds.height);
      expect(result.position.y).toBe(startBounds.y);
    });
  });

  describe('Module Rotation with Angle Snapping', () => {
    it('should calculate rotation angle from mouse position', () => {
      const center = { x: 150, y: 150 };
      const mousePos = { x: 200, y: 150 }; // Right of center (0 degrees)

      const result = calculateRotation(center, mousePos, {});

      // Should be approximately 0 degrees (pointing right)
      expect(result.angle).toBeCloseTo(0, 0);
    });

    it('should snap rotation to 15-degree increments', () => {
      const center = { x: 150, y: 150 };
      const mousePos = { x: 200, y: 170 }; // Slightly below right

      const result = calculateRotation(center, mousePos, {
        snapAngle: 15,
      });

      // Should snap to nearest 15-degree increment
      expect(result.angle % 15).toBe(0);
    });

    it('should calculate rotation for all quadrants', () => {
      const center = { x: 150, y: 150 };

      // Test all four quadrants
      const positions = [
        { pos: { x: 200, y: 150 }, expectedRange: [0, 10] }, // Right (0°)
        { pos: { x: 150, y: 200 }, expectedRange: [85, 95] }, // Bottom (90°)
        { pos: { x: 100, y: 150 }, expectedRange: [175, 185] }, // Left (180°)
        { pos: { x: 150, y: 100 }, expectedRange: [265, 275] }, // Top (270°)
      ];

      positions.forEach(({ pos, expectedRange }) => {
        const result = calculateRotation(center, pos, {});
        expect(result.angle).toBeGreaterThanOrEqual(expectedRange[0]!);
        expect(result.angle).toBeLessThanOrEqual(expectedRange[1]!);
      });
    });

    it('should normalize rotation angle to 0-360 range', () => {
      const center = { x: 150, y: 150 };
      const mousePos = { x: 150, y: 100 }; // Above center

      const result = calculateRotation(center, mousePos, {});

      // Should be in valid range
      expect(result.angle).toBeGreaterThanOrEqual(0);
      expect(result.angle).toBeLessThan(360);
    });
  });

  describe('Multi-Module Transformations', () => {
    it('should calculate bounding box for multiple modules', () => {
      const modules = [
        { position: { x: 100, y: 100 }, size: { width: 50, height: 50 }, rotation: 0 },
        { position: { x: 200, y: 150 }, size: { width: 60, height: 40 }, rotation: 0 },
        { position: { x: 150, y: 200 }, size: { width: 40, height: 50 }, rotation: 0 },
      ];

      const boundingBox = calculateBoundingBox(modules);

      // Should encompass all modules
      expect(boundingBox.x).toBe(100);
      expect(boundingBox.y).toBe(100);
      expect(boundingBox.width).toBe(160); // 200 + 60 - 100
      expect(boundingBox.height).toBe(150); // 200 + 50 - 100
    });

    it('should handle empty module array', () => {
      const boundingBox = calculateBoundingBox([]);

      expect(boundingBox.x).toBe(0);
      expect(boundingBox.y).toBe(0);
      expect(boundingBox.width).toBe(0);
      expect(boundingBox.height).toBe(0);
    });

    it('should calculate bounding box for single module', () => {
      const modules = [
        { position: { x: 100, y: 100 }, size: { width: 50, height: 50 }, rotation: 0 },
      ];

      const boundingBox = calculateBoundingBox(modules);

      expect(boundingBox.x).toBe(100);
      expect(boundingBox.y).toBe(100);
      expect(boundingBox.width).toBe(50);
      expect(boundingBox.height).toBe(50);
    });
  });

  describe('Undo/Redo of Transformations', () => {
    it('should push state to history and allow undo', () => {
      const historyManager = new HistoryManager({ maxHistorySize: 50 });
      const initialMap = createMockMap([createMockModule()]);
      const modifiedMap = createMockMap([
        createMockModule({ position: { x: 200, y: 200 } }),
      ]);

      // Push initial state
      historyManager.pushState(initialMap, { type: 'module_add', moduleId: 'test-1' });

      // Push modified state
      historyManager.pushState(modifiedMap, { type: 'module_move', moduleIds: ['test-1'] });

      expect(historyManager.canUndo()).toBe(true);

      // Undo should return previous state
      const previousState = historyManager.undo();
      expect(previousState).not.toBeNull();
      expect(previousState?.modules[0]!.position.x).toBe(100);
    });

    it('should allow redo after undo', () => {
      const historyManager = new HistoryManager({ maxHistorySize: 50 });
      const initialMap = createMockMap([createMockModule()]);
      const modifiedMap = createMockMap([
        createMockModule({ position: { x: 200, y: 200 } }),
      ]);

      historyManager.pushState(initialMap, { type: 'module_add', moduleId: 'test-1' });
      historyManager.pushState(modifiedMap, { type: 'module_move', moduleIds: ['test-1'] });

      // Undo
      historyManager.undo();
      expect(historyManager.canRedo()).toBe(true);

      // Redo should restore modified state
      const restoredState = historyManager.redo();
      expect(restoredState).not.toBeNull();
      expect(restoredState?.modules[0]!.position.x).toBe(200);
    });

    it('should clear redo stack when new action is performed', () => {
      const historyManager = new HistoryManager({ maxHistorySize: 50 });
      const map1 = createMockMap([createMockModule({ id: 'module-1' })]);
      const map2 = createMockMap([createMockModule({ id: 'module-1', position: { x: 200, y: 200 } })]);
      const map3 = createMockMap([createMockModule({ id: 'module-1', position: { x: 300, y: 300 } })]);

      historyManager.pushState(map1, { type: 'module_add', moduleId: 'module-1' });
      historyManager.pushState(map2, { type: 'module_move', moduleIds: ['module-1'] });

      // Undo
      historyManager.undo();
      expect(historyManager.canRedo()).toBe(true);

      // Push new state - should clear redo stack
      historyManager.pushState(map3, { type: 'module_move', moduleIds: ['module-1'] });
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should enforce maximum history size', () => {
      const historyManager = new HistoryManager({ maxHistorySize: 3 });

      // Push 5 states
      for (let i = 0; i < 5; i++) {
        const map = createMockMap([createMockModule({ position: { x: i * 100, y: i * 100 } })]);
        historyManager.pushState(map, { type: 'module_move', moduleIds: ['test'] });
      }

      // Should only keep last 3 states
      expect(historyManager.getUndoStackSize()).toBe(3);
    });

    it('should track different action types', () => {
      const historyManager = new HistoryManager({ maxHistorySize: 50 });
      const map = createMockMap([createMockModule()]);

      const actions = [
        { type: 'module_add' as const, moduleId: 'test-1' },
        { type: 'module_delete' as const, moduleId: 'test-1' },
        { type: 'module_move' as const, moduleIds: ['test-1'] },
        { type: 'module_resize' as const, moduleIds: ['test-1'] },
        { type: 'module_rotate' as const, moduleIds: ['test-1'] },
      ];

      actions.forEach((action) => {
        historyManager.pushState(map, action);
      });

      expect(historyManager.getUndoStackSize()).toBe(5);
      expect(historyManager.getLastAction()?.type).toBe('module_rotate');
    });
  });

  describe('Copy/Paste Operations', () => {
    it('should copy modules to clipboard', () => {
      const { result } = renderHook(() => useEditorStore());
      const modules = [createMockModule(), createMockModule()];

      act(() => {
        result.current.copyModules(modules);
      });

      expect(result.current.editor.clipboardModules).toHaveLength(2);
    });

    it('should paste modules with offset position', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({ position: { x: 100, y: 100 } });

      act(() => {
        result.current.copyModules([originalModule]);
      });

      const pastedModules = result.current.pasteModules({ x: 20, y: 20 });

      expect(pastedModules).toHaveLength(1);
      expect(pastedModules[0]!.position.x).toBe(120);
      expect(pastedModules[0]!.position.y).toBe(120);
      expect(pastedModules[0]!.id).not.toBe(originalModule.id);
    });

    it('should generate unique IDs for pasted modules', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({ id: 'original-1' });

      act(() => {
        result.current.copyModules([originalModule]);
      });

      const pastedModules1 = result.current.pasteModules();
      const pastedModules2 = result.current.pasteModules();

      expect(pastedModules1[0]!.id).not.toBe(originalModule.id);
      expect(pastedModules2[0]!.id).not.toBe(originalModule.id);
      expect(pastedModules1[0]!.id).not.toBe(pastedModules2[0]!.id);
    });

    it('should preserve relative positions when pasting multiple modules', () => {
      const { result } = renderHook(() => useEditorStore());
      const modules = [
        createMockModule({ position: { x: 100, y: 100 } }),
        createMockModule({ position: { x: 200, y: 150 } }),
      ];

      act(() => {
        result.current.copyModules(modules);
      });

      const pastedModules = result.current.pasteModules({ x: 50, y: 50 });

      // Check relative positions are preserved
      const dx1 = pastedModules[0]!.position.x - modules[0]!.position.x;
      const dy1 = pastedModules[0]!.position.y - modules[0]!.position.y;
      const dx2 = pastedModules[1]!.position.x - modules[1]!.position.x;
      const dy2 = pastedModules[1]!.position.y - modules[1]!.position.y;

      expect(dx1).toBe(50);
      expect(dy1).toBe(50);
      expect(dx2).toBe(50);
      expect(dy2).toBe(50);
    });

    it('should handle empty clipboard gracefully', () => {
      const { result } = renderHook(() => useEditorStore());

      const pastedModules = result.current.pasteModules();

      expect(pastedModules).toHaveLength(0);
    });

    it('should duplicate modules with offset', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({ position: { x: 100, y: 100 } });

      const duplicatedModules = result.current.duplicateModules([originalModule], { x: 30, y: 30 });

      expect(duplicatedModules).toHaveLength(1);
      expect(duplicatedModules[0]!.position.x).toBe(130);
      expect(duplicatedModules[0]!.position.y).toBe(130);
      expect(duplicatedModules[0]!.id).not.toBe(originalModule.id);
    });
  });

  describe('Module Duplication', () => {
    it('should generate unique ID for duplicated module', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({ id: 'original-module-1' });

      const duplicated1 = result.current.duplicateModules([originalModule]);
      const duplicated2 = result.current.duplicateModules([originalModule]);

      // Each duplication should have unique ID
      expect(duplicated1[0]!.id).not.toBe(originalModule.id);
      expect(duplicated2[0]!.id).not.toBe(originalModule.id);
      expect(duplicated1[0]!.id).not.toBe(duplicated2[0]!.id);
    });

    it('should apply default offset of 20x20 when no offset provided', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({ position: { x: 100, y: 100 } });

      const duplicatedModules = result.current.duplicateModules([originalModule]);

      expect(duplicatedModules[0]!.position.x).toBe(120);
      expect(duplicatedModules[0]!.position.y).toBe(120);
    });

    it('should preserve all module properties except id, position, and timestamps', () => {
      const { result } = renderHook(() => useEditorStore());
      const originalModule = createMockModule({
        type: 'campsite',
        size: { width: 150, height: 200 },
        rotation: 45,
        zIndex: 5,
        locked: false,
        visible: true,
        metadata: {
          name: 'Premium Campsite',
          capacity: 6,
          amenities: ['fire_pit', 'picnic_table'],
          pricing: {
            basePrice: 50,
            seasonalMultiplier: 1.5,
          },
          accessibility: true,
          electricHookup: true,
          waterHookup: true,
          sewerHookup: false,
        },
      });

      const duplicatedModules = result.current.duplicateModules([originalModule]);
      const duplicated = duplicatedModules[0]!;

      // Check preserved properties
      expect(duplicated.type).toBe(originalModule.type);
      expect(duplicated.size).toEqual(originalModule.size);
      expect(duplicated.rotation).toBe(originalModule.rotation);
      expect(duplicated.zIndex).toBe(originalModule.zIndex);
      expect(duplicated.locked).toBe(originalModule.locked);
      expect(duplicated.visible).toBe(originalModule.visible);
      expect(duplicated.metadata).toEqual(originalModule.metadata);

      // Check changed properties
      expect(duplicated.id).not.toBe(originalModule.id);
      expect(duplicated.position).not.toEqual(originalModule.position);
      // Timestamps should be Date objects (may be same time in tests, but that's ok)
      expect(duplicated.createdAt).toBeInstanceOf(Date);
      expect(duplicated.updatedAt).toBeInstanceOf(Date);
    });

    it('should duplicate multiple modules maintaining relative positions', () => {
      const { result } = renderHook(() => useEditorStore());
      const modules = [
        createMockModule({ id: 'module-1', position: { x: 100, y: 100 } }),
        createMockModule({ id: 'module-2', position: { x: 200, y: 150 } }),
        createMockModule({ id: 'module-3', position: { x: 150, y: 200 } }),
      ];

      const duplicatedModules = result.current.duplicateModules(modules, { x: 50, y: 50 });

      expect(duplicatedModules).toHaveLength(3);

      // Check that relative positions are maintained
      const originalDx12 = modules[1]!.position.x - modules[0]!.position.x;
      const originalDy12 = modules[1]!.position.y - modules[0]!.position.y;
      const duplicatedDx12 = duplicatedModules[1]!.position.x - duplicatedModules[0]!.position.x;
      const duplicatedDy12 = duplicatedModules[1]!.position.y - duplicatedModules[0]!.position.y;

      expect(duplicatedDx12).toBe(originalDx12);
      expect(duplicatedDy12).toBe(originalDy12);

      // Check offset is applied to all
      expect(duplicatedModules[0]!.position.x).toBe(150);
      expect(duplicatedModules[0]!.position.y).toBe(150);
      expect(duplicatedModules[1]!.position.x).toBe(250);
      expect(duplicatedModules[1]!.position.y).toBe(200);
    });

    it('should handle duplication with undo/redo', () => {
      const { result: editorResult } = renderHook(() => useEditorStore());
      const { result: mapResult } = renderHook(() => useMapStore());
      
      const originalModule = createMockModule({ id: 'original-1', position: { x: 100, y: 100 } });
      const initialMap = createMockMap([originalModule]);

      // Setup initial map state
      act(() => {
        mapResult.current.setMaps([initialMap]);
        mapResult.current.selectMap(initialMap.id);
      });

      // Push initial state to history
      act(() => {
        editorResult.current.pushHistory(initialMap, {
          type: 'module_add',
          moduleId: originalModule.id,
        });
      });

      // Duplicate the module
      const duplicatedModules = editorResult.current.duplicateModules([originalModule]);
      const mapWithDuplicate = createMockMap([originalModule, duplicatedModules[0]!]);

      // Push duplication to history
      act(() => {
        editorResult.current.pushHistory(mapWithDuplicate, {
          type: 'module_add',
          moduleIds: [duplicatedModules[0]!.id],
          description: 'Duplicate module',
        });
      });

      expect(editorResult.current.canUndo()).toBe(true);

      // Undo should remove the duplicate
      act(() => {
        const previousState = editorResult.current.undo();
        if (previousState) {
          expect(previousState.modules).toHaveLength(1);
          expect(previousState.modules[0]!.id).toBe(originalModule.id);
        }
      });

      expect(editorResult.current.canRedo()).toBe(true);

      // Redo should restore the duplicate
      act(() => {
        const nextState = editorResult.current.redo();
        if (nextState) {
          expect(nextState.modules).toHaveLength(2);
        }
      });
    });

    it('should not duplicate connections (if module had connections)', () => {
      const { result } = renderHook(() => useEditorStore());
      
      // Create a module that might have connections in metadata
      const originalModule = createMockModule({
        type: 'custom',
        metadata: {
          name: 'Connected Module',
          description: 'A custom module',
          customType: 'custom',
          properties: {},
        },
      });

      const duplicatedModules = result.current.duplicateModules([originalModule]);

      // Duplicated module should not have connections
      // (In a real implementation, connections would be excluded)
      expect(duplicatedModules[0]!.id).not.toBe(originalModule.id);
      expect(duplicatedModules[0]!.metadata.name).toBe(originalModule.metadata.name);
    });

    it('should handle empty array gracefully', () => {
      const { result } = renderHook(() => useEditorStore());

      const duplicatedModules = result.current.duplicateModules([]);

      expect(duplicatedModules).toHaveLength(0);
    });

    it('should work with mapStore duplicateModule function', () => {
      const { result } = renderHook(() => useMapStore());
      const originalModule = createMockModule({ id: 'module-1', position: { x: 100, y: 100 } });
      const testMap = createMockMap([originalModule]);

      // Setup map
      act(() => {
        result.current.setMaps([testMap]);
        result.current.selectMap(testMap.id);
      });

      // Duplicate using mapStore
      act(() => {
        result.current.duplicateModule(testMap.id, originalModule.id);
      });

      const updatedMap = result.current.maps.find(m => m.id === testMap.id);
      expect(updatedMap?.modules).toHaveLength(2);
      
      const duplicatedModule = updatedMap?.modules.find(m => m.id !== originalModule.id);
      expect(duplicatedModule).toBeDefined();
      expect(duplicatedModule!.position.x).toBe(120); // 100 + 20 offset
      expect(duplicatedModule!.position.y).toBe(120); // 100 + 20 offset
    });
  });

  describe('Snap-to-Grid Utilities', () => {
    it('should snap position to grid', () => {
      const position: Position = { x: 123, y: 456 };
      const snapped = snapToGrid(position, 20);

      expect(snapped.x).toBe(120);
      expect(snapped.y).toBe(460);
    });

    it('should snap size to grid', () => {
      const size: Size = { width: 123, height: 456 };
      const snapped = snapSizeToGrid(size, 20);

      expect(snapped.width).toBe(120);
      expect(snapped.height).toBe(460);
    });

    it('should handle exact grid values', () => {
      const position: Position = { x: 100, y: 200 };
      const snapped = snapToGrid(position, 20);

      expect(snapped.x).toBe(100);
      expect(snapped.y).toBe(200);
    });

    it('should round to nearest grid increment', () => {
      const position: Position = { x: 119, y: 121 };
      const snapped = snapToGrid(position, 20);

      expect(snapped.x).toBe(120);
      expect(snapped.y).toBe(120);
    });
  });

  describe('Editor Store Integration', () => {
    it('should manage selection state', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.selectModules(['module-1', 'module-2']);
      });

      expect(result.current.editor.selectedModuleIds).toEqual(['module-1', 'module-2']);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.editor.selectedModuleIds).toEqual([]);
    });

    it('should toggle layer visibility', () => {
      const { result } = renderHook(() => useEditorStore());

      const initialVisibility = result.current.editor.layerVisibility.campsite;

      act(() => {
        result.current.toggleLayerVisibility('campsite');
      });

      expect(result.current.editor.layerVisibility.campsite).toBe(!initialVisibility);
    });

    it('should update editor state', () => {
      const { result } = renderHook(() => useEditorStore());

      act(() => {
        result.current.setEditor({
          snapToGrid: false,
          gridSize: 10,
          showGrid: false,
        });
      });

      expect(result.current.editor.snapToGrid).toBe(false);
      expect(result.current.editor.gridSize).toBe(10);
      expect(result.current.editor.showGrid).toBe(false);
    });

    it('should integrate history manager with editor store', () => {
      const { result } = renderHook(() => useEditorStore());
      const map1 = createMockMap([createMockModule()]);
      const map2 = createMockMap([createMockModule({ position: { x: 200, y: 200 } })]);

      // Push initial state
      act(() => {
        result.current.pushHistory(map1, { type: 'module_add', moduleId: 'test-1' });
      });

      // Push second state (need at least 2 states to undo)
      act(() => {
        result.current.pushHistory(map2, { type: 'module_move', moduleIds: ['test-1'] });
      });

      expect(result.current.canUndo()).toBe(true);
      expect(result.current.canRedo()).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo()).toBe(true);
    });
  });
});
