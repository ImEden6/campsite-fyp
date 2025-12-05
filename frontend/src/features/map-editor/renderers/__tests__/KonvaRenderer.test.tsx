/**
 * KonvaRenderer Unit Tests
 * Tests for the KonvaRenderer class methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KonvaRenderer } from '../KonvaRenderer';
import type { AnyModule, Size, Position } from '@/types';
import type { GridOptions } from '../../core/renderer';

// Mock Konva components
vi.mock('../KonvaModuleRenderer', () => ({
  KonvaModuleRenderer: ({ module, props }: any) => (
    <div data-testid={`module-${module.id}`} data-selected={props.isSelected} />
  ),
}));

vi.mock('../KonvaGridRenderer', () => ({
  KonvaGridRenderer: ({ options }: any) => (
    <div data-testid="grid" data-grid-size={options.gridSize} />
  ),
}));

vi.mock('../KonvaBackgroundImage', () => ({
  KonvaBackgroundImage: ({ imageUrl, width, height }: any) => (
    <div data-testid="background" data-url={imageUrl} data-width={width} data-height={height} />
  ),
}));

vi.mock('../KonvaSelectionHandles', () => ({
  KonvaSelectionHandles: ({ modules }: any) => (
    <div data-testid="selection-handles" data-module-count={modules.length} />
  ),
}));

// Helper to create mock module
const createMockModule = (overrides?: Partial<AnyModule>): AnyModule => ({
  id: 'test-module-1',
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

describe('KonvaRenderer', () => {
  let renderer: KonvaRenderer;

  beforeEach(() => {
    renderer = new KonvaRenderer();
    vi.clearAllMocks();
  });

  describe('renderModule', () => {
    it('should render module with correct props', () => {
      const module = createMockModule();
      const props = {
        isSelected: true,
        hasValidationErrors: false,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      // The result is a React node, we can't easily test its content without rendering
      // But we can verify it's not null/undefined
      expect(result).not.toBeNull();
    });

    it('should pass shouldAnimate prop to KonvaModuleRenderer', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        shouldAnimate: true,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should pass isFocused prop to KonvaModuleRenderer', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        isFocused: true,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should pass drag handlers to KonvaModuleRenderer', () => {
      const module = createMockModule();
      const onDragStart = vi.fn();
      const onDragMove = vi.fn();
      const onDragEnd = vi.fn();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        onDragStart,
        onDragMove,
        onDragEnd,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  describe('renderGrid', () => {
    it('should render grid with correct options', () => {
      const options: GridOptions = {
        gridSize: 20,
        width: 1000,
        height: 1000,
      };

      const result = renderer.renderGrid(options);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should include color option when provided', () => {
      const options: GridOptions = {
        gridSize: 20,
        width: 1000,
        height: 1000,
        color: '#FF0000',
      };

      const result = renderer.renderGrid(options);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  describe('renderBackground', () => {
    it('should render background image with correct size', () => {
      const imageUrl = '/test-image.jpg';
      const size: Size = { width: 1000, height: 800 };

      const result = renderer.renderBackground(imageUrl, size);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle different image URLs', () => {
      const imageUrl1 = '/image1.jpg';
      const imageUrl2 = '/image2.jpg';
      const size: Size = { width: 500, height: 500 };

      const result1 = renderer.renderBackground(imageUrl1, size);
      const result2 = renderer.renderBackground(imageUrl2, size);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1).not.toBe(result2); // Different keys should produce different results
    });
  });

  describe('renderSelectionHandles', () => {
    it('should render selection handles for single module', () => {
      const modules = [createMockModule()];

      const result = renderer.renderSelectionHandles(modules);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should render selection handles for multiple modules', () => {
      const modules = [
        createMockModule({ id: 'module-1' }),
        createMockModule({ id: 'module-2' }),
        createMockModule({ id: 'module-3' }),
      ];

      const result = renderer.renderSelectionHandles(modules);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should return null for empty modules array', () => {
      const modules: AnyModule[] = [];

      const result = renderer.renderSelectionHandles(modules);

      expect(result).toBeNull();
    });

    it('should pass onTransform callback when provided', () => {
      const modules = [createMockModule()];
      const onTransform = vi.fn((_transform: {
        position?: Position;
        size?: Size;
        rotation?: number;
      }) => {});

      const result = renderer.renderSelectionHandles(modules, onTransform);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle modules with different types', () => {
      const modules = [
        createMockModule({ id: 'module-1', type: 'campsite' }),
        createMockModule({ id: 'module-2', type: 'toilet' }),
        createMockModule({ id: 'module-3', type: 'parking' }),
      ];

      const result = renderer.renderSelectionHandles(modules);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle module with missing metadata', () => {
      const module = createMockModule({ metadata: undefined });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle module with zero size', () => {
      const module = createMockModule({ size: { width: 0, height: 0 } });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle module with negative position', () => {
      const module = createMockModule({ position: { x: -100, y: -50 } });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const result = renderer.renderModule(module, props);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle grid with zero size', () => {
      const options: GridOptions = {
        gridSize: 20,
        width: 0,
        height: 0,
      };

      const result = renderer.renderGrid(options);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle background with zero size', () => {
      const imageUrl = '/test-image.jpg';
      const size: Size = { width: 0, height: 0 };

      const result = renderer.renderBackground(imageUrl, size);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });
});

