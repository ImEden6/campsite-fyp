# Phase 4 Implementation Plan: Viewport & Grid Enhancements

## Overview
This document outlines the implementation plan for Phase 4 requirements: zoom constraints, user-defined grid size, size presets, and image-based boundaries.

---

## Requirement 1: Zoom Constraints

### Goal
Prevent users from zooming out beyond grid boundaries. The minimum zoom should be calculated based on grid size and container size.

### Current State
- `ViewportService` uses fixed `MIN_ZOOM` constant (0.1)
- No dynamic minimum zoom calculation
- No awareness of grid boundaries

### Implementation Plan

#### 1.1 Update ViewportService Interface
```typescript
// Add to IViewportService
setMinZoom(minZoom: number): void;
getMinZoom(): number;
calculateMinZoom(gridSize: ViewportBounds, containerSize: ViewportBounds): number;
```

#### 1.2 Update ViewportService Implementation
- Add `minZoom` property (defaults to `EDITOR_CONSTANTS.MIN_ZOOM`)
- Add `setMinZoom()` method
- Add `calculateMinZoom()` method:
  ```typescript
  calculateMinZoom(gridSize: ViewportBounds, containerSize: ViewportBounds): number {
    // Calculate minimum zoom to fit grid in container
    const scaleX = containerSize.width / gridSize.width;
    const scaleY = containerSize.height / gridSize.height;
    return Math.min(scaleX, scaleY);
  }
  ```
- Update `setViewport()` to use dynamic `minZoom`:
  ```typescript
  newViewport.zoom = Math.max(
    this.minZoom, // Use dynamic minZoom instead of constant
    Math.min(EDITOR_CONSTANTS.MAX_ZOOM, newViewport.zoom)
  );
  ```

#### 1.3 Update MapCanvas Component
- Calculate min zoom when map loads or container resizes
- Call `viewportService.setMinZoom()` with calculated value
- Recalculate on:
  - Map load
  - Container resize
  - Grid size change

#### 1.4 Files to Modify
- `frontend/src/features/map-editor/services/ViewportService.ts`
- `frontend/src/features/map-editor/components/MapCanvas/MapCanvas.tsx`
- `frontend/src/features/map-editor/core/services.ts` (interface update)

### Testing
- Verify zoom cannot go below grid boundaries
- Verify zoom constraints update when container resizes
- Verify zoom constraints update when grid size changes
- Test edge cases (very large/small grids)

---

## Requirement 2: User-Defined Grid Size

### Goal
Allow users to set custom grid dimensions (width and height) that determine the total canvas size.

### Current State
- Grid size is stored in `EditorService` as a single `gridSize` number (spacing between grid lines)
- Map has `imageSize` property but no explicit grid bounds
- Grid rendering uses `imageSize` for bounds

### Implementation Plan

#### 2.1 Update Map Type
```typescript
// Add to CampsiteMap interface
interface CampsiteMap {
  // ... existing properties
  gridBounds?: {
    width: number;
    height: number;
  };
}
```

#### 2.2 Update EditorService
- Add `gridBounds` to state:
  ```typescript
  interface EditorState {
    // ... existing properties
    gridBounds: { width: number; height: number };
  }
  ```
- Add methods:
  ```typescript
  getGridBounds(): { width: number; height: number };
  setGridBounds(bounds: { width: number; height: number }): void;
  ```

#### 2.3 Create Grid Settings UI Component
- New component: `GridSettingsPanel.tsx`
- Inputs for:
  - Grid width (pixels)
  - Grid height (pixels)
  - Grid spacing (existing `gridSize`)
- Validation:
  - Minimum size constraints
  - Maximum size constraints
  - Positive numbers only

#### 2.4 Update Grid Rendering
- `GridLayer` should use `gridBounds` instead of `imageSize`
- Fallback to `imageSize` if `gridBounds` not set (backward compatibility)

