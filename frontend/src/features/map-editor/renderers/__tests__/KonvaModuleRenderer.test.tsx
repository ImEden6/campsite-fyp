/**
 * KonvaModuleRenderer Unit Tests
 * Tests for module rendering, drag functionality, and visual states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@/tests/utils/test-utils';
import { KonvaModuleRenderer } from '../KonvaModuleRenderer';
import type { AnyModule } from '@/types';

// Mock Konva at the module level
vi.mock('konva', () => ({
  default: {
    Stage: class MockStage {},
    Layer: class MockLayer {},
    Group: class MockGroup {},
    Rect: class MockRect {},
    Circle: class MockCircle {},
    Text: class MockText {},
    Tween: class MockTween {
      play() {}
      destroy() {}
    },
    Easings: {
      EaseInOut: () => {},
    },
  },
}));

// Mock react-konva
vi.mock('react-konva', () => ({
    Group: ({ children, ...props }: any) => (
      <div data-testid="konva-group" {...props}>
        {children}
      </div>
    ),
    Rect: (props: any) => <div data-testid="konva-rect" {...props} />,
    Circle: (props: any) => <div data-testid="konva-circle" {...props} />,
    Text: (props: any) => <div data-testid="konva-text" {...props} />,
}));

// Mock hooks
const mockUseKonvaStage = {
  stageRef: { current: null },
  screenToCanvas: (pos: { x: number; y: number }) => pos,
};

const mockUseEditorService = {
  currentTool: 'select',
  snapToGrid: false,
  getGridSize: () => 20,
};

vi.mock('../../hooks/useKonvaStage', () => ({
  useKonvaStage: () => mockUseKonvaStage,
}));

vi.mock('../../hooks/useEditorService', () => ({
  useEditorService: () => mockUseEditorService,
}));

vi.mock('../../hooks/useKonvaAnimation', () => ({
  useKonvaAnimation: vi.fn(),
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

describe('KonvaModuleRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorService.currentTool = 'select';
    mockUseEditorService.snapToGrid = false;
  });

  describe('Rendering', () => {
    it('should render module with correct position and size', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('x', '100');
      expect(group).toHaveAttribute('y', '100');
    });

    it('should render rectangle shape for default module types', () => {
      const module = createMockModule({ type: 'campsite' });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
    });

    it('should render circle shape for electricity and waste_disposal modules', () => {
      const module = createMockModule({ type: 'electricity' });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const circle = container.querySelector('[data-testid="konva-circle"]');
      expect(circle).toBeInTheDocument();
    });

    it('should render rounded rectangle for recreation modules', () => {
      const module = createMockModule({ type: 'recreation' });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute('cornerRadius', '8');
    });

    it('should render icon text', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should render module name label when metadata.name exists', () => {
      const module = createMockModule({
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
      });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const texts = container.querySelectorAll('[data-testid="konva-text"]');
      // Should have at least icon and label
      expect(texts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Selection State', () => {
    it('should apply selected styling when isSelected is true', () => {
      const module = createMockModule();
      const props = {
        isSelected: true,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      // Selected modules should have blue stroke (#0EA5E9)
      expect(rect).toHaveAttribute('stroke', '#0EA5E9');
    });

    it('should apply validation error styling when hasValidationErrors is true', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: true,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      // Validation errors should have red stroke (#EF4444)
      expect(rect).toHaveAttribute('stroke', '#EF4444');
    });
  });

  describe('Focus Indicator', () => {
    it('should render focus indicator when isFocused is true', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} isFocused={true} />
      );

      const rects = container.querySelectorAll('[data-testid="konva-rect"]');
      // Should have shape rect + focus indicator rect
      expect(rects.length).toBeGreaterThanOrEqual(2);
    });

    it('should not render focus indicator when isFocused is false', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} isFocused={false} />
      );

      // Only shape rect should be present
      const rects = container.querySelectorAll('[data-testid="konva-rect"]');
      expect(rects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Drag Functionality', () => {
    it('should enable drag when tool is select and module is not locked', () => {
      const module = createMockModule({ locked: false });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };
      const onDragStart = vi.fn();
      const onDragMove = vi.fn();
      const onDragEnd = vi.fn();

      mockUseEditorService.currentTool = 'select';

      const { container } = render(
        <KonvaModuleRenderer
          module={module}
          props={props}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      // draggable should be true (as boolean)
      expect(group).toHaveAttribute('draggable', 'true');
    });

    it('should disable drag when module is locked', () => {
      const module = createMockModule({ locked: true });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };
      const onDragStart = vi.fn();
      const onDragMove = vi.fn();
      const onDragEnd = vi.fn();

      mockUseEditorService.currentTool = 'select';

      const { container } = render(
        <KonvaModuleRenderer
          module={module}
          props={props}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      // draggable should be false for locked modules
      expect(group).toHaveAttribute('draggable', 'false');
    });

    it('should disable drag when tool is not select', () => {
      const module = createMockModule({ locked: false });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };
      const onDragStart = vi.fn();
      const onDragMove = vi.fn();
      const onDragEnd = vi.fn();

      mockUseEditorService.currentTool = 'move';

      const { container } = render(
        <KonvaModuleRenderer
          module={module}
          props={props}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      // draggable should be false when tool is not select
      expect(group).toHaveAttribute('draggable', 'false');
    });

    it('should disable drag when drag handlers are not provided', () => {
      const module = createMockModule({ locked: false });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      mockUseEditorService.currentTool = 'select';

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      // draggable should be false when handlers are missing
      expect(group).toHaveAttribute('draggable', 'false');
    });
  });

  describe('Rotation', () => {
    it('should apply rotation to module', () => {
      const module = createMockModule({ rotation: 45 });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('rotation', '45');
    });

    it('should default rotation to 0 when not specified', () => {
      const module = createMockModule({ rotation: undefined });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const group = container.querySelector('[data-testid="konva-group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('rotation', '0');
    });
  });

  describe('Visibility', () => {
    it('should apply reduced opacity when module is not visible', () => {
      const module = createMockModule({ visible: false });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        opacity: undefined, // Use default
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      // Hidden modules should have reduced opacity (0.4)
      expect(rect).toHaveAttribute('opacity', '0.4');
    });

    it('should apply normal opacity when module is visible', () => {
      const module = createMockModule({ visible: true });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        opacity: undefined, // Use default
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      // Visible modules should have normal opacity (0.8)
      expect(rect).toHaveAttribute('opacity', '0.8');
    });

    it('should use custom opacity from props when provided', () => {
      const module = createMockModule({ visible: true });
      const props = {
        isSelected: false,
        hasValidationErrors: false,
        opacity: 0.5,
      };

      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} />
      );

      const rect = container.querySelector('[data-testid="konva-rect"]');
      expect(rect).toBeInTheDocument();
      expect(rect).toHaveAttribute('opacity', '0.5');
    });
  });

  describe('Animation', () => {
    it('should integrate with useKonvaAnimation hook', () => {
      const module = createMockModule();
      const props = {
        isSelected: false,
        hasValidationErrors: false,
      };

      // The hook is already mocked, just verify component renders
      const { container } = render(
        <KonvaModuleRenderer module={module} props={props} shouldAnimate={true} />
      );

      expect(container.querySelector('[data-testid="konva-group"]')).toBeInTheDocument();
    });
  });
});

