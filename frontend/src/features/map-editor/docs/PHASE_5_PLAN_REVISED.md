# Phase 5: UI/UX Enhancements Implementation Plan (REVISED)

## Overview
Enhance the user experience of the Konva-based map editor with smooth animations, visual feedback, accessibility features, and mobile/touch support. **This plan addresses critical Canvas/Konva limitations and performance considerations.**

## Critical Technical Constraints

### Canvas Accessibility Limitations
- **Konva renders to `<canvas>`**: Canvas content is invisible to screen readers
- **No DOM elements**: Cannot attach ARIA labels directly to canvas shapes
- **Single focusable element**: The entire canvas is one focusable element, not individual shapes
- **Solution**: Use a separate DOM accessibility layer alongside the canvas

### Animation Performance
- **Viewport culling**: Modules outside viewport still animate (wasteful)
- **Bulk operations**: Animating every module during undo/redo is expensive
- **Solution**: Only animate user-initiated actions, respect `prefers-reduced-motion`

### Touch Gesture Conflicts
- **Konva built-in drag**: Already handles touch, custom handlers may conflict
- **Browser defaults**: `preventDefault()` breaks browser zoom/scroll
- **Multi-touch priority**: Need clear gesture precedence rules
- **Solution**: Selective `preventDefault()`, clear gesture priority

---

## 1. Smooth Animations

### 1.1 Animation Utility Hook
**File**: `frontend/src/features/map-editor/hooks/useKonvaAnimation.ts` (NEW)

**Key Features**:
- Respect `prefers-reduced-motion` preference
- Proper Tween lifecycle management (cleanup on unmount)
- Only animate user-initiated actions (not programmatic changes)
- Skip animations for modules outside viewport

**Implementation**:
```typescript
import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { prefersReducedMotion } from '@/utils/accessibility';

interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  skipIfReducedMotion?: boolean;
  skipIfOutsideViewport?: boolean;
  stageRef?: React.RefObject<Konva.Stage>;
}

export function useKonvaAnimation(
  nodeRef: React.RefObject<Konva.Node>,
  targetProps: { x?: number; y?: number; rotation?: number },
  options: AnimationOptions = {}
) {
  const tweenRef = useRef<Konva.Tween | null>(null);
  const prevValuesRef = useRef<{ x?: number; y?: number; rotation?: number }>({});
  const { 
    duration = 200, 
    easing, 
    skipIfReducedMotion = true,
    skipIfOutsideViewport = false,
    stageRef,
  } = options;

  // Destructure to stabilize dependencies
  const { x, y, rotation } = targetProps;

  // Check if module is in viewport
  const isInViewport = useCallback(() => {
    if (!skipIfOutsideViewport || !stageRef?.current || !nodeRef.current) {
      return true; // Assume visible if can't determine
    }

    const stage = stageRef.current;
    const node = nodeRef.current;
    
    const viewport = stage.getClientRect();
    const nodeRect = node.getClientRect();

    return !(
      nodeRect.x > viewport.x + viewport.width ||
      nodeRect.x + nodeRect.width < viewport.x ||
      nodeRect.y > viewport.y + viewport.height ||
      nodeRect.y + nodeRect.height < viewport.y
    );
  }, [skipIfOutsideViewport, stageRef, nodeRef]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    // Check if values actually changed
    const prevValues = prevValuesRef.current;
    const hasChanged = 
      (x !== undefined && x !== prevValues.x) ||
      (y !== undefined && y !== prevValues.y) ||
      (rotation !== undefined && rotation !== prevValues.rotation);

    if (!hasChanged) return;

    // Update previous values
    prevValuesRef.current = { x, y, rotation };

    // Skip animation if user prefers reduced motion
    if (skipIfReducedMotion && prefersReducedMotion()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      node.getLayer()?.batchDraw();
      return;
    }

    // Skip animation if module is outside viewport
    if (skipIfOutsideViewport && !isInViewport()) {
      // Apply changes immediately without animation
      if (x !== undefined) node.x(x);
      if (y !== undefined) node.y(y);
      if (rotation !== undefined) node.rotation(rotation);
      node.getLayer()?.batchDraw();
      return;
    }

    // Clean up previous tween
    if (tweenRef.current) {
      tweenRef.current.destroy();
    }

    // Create new tween
    const tween = new Konva.Tween({
      node,
      duration: duration / 1000, // Konva uses seconds
      easing: easing || Konva.Easings.EaseInOut,
      x: x !== undefined ? x : node.x(),
      y: y !== undefined ? y : node.y(),
      rotation: rotation !== undefined ? rotation : node.rotation(),
      onFinish: () => {
        tweenRef.current = null;
      },
    });

    tweenRef.current = tween;
    tween.play();

    // Cleanup on unmount or dependency change
    return () => {
      if (tweenRef.current) {
        tweenRef.current.destroy();
        tweenRef.current = null;
      }
    };
  }, [nodeRef, x, y, rotation, duration, easing, skipIfReducedMotion, skipIfOutsideViewport, isInViewport]);
}
```