#### 2.5 Files to Create/Modify
- **Create**: `frontend/src/features/map-editor/components/GridSettings/GridSettingsPanel.tsx`
- **Modify**: 
  - `frontend/src/features/map-editor/services/EditorService.ts`
  - `frontend/src/features/map-editor/components/MapCanvas/GridLayer.tsx`
  - `frontend/src/types/index.ts` (Map interface)
  - `frontend/src/features/map-editor/core/services.ts` (interface update)

### Testing
- Verify grid bounds can be set and persisted
- Verify grid renders correctly with custom bounds
- Verify backward compatibility (maps without gridBounds)
- Verify validation works correctly

---

## Requirement 3: Size Presets

### Goal
Add preset options for common grid sizes (A4, Letter, Custom) with easy selection UI.

### Implementation Plan

#### 3.1 Define Presets
```typescript
// constants/gridPresets.ts
export const GRID_PRESETS = {
  A4: {
    name: 'A4',
    width: 2100, // 210mm at 10px/mm
    height: 2970, // 297mm at 10px/mm
    description: 'A4 Paper (210 × 297 mm)',
  },
  LETTER: {
    name: 'Letter',
    width: 2159, // 8.5" at 254px/inch
    height: 2794, // 11" at 254px/inch
    description: 'US Letter (8.5 × 11 inches)',
  },
  A3: {
    name: 'A3',
    width: 2970,
    height: 4200,
    description: 'A3 Paper (297 × 420 mm)',
  },
  CUSTOM: {
    name: 'Custom',
    width: 0,
    height: 0,
    description: 'Custom dimensions',
  },
} as const;
```

#### 3.2 Update Grid Settings UI
- Add preset selector (dropdown/radio buttons)
- When preset selected:
  - Auto-fill width/height inputs
  - Disable inputs if not Custom
- Show preset description

#### 3.3 Preset Selection Logic
```typescript
const handlePresetChange = (preset: keyof typeof GRID_PRESETS) => {
  if (preset === 'CUSTOM') {
    // Enable custom inputs
    setIsCustom(true);
  } else {
    // Apply preset dimensions
    const presetData = GRID_PRESETS[preset];
    setGridBounds({ width: presetData.width, height: presetData.height });
    setIsCustom(false);
  }
};
```

#### 3.4 Files to Create/Modify
- **Create**: `frontend/src/constants/gridPresets.ts`
- **Modify**: `frontend/src/features/map-editor/components/GridSettings/GridSettingsPanel.tsx`

### Testing
- Verify presets apply correct dimensions
- Verify custom mode allows manual input
- Verify preset selection persists
- Test all preset options

---

## Requirement 4: Image-Based Boundaries

### Goal
When an image is uploaded, automatically detect its dimensions and set grid boundaries to match.

### Current State
- Image upload exists in `MapsListPage.tsx`
- Image dimensions are hardcoded: `imageSize: { width: 1920, height: 1080 }`
- No automatic dimension detection

### Implementation Plan

#### 4.1 Create Image Dimension Detection Utility
```typescript
// utils/imageUtils.ts
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

#### 4.2 Update Map Creation Flow
- In `MapsListPage.tsx`:
  1. When image is uploaded, detect dimensions
  2. Set `imageSize` to detected dimensions
  3. Set `gridBounds` to match `imageSize` (or make it optional)
  4. Update map creation to use detected size

#### 4.3 Update Image Upload Handler
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setImageFile(file);
    
    // Detect image dimensions
    try {
      const dimensions = await getImageDimensions(file);
      setDetectedImageSize(dimensions);
      
      // Update preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to detect image dimensions:', error);
      // Fallback to default size
      setDetectedImageSize({ width: 1920, height: 1080 });
    }
  }
};
```

#### 4.4 Update Map Creation
```typescript
const handleCreateMap = () => {
  const newMap: CampsiteMap = {
    // ... other properties
    imageUrl: imagePreview || '/placeholder-map.jpg',
    imageSize: detectedImageSize || { width: 1920, height: 1080 },
    gridBounds: detectedImageSize ? {
      width: detectedImageSize.width,
      height: detectedImageSize.height,
    } : undefined,
    // ... rest of map
  };
};
```

