# Konva.js Migration Plan

## Overview
Replace the SVG-based map canvas with a Konva.js implementation while maintaining the service-based architecture, improving the event bus robustness, and applying UI/UX best practices.

---

## 1. Event Bus Enhancements

### Current State
- Basic event bus with type safety
- Error handling in handlers
- Event history tracking
- One-time listeners support

### Enhancements Needed

#### 1.1 Error Handling & Recovery
- **Error Boundaries**: Wrap handlers in try-catch with recovery strategies
- **Error Logging**: Integrate with error logger service
- **Dead Letter Queue**: Store failed events for debugging
- **Retry Mechanism**: Optional retry for critical events

#### 1.2 Performance Optimizations
- **Event Batching**: Batch multiple rapid events (e.g., viewport changes)
- **Debouncing**: Debounce high-frequency events (zoom, pan)
- **Priority Queue**: Process critical events first
- **Listener Limits**: Prevent memory leaks with max listeners per event

#### 1.3 Developer Experience
- **Event Debugging**: Dev mode event inspector
- **Event Tracing**: Track event flow for debugging
- **Performance Metrics**: Track event processing times
- **Type Safety**: Enhanced TypeScript inference

#### 1.4 Lifecycle Management
- **Event Scoping**: Scope events to map instances
- **Cleanup Hooks**: Automatic cleanup on unmount
- **Memory Management**: Weak references for listeners
- **Subscription Validation**: Warn about potential memory leaks

---

## 2. Architecture Overview

### 2.1 Component Hierarchy
```
MapEditor (Provider)
└── MapCanvas (Konva Stage)
    ├── BackgroundLayer (Konva Image)
    ├── GridLayer (Konva Shapes)
    └── ModulesLayer (Konva Groups)
        └── KonvaRenderer (renders modules)
```

### 2.2 Service Layer (Preserved)
- **MapService**: Map and module CRUD operations
- **EditorService**: Selection, tools, UI preferences
- **ViewportService**: Zoom, pan, viewport operations
- **ValidationService**: Module validation
- **HistoryService**: Undo/redo operations

### 2.3 Event Flow
```
User Action → Component → Service → Event Bus → Subscribers
```

### 2.4 Renderer Pattern
- **IRenderer Interface**: Abstract rendering contract
- **SVGRenderer**: Existing SVG implementation
- **KonvaRenderer**: New Konva implementation
- **RendererFactory**: Creates appropriate renderer

---

## 3. File Structure

### 3.1 New Files
```
features/map-editor/
├── infrastructure/
│   ├── EventBus.ts (enhanced)
│   └── EventBusDebugger.ts (new - dev only)
├── renderers/
│   ├── KonvaRenderer.tsx (new)
│   ├── KonvaModuleRenderer.tsx (new)
│   ├── KonvaGridRenderer.tsx (new)
│   └── RendererFactory.ts (updated)
├── components/
│   └── MapCanvas/
│       ├── MapCanvas.tsx (rewrite - Konva Stage)
│       ├── BackgroundLayer.tsx (rewrite - Konva Image)
│       ├── GridLayer.tsx (rewrite - Konva Shapes)
│       └── ModulesLayer.tsx (rewrite - Konva Groups)
└── hooks/
    └── useKonvaStage.ts (new - stage management)
```

### 3.2 Updated Files
```
features/map-editor/
├── context/
│   └── MapEditorContext.tsx (add Konva renderer option)
├── core/
│   └── events.ts (add Konva-specific events if needed)
└── components/
    └── ModuleRenderer/
        └── ModuleShapes.tsx (reference for Konva shapes)
```

---

## 4. Implementation Steps

### Phase 1: Event Bus Enhancement
1. ✅ Enhance EventBus with:
   - Error recovery mechanisms
   - Event batching/debouncing
   - Performance monitoring
   - Developer debugging tools
   - Memory leak prevention

### Phase 2: KonvaRenderer Implementation
2. ✅ Create KonvaRenderer class implementing IRenderer
3. ✅ Implement module rendering (shapes, icons, labels)
4. ✅ Implement grid rendering
5. ✅ Implement background rendering
6. ✅ Implement selection handles rendering

### Phase 3: Layer Components
7. ✅ Rewrite BackgroundLayer with Konva Image
8. ✅ Rewrite GridLayer with Konva shapes
9. ✅ Rewrite ModulesLayer with Konva Groups
10. ✅ Create useKonvaStage hook for stage management

### Phase 4: MapCanvas Integration
11. ✅ Rewrite MapCanvas to use Konva Stage
12. ✅ Integrate viewport service with Konva transforms
13. ✅ Implement pan/zoom with Konva
14. ✅ Integrate drag & drop from module library
15. ✅ Add selection handling
16. ✅ Add transform handles (rotate, scale)

### Phase 5: UI/UX Enhancements
17. ✅ Smooth animations for module movements
18. ✅ Visual feedback (hover states, drag previews)
19. ✅ Performance optimizations (viewport culling)
20. ✅ Accessibility improvements (ARIA labels, keyboard nav)
21. ✅ Touch/mobile support

