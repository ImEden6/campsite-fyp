# Pre-existing Type Errors & Lint Issues — RESOLVED

> Documented during tightening plan items 1-3 execution (2026-04-06)
> **Status: ALL 50 ERRORS FIXED** (2026-04-06 22:45)
> - `npm run type-check`: 0 errors (was 27)
> - `npm run lint`: 0 errors (was 23)

---

## Type Errors (`tsc --noEmit` — 27 errors)

### Table.tsx — Duplicate identifiers
| File | Line | Error |
|------|------|-------|
| `src/components/data-display/Table.tsx` | 4 | Duplicate identifier `LoadingState` |
| `src/components/data-display/Table.tsx` | 5 | Duplicate identifier `EmptyState` |
| `src/components/data-display/Table.tsx` | 6 | Duplicate identifier `LoadingState` |
| `src/components/data-display/Table.tsx` | 7 | Duplicate identifier `EmptyState` |

### AnalyticsPage.tsx — Duplicate identifiers
| File | Line | Error |
|------|------|-------|
| `src/pages/AnalyticsPage.tsx` | 25 | Duplicate identifier `SitePerformance` |
| `src/pages/AnalyticsPage.tsx` | 26 | Duplicate identifier `SitePerformance` |

### ReportFields.tsx — Unused import + exactOptionalPropertyTypes
| File | Line | Error |
|------|------|-------|
| `src/features/analytics/components/ReportFields.tsx` | 4 | `'Select'` is declared but never used |
| `src/features/analytics/ReportParameterForm.tsx` | 86 | `exactOptionalPropertyTypes`: `error: string \| undefined` not assignable to `error?: string` |

### Equipment module — Multiple issues
| File | Line | Error |
|------|------|-------|
| `src/features/equipment/components/EquipmentFilters.tsx` | 4 | `EquipmentFilters` must be all exported or all local (merged declaration) |
| `src/features/equipment/components/EquipmentFilters.tsx` | 19 | Same merged declaration conflict |
| `src/features/equipment/components/EquipmentFilters.tsx` | 43 | `readonly` array not assignable to mutable `SelectOption[]` |
| `src/features/equipment/components/EquipmentFilters.tsx` | 49 | `readonly` array not assignable to mutable `SelectOption[]` |
| `src/features/equipment/components/EquipmentFormModal.tsx` | 9 | No exported member `CreateEquipmentRequest` from `@/types` |
| `src/features/equipment/components/EquipmentFormModal.tsx` | 54 | `exactOptionalPropertyTypes`: `description?: string` mismatch |
| `src/features/equipment/components/EquipmentFormModal.tsx` | 150 | `SubmitHandler` generic type mismatch |
| `src/features/equipment/components/EquipmentFormModal.tsx` | 176 | `readonly` array not assignable to mutable `SelectOption[]` |
| `src/features/equipment/components/InventoryManager.tsx` | 9 | No exported member `getEquipment` from `@/types` |
| `src/features/equipment/components/InventoryManager.tsx` | 95 | `readonly` array not assignable to mutable `SelectOption[]` |
| `src/features/equipment/components/InventoryManager.tsx` | 127 | Parameter `equipment` implicitly has `any` type |
| `src/features/equipment/components/InventoryManager.tsx` | 158 | `string` not assignable to Badge variant union type |

### SiteForm — Type mismatches
| File | Line | Error |
|------|------|-------|
| `src/features/sites/components/__tests__/SiteForm.test.tsx` | 68 | `"TENT"` not assignable to `SiteType` |
| `src/features/sites/components/__tests__/SiteForm.test.tsx` | 109 | `"TENT"` not assignable to `SiteType` |
| `src/features/sites/components/SiteForm.tsx` | 139 | `setValue` type mismatch between `SiteFormData` and `BasicInfoData` |
| `src/features/sites/components/SiteForm.tsx` | 162 | `setValue` type mismatch between `SiteFormData` and `AmenitiesData` |
| `src/features/sites/components/SiteFormSections.tsx` | 157 | `errors` declared but never used |
| `src/features/sites/components/SiteFormSections.tsx` | 287 | `newImages` declared but never used |

### GuestBookingDetailPage.tsx — Unused + missing
| File | Line | Error |
|------|------|-------|
| `src/pages/GuestBookingDetailPage.tsx` | 4 | `CheckCircle` declared but never used |
| `src/pages/GuestBookingDetailPage.tsx` | 8 | `format` declared but never used |
| `src/pages/GuestBookingDetailPage.tsx` | 52 | Cannot find name `Users` |

### Analytics service — Unused types
| File | Line | Error |
|------|------|-------|
| `src/services/api/analytics.ts` | 11 | `RevenueDataPoint` declared but never used |
| `src/services/api/analytics.ts` | 13 | `OccupancyDataPoint` declared but never used |

### Integration tests
| File | Line | Error |
|------|------|-------|
| `src/tests/integration/payment-flow.test.tsx` | 237 | `Promise<unknown>` not assignable to expected type |
| `src/tests/integration/staff-checkin-flow.test.tsx` | 139 | Object is possibly `undefined` |

---

## Lint Errors (`eslint` — 23 errors)

### Utility scripts (not in src/)
| File | Line | Error |
|------|------|-------|
| `clean_fails.js` | 10 | Control character in regex `\x1b` |
| `extract-fails.js` | 12-14 | `console` not defined (3 occurrences) |
| `get_fails.js` | 15-16 | `console` not defined (2 occurrences) |
| `parse_fails.js` | 12 | Control character in regex `\x1b` |

### Unused vars/imports in src/
| File | Line | Error |
|------|------|-------|
| `src/components/ui/OptimizedImage.tsx` | 136, 154 | `any` type used (2x) |
| `src/config/sentry.ts` | 182 | `any` type used |
| `src/features/analytics/components/ReportFields.tsx` | 4 | `Select` imported but never used |
| `src/features/sites/components/SiteFormSections.tsx` | 157 | `errors` param unused |
| `src/features/sites/components/SiteFormSections.tsx` | 287 | `newImages` param unused |
| `src/pages/GuestBookingDetailPage.tsx` | 4 | `CheckCircle` unused |
| `src/pages/GuestBookingDetailPage.tsx` | 8 | `format` unused |
| `src/services/api/analytics.ts` | 11 | `RevenueDataPoint` unused |
| `src/services/api/analytics.ts` | 13 | `OccupancyDataPoint` unused |
| `src/services/api/client.ts` | 329, 348 | `any` type used (2x) |
| `src/services/api/errors.ts` | 58, 108, 137 | `any` type used (4x) |

---

## Summary

| Category | Count |
|----------|-------|
| Type errors | 27 |
| Lint errors | 23 |
| **Total** | **50** |

### By severity/priority
| Priority | Issues | Description |
|----------|--------|-------------|
| **P0 — Broken imports** | 5 | Missing exports (`CreateEquipmentRequest`, `getEquipment`, `Users`) |
| **P1 — Type mismatches** | 12 | `exactOptionalPropertyTypes`, `readonly` arrays, generic mismatches |
| **P2 — Unused code** | 13 | Unused imports, vars, params |
| **P3 — Style** | 20 | `any` types, control chars in regex, `console` in Node scripts |
