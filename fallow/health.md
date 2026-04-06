# Code Health Report

**Overall Health Score:** 76 B

| Metric | Impact |
|--------|--------|
| Dead files | -10.9 |
| Dead exports | -8.0 |
| Complexity | -3.0 |
| Unused dependencies | -2.0 |

---

## Summary Metrics

| Metric | Value |
|--------|-------|
| Dead files | 54.5% |
| Dead exports | 40.1% |
| Average cyclomatic complexity | 2.1 |
| P90 cyclomatic complexity | 4 |
| Maintainability Index (MI) | 78.1 |
| Hotspots | 0 |
| Unused dependencies | 2 |

---

## High Complexity Functions (38 total)

### Critical Complexity Issues (>25 cyclomatic)

| Function | File | Line | Cyclomatic | Cognitive | Lines |
|----------|------|------|------------|-----------|-------|
| `renderField` | `frontend\src\features\analytics\ReportParameterForm.tsx` | 67 | 38 | 40 | 164 |
| `SiteForm` | `frontend\src\features\sites\components\SiteForm.tsx` | 50 | 38 | 21 | 431 |
| `handleKeyDown` | `frontend\src\hooks\editor\useEditorShortcuts.ts` | 162 | 33 | 4 | 64 |
| `updateModuleObject` | `frontend\src\utils\moduleFactory.ts` | 449 | 33 | 36 | 181 |
| `BookingDetailView` | `frontend\src\features\bookings\components\BookingDetailView.tsx` | 36 | 29 | 19 | 403 |
| `PropertiesPanel` | `frontend\src\components\editor\PropertiesPanel.tsx` | 188 | 26 | 28 | 645 |
| `MapEditorRefactored` | `frontend\src\pages\MapEditor.tsx` | 39 | 25 | 21 | 508 |

### High Complexity Functions (20-25 cyclomatic)

| Function | File | Line | Cyclomatic | Cognitive | Lines |
|----------|------|------|------------|-----------|-------|
| `EquipmentFormModal` | `frontend\src\features\equipment\components\InventoryManager.tsx` | 356 | 24 | 16 | 225 |
| `SiteDetailPage` | `frontend\src\pages\SiteDetailPage.tsx` | 30 | 24 | 19 | 373 |
| `transformDates` | `frontend\src\services\api\client.ts` | 18 | 24 | 13 | 36 |
| `EquipmentCatalog` | `frontend\src\features\equipment\components\EquipmentCatalog.tsx` | 25 | 23 | 19 | 241 |
| `<arrow>` | `frontend\src\features\sites\components\SiteAvailabilityGrid.tsx` | 59 | 23 | 22 | 41 |
| `BookingModificationDialog` | `frontend\src\features\bookings\components\BookingModificationDialog.tsx` | 28 | 22 | 27 | 369 |
| `<arrow>` | `frontend\src\components\editor\Rulers.tsx` | 56 | 21 | 37 | 85 |
| `CustomerBookingDetailPage` | `frontend\src\pages\CustomerBookingDetailPage.tsx` | 16 | 21 | 20 | 255 |
| `GuestBookingPage` | `frontend\src\pages\GuestBookingPage.tsx` | 23 | 21 | 17 | 289 |
| `BackgroundDialog` | `frontend\src\components\editor\BackgroundDialog.tsx` | 49 | 20 | 17 | 364 |
| `filteredSites` | `frontend\src\features\sites\components\SiteList.tsx` | 75 | 20 | 20 | 44 |

### Moderate Complexity Functions (12-19 cyclomatic)

| Function | File | Line | Cyclomatic | Cognitive | Lines |
|----------|------|------|------------|-----------|-------|
| `<arrow>` | `backend\src\services\booking.service.ts` | 302 | 19 | 27 | 92 |
| `ReportsPage` | `frontend\src\pages\ReportsPage.tsx` | 30 | 19 | 16 | 213 |
| `isBookingFilters` | `frontend\src\types\booking.ts` | 108 | 19 | 18 | 54 |
| `SitesPage` | `frontend\src\pages\SitesPage.tsx` | 44 | 18 | 18 | 618 |
| `UserForm` | `frontend\src\features\users\components\UserForm.tsx` | 37 | 17 | 16 | 251 |
| `login` | `frontend\src\stores\authStore.ts` | 193 | 17 | 21 | 77 |
| `Modal` | `frontend\src\components\ui\Modal.tsx` | 20 | 16 | 16 | 196 |
| `validateStep` | `frontend\src\features\auth\RegisterForm.tsx` | 47 | 16 | 21 | 54 |
| `renderModules` | `frontend\src\hooks\editor\useModuleRenderer.ts` | 125 | 16 | 21 | 85 |
| `setItem` | `frontend\src\utils\storageAdapter.ts` | 90 | 16 | 42 | 132 |
| `commitTransform` | `frontend\src\hooks\editor\useTransformHandler.ts` | 167 | 14 | 21 | 76 |
| `OptimizedImage` | `frontend\src\components\ui\OptimizedImage.tsx` | 29 | 13 | 16 | 135 |
| `<arrow>` | `frontend\src\features\bookings\components\MultiStepBookingForm.tsx` | 91 | 13 | 19 | 51 |
| `handleSelectionCreated` | `frontend\src\hooks\editor\useSelectionManager.ts` | 112 | 13 | 17 | 42 |
| `SiteBrowsePage` | `frontend\src\pages\SiteBrowsePage.tsx` | 19 | 13 | 18 | 443 |
| `getSnapPosition` | `frontend\src\utils\guideRenderer.ts` | 120 | 13 | 18 | 67 |
| `createIconObjects` | `frontend\src\utils\moduleFactory.ts` | 155 | 13 | 16 | 47 |
| `<arrow>` | `frontend\src\components\ui\Tooltip.tsx` | 79 | 12 | 26 | 37 |
| `parseLoginResponse` | `frontend\src\stores\authStore.ts` | 85 | 12 | 20 | 36 |
| `syncEditorStoreState` | `frontend\src\commands\PropertyCommand.ts` | 40 | 8 | 16 | 39 |