### 1.2 Module Movement Animations
**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`

**Rules**:
- Only animate when `shouldAnimate` prop is `true` (user-initiated moves)
- Skip animation for programmatic changes (undo/redo, bulk operations)
- Check if module is in viewport before animating

**User-Initiated Actions** (animate these):
- Drag end (when user releases module)
- Arrow key movements
- Manual position changes via properties panel
- Resize/rotate via handles

**Programmatic Actions** (skip animation):
- Undo/redo
- Bulk operations (select all → move)
- Initial render
- Map load

**Implementation**:
- Add `shouldAnimate?: boolean` prop to `KonvaModuleRendererProps`
- Use `useKonvaAnimation` hook with `groupRef` and `stageRef`
- Pass `skipIfOutsideViewport={true}` to animation hook
- Only animate if `shouldAnimate === true` and module is visible

### 1.3 Selection Animation
**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`

**Implementation**:
- Animate `strokeColor` and `strokeWidth` changes when selection state changes
- Duration: 150ms
- Respect `prefers-reduced-motion`

### 1.4 Transform Animation
**File**: `frontend/src/features/map-editor/renderers/KonvaSelectionHandles.tsx`

**Implementation**:
- Animate selection rectangle bounds changes
- Skip animation during active resize (only animate on resize end)
- Animate rotation handle position during rotation

---

## 2. Visual Feedback

### 2.1 Hover States
**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`

**Implementation**:
- Add `isHovered` state using `useState`
- Add `onMouseEnter` and `onMouseLeave` handlers to module `Group`
- Visual feedback: `opacity={isHovered ? 0.95 : 0.8}`, `stroke={isHovered ? '#0EA5E9' : strokeColor}`

**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx` or `useKonvaStage.ts`

**Cursor Management** (Fixed):
- Set cursor on Stage, not per-module
- Use `Stage.getIntersection()` to detect hovered shape
- Update cursor based on tool and hovered element:

```typescript
useEffect(() => {
  const stage = stageRef.current;
  if (!stage) return;

  const handleMouseMove = () => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const shape = stage.getIntersection(pointer);
    const container = stage.container();

    if (shape?.attrs.moduleId && currentTool === 'select') {
      container.style.cursor = 'pointer';
    } else if (currentTool === 'move') {
      container.style.cursor = 'grab';
    } else {
      container.style.cursor = 'default';
    }
  };

  stage.on('mousemove', handleMouseMove);
  return () => stage.off('mousemove', handleMouseMove);
}, [currentTool]);
```

### 2.2 Drag Preview
**File**: `frontend/src/features/map-editor/components/MapCanvas/DragPreviewLayer.tsx` (NEW)

**Better Approach**: Separate drag preview layer (non-interactive)

**Implementation**:
- Create new `DragPreviewLayer` component
- Render semi-transparent copies of dragged modules
- Position at drag position (not original position)
- Layer should be `listening={false}` to avoid hit detection issues

**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- Add `DragPreviewLayer` as separate `Layer` component
- Track drag state across layers:

```typescript
const [dragState, setDragState] = useState<{
  moduleId: string;
  offset: { x: number; y: number };
  currentPosition: { x: number; y: number };
} | null>(null);

// In ModulesLayer - on drag start:
onDragStart={(e) => {
  const moduleId = e.target.attrs.moduleId;
  const module = modules.find(m => m.id === moduleId);
  if (module) {
    setDragState({
      moduleId,
      offset: { x: e.target.x(), y: e.target.y() },
      currentPosition: { x: e.target.x(), y: e.target.y() },
    });
  }
}}

// In DragPreviewLayer:
{dragState && (
  <KonvaModuleRenderer
    module={getModule(dragState.moduleId)}
    x={dragState.currentPosition.x}
    y={dragState.currentPosition.y}
    opacity={0.5}
  />
)}
```

### 2.3 Selection Highlight Animation
**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`

**Implementation**:
- Use `Tween` to animate selection stroke properties
- Optional: Subtle pulse animation (only if not `prefers-reduced-motion`)

---

## 3. Accessibility Improvements

### 3.1 Canvas Accessibility Layer (CRITICAL FIX)
**File**: `frontend/src/features/map-editor/components/MapCanvas/AccessibilityLayer.tsx` (NEW)

**Problem**: Canvas content is invisible to screen readers. Need separate DOM layer.

**Solution**: Render invisible DOM elements for screen readers

**Implementation**:
```typescript
import React from 'react';
import type { AnyModule } from '@/types';

interface AccessibilityLayerProps {
  modules: AnyModule[];
  selectedIds: string[];
  focusedModuleId?: string;
}

// Helper to compare arrays
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

export const AccessibilityLayer: React.FC<AccessibilityLayerProps> = React.memo(({
  modules,
  selectedIds,
  focusedModuleId,
}) => {
  const generateAriaLabel = (module: AnyModule): string => {
    const type = module.type.replace('_', ' ');
    const name = module.metadata && 'name' in module.metadata 
      ? module.metadata.name 
      : 'Unnamed';
    const states = [];
    if (selectedIds.includes(module.id)) states.push('selected');
    if (module.locked) states.push('locked');
    if (!module.visible) states.push('hidden');
    
    return `Module: ${type} ${name}${states.length > 0 ? `, ${states.join(', ')}` : ''}`;
  };

  return (
    <div className="sr-only" role="list" aria-label="Map modules">
      {modules.map((module) => (
        <div
          key={module.id}
          role="listitem"
          aria-label={generateAriaLabel(module)}
          aria-selected={selectedIds.includes(module.id)}
          aria-current={focusedModuleId === module.id ? 'true' : undefined}
          tabIndex={-1} // Not directly focusable, managed programmatically
        />
      ))}
    </div>
  );
}, (prev, next) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prev.modules === next.modules &&
    arraysEqual(prev.selectedIds, next.selectedIds) &&
    prev.focusedModuleId === next.focusedModuleId
  );
});
```

**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- Render `AccessibilityLayer` alongside `Stage`
- Keep it in sync with visible modules

### 3.2 Keyboard Navigation Enhancement
**File**: `frontend/src/features/map-editor/hooks/useMapEditorShortcuts.ts`

**Fixed Approach**:
- Canvas is focusable with `tabIndex={0}` on Stage container
- Arrow keys navigate between modules programmatically (not Tab)
- Tab key moves focus to next UI element (toolbar, panels, etc.)
- Track `focusedModuleId` state
- Visual focus indicator rendered in Konva (not DOM focus ring)

**Implementation**:
- Add `focusedModuleId` state management
- Arrow keys: Move focus between modules (up/down/left/right)
- Enter/Space: Select focused module
- Escape: Clear selection and focus
- Tab: Move focus to next UI element (not between modules)

### 3.3 Focus Management
**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`

**Implementation**:
- Add `focusedModuleId` state
- Render focus indicator in Konva (dashed border or highlight) for focused module
- Update focus on arrow key navigation
- Ensure Stage container is focusable: `tabIndex={0}`

**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`
- Add `isFocused` prop
- Render focus indicator when `isFocused === true`:

```typescript
{isFocused && (
  <Rect
    x={-4} // Padding around module
    y={-4}
    width={width + 8}
    height={height + 8}
    stroke="#3B82F6"
    strokeWidth={2}
    dash={[5, 5]}
    listening={false} // Don't interfere with interactions
    perfectDrawEnabled={false}
  />
)}
```

### 3.4 Screen Reader Support
**File**: `frontend/src/features/map-editor/hooks/useScreenReaderAnnouncements.ts` (NEW)

**Implementation**:
- Use existing `useAnnounce` hook or `announce` utility from `@/utils/accessibility`
- **Debounce rapid announcements** to prevent spam
- Announce module selection changes, tool changes, viewport changes
- Use `aria-live="polite"` for non-critical updates

```typescript
import { useEffect, useMemo } from 'react';
import { announce } from '@/utils/accessibility';
import { debounce } from 'lodash'; // or custom debounce

