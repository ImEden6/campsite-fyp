# Next Steps: Konva.js Migration

## Current Status Summary

### ✅ Completed
- **Phase 1-3**: Event Bus, KonvaRenderer, Layer Components - Complete
- **Phase 4**: MapCanvas Integration - 90% complete
  - ✅ Rotation handle IS implemented in `KonvaSelectionHandles.tsx`
  - ✅ Transform handles working
- **Phase 5**: UI/UX Enhancements - 85% complete
  - ✅ Hover states implemented in `KonvaModuleRenderer.tsx`
  - ✅ Performance optimizations (viewport culling, caching)
  - ✅ **Accessibility layer complete** - Full keyboard navigation, screen reader support, ARIA labels
  - ✅ **Smooth animations complete** - User-initiated animations with proper cleanup and validation
  - ⚠️ Touch/mobile support - Needs testing
- **Phase 6**: Testing - 60% complete
  - ✅ **KonvaSelectionHandles.test.tsx** - Rendering, resize, rotation tests
  - ✅ **useKonvaStage.test.ts** - Stage management, viewport, coordinate conversion tests
  - ✅ **MapCanvas.integration.test.tsx** - Full workflow integration tests

## Next Priority Steps

### 🔴 High Priority (Immediate)

### 🟡 Medium Priority (Next Sprint)

#### 1. **Performance Testing & Optimization** (Phase 6) — **NEXT PRIORITY**
**Why**: Ensure good performance with many modules, identify bottlenecks

**What to do**:
- Create performance testing utilities
- Benchmark rendering performance with varying module counts (10, 50, 100, 200, 500)
- Measure frame rates during interactions (drag, pan, zoom)
- Compare Konva renderer with SVG renderer (if available)
- Test viewport culling effectiveness
- Identify and optimize bottlenecks
- Create performance regression tests

**Files to create**:
- `frontend/src/features/map-editor/utils/performanceBenchmark.ts` (performance utilities)
- `frontend/src/features/map-editor/__tests__/performance/rendering.performance.test.tsx` (benchmark tests)
- `frontend/src/features/map-editor/utils/frameRateMonitor.ts` (FPS monitoring)

**Estimated effort**: 4-6 hours

#### 2. **Touch/Mobile Support** (Phase 5)
**Why**: Important for mobile users, but not blocking

**What to do**:
- Add touch event handlers to Stage
- Implement pinch zoom
- Test on mobile devices
- Handle gesture conflicts properly

**Files to modify**:
- `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- `frontend/src/features/map-editor/hooks/useKonvaStage.ts`

**Estimated effort**: 4-6 hours

#### 3. **Documentation** (Phase 6)
**Why**: Important for maintenance and onboarding

**What to do**:
- API documentation (JSDoc comments)
- Usage examples
- Performance best practices
- Migration guide (SVG → Konva)

**Estimated effort**: 4-6 hours

### 🟢 Low Priority (Future)

#### 7. **Visual Feedback Enhancements**
- Drag preview/ghost during drag
- Better selection animations
- Loading states for background image

#### 8. **Advanced Features**
- Multi-select box selection
- Group operations UI
- Keyboard shortcuts for transforms

---

## Recommended Order

1. ✅ **Accessibility** - **COMPLETE** (Full keyboard navigation, screen reader support)
2. ✅ **Enhance Animations** - **COMPLETE** (User-initiated animations with proper cleanup)
3. ✅ **Test Coverage** - **COMPLETE** (Core tests added: KonvaSelectionHandles, useKonvaStage, MapCanvas integration)
4. **Performance Testing** (Optimize if needed) — **NEXT**
5. **Touch Support** (Mobile users)
6. **Documentation** (Maintenance)

---

## Quick Wins (Can be done immediately)

1. ✅ **Add `prefers-reduced-motion` check to animations** - **COMPLETE** (Already in `useKonvaAnimation`)

2. **Add JSDoc comments to renderer methods**
   - Quick: 2-3 hours
   - High value: Better developer experience

3. ✅ **Add unit test for `KonvaSelectionHandles` rotation** - **COMPLETE** (Included in `KonvaSelectionHandles.test.tsx`)

---

## Notes

- The migration is **functional** - core features work
- Rotation handle **IS implemented** (contrary to review doc)
- Hover states **ARE implemented** (contrary to review doc)
- ✅ **Accessibility layer is complete** - Full implementation in `AccessibilityLayer.tsx`
- ✅ **Test coverage expanded** - Three comprehensive test files added
- ✅ **Smooth animations complete** - User-initiated animations with validation and cleanup
- Current renderer is set to `'konva'` in `MapEditorContext.tsx`

## Recent Completions

### Accessibility Layer (`AccessibilityLayer.tsx`)
- ✅ Keyboard navigation (Arrow keys, Enter/Space, Tab)
- ✅ Screen reader support with ARIA labels and live regions
- ✅ Focus management for modules
- ✅ Click handlers synced with canvas
- ✅ Detailed module descriptions (position, size, state)
- ✅ Integrated with `MapCanvas.tsx`

### Test Coverage
- ✅ **KonvaSelectionHandles.test.tsx**: Rendering, resize, rotation, edge cases
- ✅ **useKonvaStage.test.ts**: Initialization, viewport, coordinate conversion, edge cases
- ✅ **MapCanvas.integration.test.tsx**: Full workflows, selection, transforms, accessibility

### Smooth Animations
- ✅ **useKonvaAnimation.ts**: Enhanced with user-initiated flag, validation, and proper cleanup
- ✅ **KonvaModuleRenderer.tsx**: Integrated animations for user-initiated moves
- ✅ **ModulesLayer.tsx**: Animation tracking with memory leak prevention
- ✅ **Type safety**: Improved width/height handling with setAttr
- ✅ **Code quality**: Extracted duplicate code, added validation

---

## Questions to Consider

1. **Should we keep SVG renderer as fallback?**
   - Currently: Yes (feature flag support)
   - Decision: Remove once Konva is fully tested?

2. ✅ **Accessibility approach:** - **IMPLEMENTED**
   - ✅ Option A: Separate DOM layer (implemented in `AccessibilityLayer.tsx`)

3. **Animation strategy:**
   - Option A: Animate everything (smooth but potentially slow)
   - Option B: Only user-initiated actions (recommended)
   - Option C: Configurable per action