#### 4.5 Files to Create/Modify
- **Create**: `frontend/src/utils/imageUtils.ts`
- **Modify**: 
  - `frontend/src/pages/MapsListPage.tsx`
  - `frontend/src/types/index.ts` (if needed)

### Testing
- Verify image dimensions are detected correctly
- Verify grid bounds match image size
- Test with various image formats (JPG, PNG, WebP)
- Test with very large/small images
- Test error handling (invalid image files)

---

## Implementation Order

### Phase 4.1: Image-Based Boundaries (Easiest)
1. Create image dimension detection utility
2. Update map creation flow
3. Test with various images

**Estimated Time**: 2-3 hours

### Phase 4.2: User-Defined Grid Size (Foundation)
1. Update Map type and EditorService
2. Create GridSettingsPanel component
3. Update GridLayer to use gridBounds
4. Test grid rendering

**Estimated Time**: 4-6 hours

### Phase 4.3: Size Presets (Enhancement)
1. Create presets constants
2. Add preset selector to GridSettingsPanel
3. Implement preset selection logic
4. Test all presets

**Estimated Time**: 2-3 hours

### Phase 4.4: Zoom Constraints (Most Complex)
1. Update ViewportService interface and implementation
2. Add min zoom calculation
3. Update MapCanvas to calculate and set min zoom
4. Test zoom constraints

**Estimated Time**: 3-4 hours

**Total Estimated Time**: 11-16 hours

---

## Dependencies

### Between Requirements
- **Requirement 2** (User-Defined Grid Size) should be done before **Requirement 1** (Zoom Constraints) because zoom constraints need grid bounds
- **Requirement 4** (Image-Based Boundaries) can be done independently
- **Requirement 3** (Size Presets) depends on **Requirement 2** (needs grid bounds UI)

### Recommended Order
1. **Requirement 4**: Image-Based Boundaries (independent, quick win)
2. **Requirement 2**: User-Defined Grid Size (foundation)
3. **Requirement 3**: Size Presets (enhancement of #2)
4. **Requirement 1**: Zoom Constraints (depends on #2)

---

## Success Criteria

### Requirement 1: Zoom Constraints ✅
- [ ] Cannot zoom out beyond grid boundaries
- [ ] Min zoom updates when container resizes
- [ ] Min zoom updates when grid size changes
- [ ] Works correctly with all grid sizes

### Requirement 2: User-Defined Grid Size ✅
- [ ] Users can set custom grid width and height
- [ ] Grid bounds are persisted with map
- [ ] Grid renders correctly with custom bounds
- [ ] Backward compatible with existing maps

### Requirement 3: Size Presets ✅
- [ ] All presets (A4, Letter, A3, Custom) work correctly
- [ ] Preset selection updates grid bounds
- [ ] Custom mode allows manual input
- [ ] Preset selection persists

### Requirement 4: Image-Based Boundaries ✅
- [ ] Image dimensions detected automatically
- [ ] Grid bounds match image size
- [ ] Works with all supported image formats
- [ ] Error handling for invalid images

---

## Notes

- All changes should maintain backward compatibility
- Existing maps without `gridBounds` should use `imageSize` as fallback
- Grid bounds should be optional in Map type (for backward compatibility)
- Consider adding validation for grid bounds (min/max sizes)
- Consider adding undo/redo support for grid bounds changes
- Consider adding visual indicator for grid boundaries

---

## Future Enhancements

1. **Grid Units**: Support different units (pixels, mm, inches)
2. **Grid Templates**: Save custom grid sizes as templates
3. **Grid Import/Export**: Import grid settings from other maps
4. **Smart Zoom**: Auto-fit to grid on map load
5. **Grid Snapping Zones**: Visual indicators for snap zones