### Phase 6: Testing & Polish
22. ✅ Unit tests for KonvaRenderer
23. ✅ Integration tests for MapCanvas
24. ✅ Performance testing
25. ✅ Accessibility audit
26. ✅ Documentation

---

## 5. UI/UX Design Principles

### 5.1 Visual Feedback
- **Hover States**: Highlight modules on hover
- **Drag Preview**: Show ghost/preview during drag
- **Selection Animation**: Smooth selection highlight
- **Transform Handles**: Clear, visible handles
- **Loading States**: Skeleton/loading for background image

### 5.2 Performance
- **Viewport Culling**: Only render visible modules
- **Object Pooling**: Reuse Konva nodes when possible
- **Lazy Loading**: Load modules as they enter viewport
- **Debounced Updates**: Debounce rapid state changes
- **Canvas Optimization**: Use Konva caching for static elements

### 5.3 Accessibility
- **Keyboard Navigation**: Arrow keys, Tab navigation
- **Screen Reader Support**: ARIA labels, live regions
- **Focus Management**: Visible focus indicators
- **Keyboard Shortcuts**: Documented shortcuts
- **High Contrast**: Support for high contrast mode

### 5.4 User Experience
- **Smooth Interactions**: 60fps animations
- **Responsive Design**: Works on different screen sizes
- **Touch Support**: Pinch zoom, drag gestures
- **Error Handling**: Clear error messages
- **Undo/Redo**: Visual feedback for history

---

## 6. Technical Specifications

### 6.1 Konva Stage Configuration
```typescript
{
  width: containerWidth,
  height: containerHeight,
  scaleX: viewport.zoom,
  scaleY: viewport.zoom,
  x: viewport.position.x,
  y: viewport.position.y,
  draggable: currentTool === 'move',
  listening: true,
}
```

### 6.2 Module Rendering
- Use Konva Group for each module
- Apply transforms (position, rotation, scale)
- Render shape based on module type
- Add icon/text label
- Handle selection state
- Handle validation errors

### 6.3 Grid Rendering
- Use Konva Line shapes
- Cache grid pattern
- Toggle visibility based on editor state
- Update on zoom changes

### 6.4 Background Rendering
- Use Konva Image
- Load image asynchronously
- Handle loading/error states
- Cache image for performance

### 6.5 Selection Handles
- Render bounding box for multi-select
- Render transform handles for single select
- Handle drag, resize, rotate interactions
- Snap to grid when enabled

---

## 7. Event Bus Robustness Features

### 7.1 Error Handling
```typescript
interface EventBusConfig {
  maxRetries?: number;
  retryDelay?: number;
  errorHandler?: (error: Error, event: string) => void;
  deadLetterQueue?: boolean;
}
```

### 7.2 Performance
```typescript
interface EventBusConfig {
  batchInterval?: number; // Batch events within interval
  debounceDelay?: number; // Debounce high-frequency events
  maxListeners?: number; // Prevent memory leaks
  priorityQueue?: boolean; // Process critical events first
}
```

### 7.3 Debugging
```typescript
interface EventBusDebugger {
  getEventHistory(): EventHistory[];
  getListenerCount(event: string): number;
  getPerformanceMetrics(): PerformanceMetrics;
  enableTracing(): void;
  disableTracing(): void;
}
```

---

## 8. Migration Strategy

### 8.1 Backward Compatibility
- Keep SVGRenderer for fallback
- Feature flag to switch renderers
- Gradual migration path

### 8.2 Testing Strategy
- Unit tests for each component
- Integration tests for full flow
- Visual regression tests
- Performance benchmarks

### 8.3 Rollout Plan
1. Implement alongside SVG (feature flag)
2. Test with real data
3. Performance comparison
4. Gradual rollout to users
5. Remove SVG once stable

---

## 9. Success Criteria

### 9.1 Functional
- ✅ All existing features work
- ✅ No regression in functionality
- ✅ Performance equal or better
- ✅ Accessibility maintained/improved

### 9.2 Technical
- ✅ Loosely coupled architecture
- ✅ Robust event bus
- ✅ Clean code structure
- ✅ Comprehensive tests
- ✅ Good documentation

### 9.3 User Experience
- ✅ Smooth interactions
- ✅ Clear visual feedback
- ✅ Intuitive controls
- ✅ Responsive design
- ✅ Accessible interface

---

## 10. Risk Mitigation

### 10.1 Performance Risks
- **Risk**: Konva performance with many modules
- **Mitigation**: Viewport culling, object pooling, caching

### 10.2 Compatibility Risks
- **Risk**: Browser compatibility issues
- **Mitigation**: Test on multiple browsers, polyfills if needed

### 10.3 Migration Risks
- **Risk**: Breaking existing functionality
- **Mitigation**: Feature flag, gradual rollout, comprehensive testing

---

## Next Steps

1. Review and approve this plan
2. Start Phase 1: Event Bus Enhancement
3. Implement Phase 2: KonvaRenderer
4. Continue with remaining phases
5. Test and iterate

