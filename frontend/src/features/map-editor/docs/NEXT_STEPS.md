# Next Steps: Konva.js Migration

## Current Status Summary

### ✅ Completed
- **Phase 1-3**: Event Bus, KonvaRenderer, Layer Components - Complete
- **Phase 4**: MapCanvas Integration - 90% complete
  - ✅ Rotation handle IS implemented in `KonvaSelectionHandles.tsx`
  - ✅ Transform handles working
- **Phase 5**: UI/UX Enhancements - 60% complete
  - ✅ Hover states implemented in `KonvaModuleRenderer.tsx`
  - ✅ Performance optimizations (viewport culling, caching)
  - ⚠️ Smooth animations - Partially implemented
  - ⚠️ Accessibility - Needs work
  - ⚠️ Touch/mobile support - Needs testing
- **Phase 6**: Testing - Some tests exist but need expansion

## Next Priority Steps

### 🔴 High Priority (Immediate)

#### 1. **Accessibility Layer Implementation** (Phase 5)
**Why**: Canvas elements are invisible to screen readers - critical for accessibility compliance

**What to do**:
- Create a separate DOM accessibility layer that mirrors canvas content
- Add ARIA labels and keyboard navigation
- Implement focus management for modules
- Test with screen readers

**Files to create/modify**:
- `frontend/src/features/map-editor/components/MapCanvas/AccessibilityLayer.tsx` (NEW)
- Update `MapCanvas.tsx` to include accessibility layer

**Estimated effort**: 6-8 hours

#### 2. **Smooth Animations Enhancement** (Phase 5)
**Why**: Better UX, professional feel, but needs to respect `prefers-reduced-motion`

**What to do**:
- Enhance `useKonvaAnimation` hook to:
  - Respect `prefers-reduced-motion` preference
  - Only animate user-initiated actions (not programmatic changes)
  - Skip animations for modules outside viewport
- Add animations for:
  - Module movements (drag operations)
  - Selection changes
  - Transform operations (resize, rotate)

**Files to modify**:
- `frontend/src/features/map-editor/hooks/useKonvaAnimation.ts` (enhance existing)
- `frontend/src/features/map-editor/renderers/KonvaModuleRenderer.tsx` (add animation calls)

**Estimated effort**: 4-6 hours

#### 3. **Expand Test Coverage** (Phase 6)
**Why**: Critical for preventing regressions and ensuring stability

**What to do**:
- Add unit tests for:
  - `KonvaGridRenderer` (if not exists)
  - `KonvaSelectionHandles` (rotation, resize)
  - `useKonvaStage` hook
- Add integration tests for:
  - Full MapCanvas workflows
  - Transform operations (resize, rotate)
  - Multi-module operations

**Files to create**:
- `frontend/src/features/map-editor/renderers/__tests__/KonvaGridRenderer.test.tsx`
- `frontend/src/features/map-editor/renderers/__tests__/KonvaSelectionHandles.test.tsx`
- `frontend/src/features/map-editor/hooks/__tests__/useKonvaStage.test.ts`
- `frontend/src/features/map-editor/components/MapCanvas/__tests__/MapCanvas.integration.test.tsx`

**Estimated effort**: 8-12 hours

### 🟡 Medium Priority (Next Sprint)

#### 4. **Touch/Mobile Support** (Phase 5)
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

#### 5. **Performance Testing & Optimization** (Phase 6)
**Why**: Ensure good performance with many modules

**What to do**:
- Benchmark rendering performance
- Test with 100+ modules
- Compare with SVG renderer
- Measure frame rates
- Optimize if needed

**Estimated effort**: 4-6 hours

#### 6. **Documentation** (Phase 6)
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

1. **Start with Accessibility** (High impact, compliance requirement)
2. **Enhance Animations** (Better UX, relatively quick)
3. **Expand Tests** (Prevent regressions, ensure stability)
4. **Touch Support** (Mobile users)
5. **Performance Testing** (Optimize if needed)
6. **Documentation** (Maintenance)

---

## Quick Wins (Can be done immediately)

1. **Add `prefers-reduced-motion` check to animations**
   - Quick: 1-2 hours
   - High impact: Accessibility compliance

2. **Add JSDoc comments to renderer methods**
   - Quick: 2-3 hours
   - High value: Better developer experience

3. **Add unit test for `KonvaSelectionHandles` rotation**
   - Quick: 2-3 hours
   - High value: Prevents regressions

---

## Notes

- The migration is **functional** - core features work
- Rotation handle **IS implemented** (contrary to review doc)
- Hover states **ARE implemented** (contrary to review doc)
- Main gaps are: **Accessibility**, **Animations**, **Tests**
- Current renderer is set to `'konva'` in `MapEditorContext.tsx`

---

## Questions to Consider

1. **Should we keep SVG renderer as fallback?**
   - Currently: Yes (feature flag support)
   - Decision: Remove once Konva is fully tested?

2. **Accessibility approach:**
   - Option A: Separate DOM layer (recommended)
   - Option B: Use Konva's `ariaLabel` (limited support)
   - Option C: Hybrid approach

3. **Animation strategy:**
   - Option A: Animate everything (smooth but potentially slow)
   - Option B: Only user-initiated actions (recommended)
   - Option C: Configurable per action