> Reference: [Complexity Metrics Documentation](https://docs.fallow.tools/explanations/health#complexity-metrics)

---

## File Health Scores (368 files)

### Lowest Scored Files

| Score | File | Fan-in | Fan-out | Dead % | Density |
|-------|------|--------|---------|--------|---------|
| 67.8 | `frontend\src\hooks\useNotifications.ts` | 1 | 2 | 100% | 0.26 |
| 68.1 | `frontend\src\hooks\useToast.ts` | 1 | 2 | 100% | 0.25 |
| 68.1 | `frontend\src\services\api\mock-users.ts` | 1 | 2 | 100% | 0.25 |
| 68.3 | `frontend\src\hooks\editor\useMapEditor.ts` | 1 | 11 | 100% | 0.06 |
| 68.4 | `frontend\src\features\bookings\components\MultiStepBookingForm.tsx` | 2 | 7 | 100% | 0.11 |
| 68.5 | `frontend\src\components\editor\PropertiesPanel.tsx` | 1 | 3 | 100% | 0.20 |
| 68.6 | `frontend\src\features\bookings\components\ManualBookingForm.tsx` | 1 | 6 | 100% | 0.12 |
| 68.7 | `frontend\src\components\data-display\Table.tsx` | 1 | 2 | 100% | 0.23 |
| 68.8 | `frontend\src\components\editor\LayersPanel.tsx` | 1 | 4 | 100% | 0.16 |
| 68.8 | `frontend\src\features\payments\services\payment.service.ts` | 2 | 3 | 100% | 0.19 |

*... and 358 more files*

> Reference: [File Health Scores Documentation](https://docs.fallow.tools/explanations/health#file-health-scores)

---

## Refactoring Targets (72 total)

**Effort Distribution:** 3 low effort | 57 medium | 12 high

### High Priority Targets

| Priority | Score | File | Issue | Effort | Confidence | Recommendation |
|----------|-------|------|-------|--------|------------|----------------|
| 22.8 | 22.8 | `frontend\src\tests\factories\map.ts` | Dead code | Low | High | Remove 3 unused exports (100% dead) |
| 22.4 | 22.4 | `frontend\src\utils\currency.ts` | Dead code | Low | High | Remove 5 unused exports (100% dead) |
| 21.2 | 21.2 | `frontend\src\utils\chartColors.ts` | Dead code | Low | High | Remove 3 unused exports (100% dead) |
| 35.7 | 17.9 | `frontend\src\stores\mapStore.ts` | Dead code | Medium | High | Remove 3 unused exports (100% dead) |
| 35.4 | 17.7 | `frontend\src\services\api\errors.ts` | Dead code | Medium | High | Remove 7 unused exports (100% dead) |
| 33.2 | 16.6 | `frontend\src\components\forms\validation.ts` | Dead code | Medium | High | Remove 4 unused exports (100% dead) |
| 33.0 | 16.5 | `frontend\src\services\api\mock-users.ts` | Dead code | Medium | High | Remove 7 unused exports (100% dead) |
| 32.5 | 16.3 | `frontend\src\stores\editorStore.ts` | Dead code | Medium | High | Remove 6 unused exports (100% dead) |
| 32.1 | 16.1 | `frontend\src\services\api\storage.ts` | Dead code | Medium | High | Remove 10 unused exports (100% dead) |
| 31.5 | 15.8 | `frontend\src\config\query-keys.ts` | Dead code | Medium | High | Remove 10 unused exports (100% dead) |

*... and 62 more targets*

> Reference: [Refactoring Targets Documentation](https://docs.fallow.tools/explanations/health#refactoring-targets)

---

## Key Insights

1. **Dead Code Epidemic**: 54.5% of files are dead, indicating significant cleanup opportunities
2. **Export Bloat**: 40.1% dead exports suggest many public APIs are unused
3. **Complexity Concentration**: 38 functions exceed complexity thresholds, with frontend components being the worst offenders
4. **Quick Wins Available**: 3 low-effort refactoring targets can immediately improve health score
5. **Editor Components**: Multiple high-complexity functions in editor-related files suggest architectural debt in the map editor feature

---

## Recommended Actions

1. **Immediate**: Remove 3 low-effort dead code targets (estimated +5 health points)
2. **Short-term**: Refactor top 5 highest cyclomatic complexity functions
3. **Medium-term**: Address 57 medium-effort refactoring targets
4. **Long-term**: Review editor component architecture to reduce complexity clustering