export function useScreenReaderAnnouncements(
  selectedIds: string[],
  modules: AnyModule[],
  currentTool?: string
) {
  // Debounce announcements to prevent spam during rapid changes
  const debouncedAnnounce = useMemo(
    () => debounce((message: string) => announce(message), 300),
    []
  );

  useEffect(() => {
    if (selectedIds.length > 0) {
      const moduleNames = selectedIds
        .map(id => modules.find(m => m.id === id))
        .filter(Boolean)
        .map(m => m.metadata && 'name' in m.metadata ? m.metadata.name : 'Unnamed')
        .join(', ');
      
      debouncedAnnounce(
        `${selectedIds.length} module${selectedIds.length > 1 ? 's' : ''} selected: ${moduleNames}`
      );
    }
  }, [selectedIds, modules, debouncedAnnounce]);

  useEffect(() => {
    if (currentTool) {
      debouncedAnnounce(`Tool changed to ${currentTool}`);
    }
  }, [currentTool, debouncedAnnounce]);
}
```

**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- Use `useScreenReaderAnnouncements` hook
- Announce actions: "Module selected: {name}", "Tool changed to {tool}", etc.

### 3.5 Focus Trap for Dialogs
**File**: `frontend/src/features/map-editor/components/GridSettings/GridSettings.tsx`

**Implementation**:
- Use existing `FocusTrap` component
- Ensure Escape key closes modal and returns focus

---

## 4. Touch/Mobile Support

### 4.1 Touch Gesture Priority Rules
**Priority Order**:
1. **2+ fingers**: Pinch zoom (always, regardless of tool)
2. **1 finger + tool='move'**: Pan viewport
3. **1 finger + tool='select'**: Select/drag module (let Konva handle)
4. **3+ fingers**: Ignore or allow browser default

### 4.2 Touch Utilities Hook
**File**: `frontend/src/features/map-editor/hooks/useTouchGestures.ts` (NEW)

**Implementation**:
```typescript
import { useState, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';

interface TouchState {
  touches: Touch[];
  lastDistance?: number;
  isPinching: boolean;
}

export function useTouchGestures(
  onPinchZoom: (delta: number, center: { x: number; y: number }) => void,
  onPan: (delta: { x: number; y: number }) => void
) {
  const [touchState, setTouchState] = useState<TouchState>({
    touches: [],
    isPinching: false,
  });

  const handleTouchStart = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const touches = Array.from(e.evt.touches);
    
    if (touches.length > 1) {
      // Multi-touch: prevent default, handle pinch
      e.evt.preventDefault();
      
      const distance = calculateDistance(touches[0], touches[1]);
      setTouchState({
        touches,
        lastDistance: distance,
        isPinching: true,
      });
    } else if (touches.length === 1) {
      // Single touch: let Konva handle (don't preventDefault)
      setTouchState({
        touches,
        isPinching: false,
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const touches = Array.from(e.evt.touches);
    
    if (touches.length > 1 && touchState.isPinching) {
      // Pinch zoom
      e.evt.preventDefault();
      
      const distance = calculateDistance(touches[0], touches[1]);
      if (touchState.lastDistance !== undefined) {
        const delta = distance / touchState.lastDistance;
        const center = {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2,
        };
        onPinchZoom(delta, center);
      }
      
      setTouchState(prev => ({ ...prev, lastDistance: distance }));
    }
    // Single touch: let Konva handle naturally
  }, [touchState.isPinching, touchState.lastDistance, onPinchZoom]);

  const handleTouchEnd = useCallback((e: KonvaEventObject<TouchEvent>) => {
    const touches = Array.from(e.evt.touches);
    
    if (touches.length < 2) {
      setTouchState({
        touches,
        isPinching: false,
        lastDistance: undefined,
      });
    }
  }, []);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

function calculateDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// In handleTouchMove, add minimum threshold check:
const MIN_PINCH_DISTANCE = 10; // pixels
if (touchState.lastDistance !== undefined) {
  const distance = calculateDistance(touches[0], touches[1]);
  const delta = distance / touchState.lastDistance;
  
  // Ignore tiny movements to prevent jitter
  if (Math.abs(distance - touchState.lastDistance) < MIN_PINCH_DISTANCE) {
    return;
  }
  
  // ... rest of pinch zoom logic
}
```

### 4.3 Touch Event Handlers in MapCanvas
**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`

**Implementation**:
- Use `useTouchGestures` hook
- Add `onTouchStart`, `onTouchMove`, `onTouchEnd` to `Stage`
- **Critical**: Only `preventDefault()` for multi-touch (pinch zoom)
- Single touch: Let Konva's built-in drag handle it

### 4.4 Pinch Zoom Implementation
**File**: `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`

**Implementation**:
- Use `useTouchGestures` hook's `onPinchZoom` callback
- Calculate zoom delta from touch distance change
- **Critical**: Convert screen center to canvas coordinates before zooming
- Update viewport zoom based on pinch gesture
- Zoom to center point between two touches (in canvas coordinates)

```typescript
const handlePinchZoom = useCallback((delta: number, screenCenter: { x: number; y: number }) => {
  const stage = stageRef.current;
  if (!stage) return;

  // Convert screen center to canvas coordinates
  const oldScale = stage.scaleX();
  const newScale = Math.max(
    viewportService.getMinZoom(),
    Math.min(EDITOR_CONSTANTS.MAX_ZOOM, oldScale * delta)
  );

  // Get canvas position from screen center
  const mousePointTo = {
    x: (screenCenter.x - stage.x()) / oldScale,
    y: (screenCenter.y - stage.y()) / oldScale,
  };

  // Update stage transform
  stage.scale({ x: newScale, y: newScale });
  stage.position({
    x: screenCenter.x - mousePointTo.x * newScale,
    y: screenCenter.y - mousePointTo.y * newScale,
  });

  stage.batchDraw();
  
  // Update viewport service
  viewportService.setViewport({
    zoom: newScale,
    position: { x: stage.x(), y: stage.y() },
  });
}, [viewportService, stageRef]);
```

### 4.5 Touch Drag Support
**File**: `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`

**Implementation**:
- Konva's `draggable` prop already supports touch
- Ensure `onTap` handler works correctly
- Test touch drag on mobile devices
- No changes needed - Konva handles this automatically

---

## 5. Additional Enhancements

### 5.1 Rotation Handle for KonvaSelectionHandles
**File**: `frontend/src/features/map-editor/renderers/KonvaSelectionHandles.tsx`

**Implementation**:
- Add rotation handle above selected module(s) (similar to `RotationHandle.tsx`)
- Support rotation for single module selection only
- Position handle at `{ x: centerX, y: bounds.minY - 40 }`
- Handle rotation drag with snap angles (15° when Shift held)

### 5.2 Performance Optimization
- Ensure animations don't impact performance
- Use `requestAnimationFrame` for smooth animations (Konva handles this)
- Skip animations for modules outside viewport
- Debounce rapid state changes if needed

---

## Implementation Order (Revised)

1. **Visual Feedback (Hover States)** - Quick win, improves UX immediately
2. **Animation Utility Hook** - Foundation for all animations
3. **Module Movement Animations** - Core UX improvement (with performance guards)
4. **Touch Support** - Expands device compatibility (with conflict resolution)
5. **Accessibility Layer** - Critical for compliance (Canvas accessibility)
6. **Keyboard Navigation & Focus Management** - Completes accessibility
7. **Screen Reader Support** - Final accessibility polish
8. **Rotation Handle** - Completes transform functionality
9. **Drag Preview Layer** - Visual feedback enhancement

---

## Testing Considerations

- **Animations**: Test with `prefers-reduced-motion: reduce` enabled
- **Performance**: Test with many modules (100+) and verify animations don't lag
- **Touch**: Test on actual mobile devices (iOS Safari, Android Chrome)
- **Accessibility**: Test with screen readers (NVDA, JAWS, VoiceOver)
- **Keyboard**: Test Tab navigation, arrow keys, Enter/Space/Escape
- **Gesture Conflicts**: Verify pinch zoom doesn't interfere with module drag

---

## Type Definitions

### KonvaModuleRendererProps Updates
```typescript
interface KonvaModuleRendererProps {
  module: AnyModule;
  props: RenderProps;
  // New props:
  shouldAnimate?: boolean; // Only animate user-initiated moves
  isFocused?: boolean; // Keyboard focus indicator
}
```

### AnimationOptions Interface
```typescript
interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  skipIfReducedMotion?: boolean;
  skipIfOutsideViewport?: boolean;
  stageRef?: React.RefObject<Konva.Stage>;
}
```

### TouchState Interface
```typescript
interface TouchState {
  touches: Touch[];
  lastDistance?: number;
  isPinching: boolean;
}
```

---

## Utility Functions

### `frontend/src/utils/accessibility.ts`
- ✅ `prefersReducedMotion()` - Already exists
- ✅ `announce()` - Already exists

### Additional Utilities Needed
- Array comparison helper for `AccessibilityLayer` memoization
- Debounce utility (or use lodash)

---

## Files to Create/Modify

### New Files
- `frontend/src/features/map-editor/hooks/useKonvaAnimation.ts`
- `frontend/src/features/map-editor/hooks/useTouchGestures.ts`
- `frontend/src/features/map-editor/hooks/useScreenReaderAnnouncements.ts`
- `frontend/src/features/map-editor/components/MapCanvas/AccessibilityLayer.tsx`
- `frontend/src/features/map-editor/components/MapCanvas/DragPreviewLayer.tsx`

### Modified Files
- `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx`
- `frontend/src/features/map-editor/renderers/KonvaSelectionHandles.tsx`
- `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- `frontend/src/features/map-editor/hooks/useKonvaStage.ts` (cursor management)
- `frontend/src/features/map-editor/hooks/useMapEditorShortcuts.ts`
- `frontend/src/features/map-editor/components/GridSettings/GridSettings.tsx`

---

## Estimated Time (Revised)

- Visual Feedback: 2-3 hours
- Animation Utility Hook: 2-3 hours
- Module Movement Animations: 2-3 hours
- Touch Support: 4-5 hours (includes conflict resolution)
- Accessibility Layer: 3-4 hours (critical fix)
- Keyboard Navigation & Focus: 3-4 hours
- Screen Reader Support: 2-3 hours
- Rotation Handle: 2-3 hours
- Drag Preview Layer: 2-3 hours
- **Total: 22-31 hours**

---

## Critical Notes

1. **Canvas Accessibility**: Cannot use ARIA labels directly on canvas shapes. Must use separate DOM layer.
2. **Animation Performance**: Only animate user-initiated actions, respect `prefers-reduced-motion`.
3. **Touch Gestures**: Selective `preventDefault()` - only for multi-touch (pinch zoom).
4. **Keyboard Navigation**: Arrow keys navigate modules, Tab navigates UI elements.
5. **Focus Management**: Visual focus indicator rendered in Konva, not DOM focus ring.
6. **Animation Dependencies**: Destructure `targetProps` to stabilize useEffect dependencies.
7. **Viewport Culling**: Check if module is in viewport before animating.
8. **Touch Precision**: Add minimum threshold to prevent jitter in pinch zoom.
9. **Accessibility Performance**: Memoize `AccessibilityLayer` to prevent unnecessary re-renders.
10. **Announcement Debouncing**: Debounce screen reader announcements to prevent spam.

## Implementation Refinements

### Animation Hook Dependencies
- Destructure `targetProps` outside useEffect to stabilize dependencies
- Track previous values with refs to only animate on actual changes
- Check viewport bounds before animating

### Touch Gesture Precision
- Add `MIN_PINCH_DISTANCE` threshold (10px) to prevent jitter
- Convert screen coordinates to canvas coordinates for pinch zoom center

### Accessibility Performance
- Use `React.memo` with custom comparison for `AccessibilityLayer`
- Debounce screen reader announcements (300ms)

### Drag Preview Sync
- Track drag state across layers (ModulesLayer → DragPreviewLayer)
- Use shared state in MapCanvas to coordinate drag preview rendering

