Here's a clean, human-readable Markdown version of your code duplication analysis report:

---

# 🔄 Code Duplication Analysis Report

## 📊 Overview

| Metric                               | Count |
| ------------------------------------ | ----- |
| Clone groups (duplicate code blocks) | 138   |
| Clone families (related groups)      | 27    |

---

## 📝 Top Clone Groups

### 🔁 207 lines – 2 instances

**Equipment management components**

| File                                                              | Lines   |
| ----------------------------------------------------------------- | ------- |
| `frontend/src/features/equipment/components/EquipmentCatalog.tsx` | 171-262 |
| `frontend/src/features/equipment/components/InventoryManager.tsx` | 124-330 |

---

### 🔁 71 lines – 2 instances

**Check-in / Check-out pages**

| File                                  | Lines  |
| ------------------------------------- | ------ |
| `frontend/src/pages/CheckInPage.tsx`  | 75-127 |
| `frontend/src/pages/CheckOutPage.tsx` | 77-147 |

---

### 🔁 67 lines – 2 instances

**Image processing utilities** (within same file)

| File                                    | Lines   |
| --------------------------------------- | ------- |
| `frontend/src/utils/imageProcessing.ts` | 259-325 |
| `frontend/src/utils/imageProcessing.ts` | 380-405 |

---

### 🔁 60 lines – 2 instances

**Analytics service (backend ↔ frontend)**

| File                                        | Lines  |
| ------------------------------------------- | ------ |
| `backend/src/services/analytics.service.ts` | 52-96  |
| `frontend/src/services/api/analytics.ts`    | 49-108 |

---

### 🔁 56 lines – 2 instances

**Command pattern tests**

| File                                                           | Lines |
| -------------------------------------------------------------- | ----- |
| `frontend/src/commands/__tests__/commands.test.ts`             | 14-69 |
| `frontend/src/hooks/editor/__tests__/useCommandFacade.test.ts` | 8-59  |

---

### 🔁 51 lines – 2 instances

**Error tracking types**

| File                                           | Lines |
| ---------------------------------------------- | ----- |
| `backend/src/services/error-tracking/types.ts` | 25-45 |
| `shared/types/error-tracking.ts`               | 25-75 |

---

### 🔁 49 lines – 2 instances

**Data display components**

| File                                                | Lines  |
| --------------------------------------------------- | ------ |
| `frontend/src/components/data-display/DataGrid.tsx` | 56-104 |
| `frontend/src/components/data-display/Table.tsx`    | 94-138 |

---

### 🔁 49 lines – 2 instances

**Check-in / Check-out pages** (second block)

| File                                  | Lines   |
| ------------------------------------- | ------- |
| `frontend/src/pages/CheckInPage.tsx`  | 268-316 |
| `frontend/src/pages/CheckOutPage.tsx` | 357-405 |

---

### 🔁 49 lines – 2 instances

**Customer/Guest booking detail pages**

| File                                               | Lines   |
| -------------------------------------------------- | ------- |
| `frontend/src/pages/CustomerBookingDetailPage.tsx` | 152-199 |
| `frontend/src/pages/GuestBookingDetailPage.tsx`    | 158-206 |

---

### 🔁 40 lines – 4 instances

**Editor property components**

| File                                                               | Lines   |
| ------------------------------------------------------------------ | ------- |
| `frontend/src/components/editor/properties/BuildingProperties.tsx` | 112-148 |
| `frontend/src/components/editor/properties/CampsiteProperties.tsx` | 97-136  |
| `frontend/src/components/editor/properties/CustomProperties.tsx`   | 64-94   |
| `frontend/src/components/editor/properties/RoadProperties.tsx`     | 88-124  |

---

### ... and 128 more clone groups

📖 [Learn more about clone groups](https://docs.fallow.tools/explanations/duplication#clone-groups)

---

## 👨‍👩‍👧‍👦 Clone Families (27 with multiple groups)

Groups of related clones across the same files.

### Backend Middleware – `auth.ts`

| Groups | Lines | Suggestion                                                  |
| ------ | ----- | ----------------------------------------------------------- |
| 2      | 30    | Extract shared function (24 lines + 6 lines) from `auth.ts` |

---

### Backend Routes – `analytics.routes.ts`

| Groups | Lines | Suggestion                                                       |
| ------ | ----- | ---------------------------------------------------------------- |
| 2      | 18    | Extract shared function (9 lines × 2) from `analytics.routes.ts` |

---

### Backend Routes – `api-key.routes.ts`

| Groups | Lines | Suggestion                                                      |
| ------ | ----- | --------------------------------------------------------------- |
| 2      | 30    | Extract shared function (15 lines × 2) from `api-key.routes.ts` |

---

### Backend Routes – `booking.routes.ts`

| Groups | Lines | Suggestion                                              |
| ------ | ----- | ------------------------------------------------------- |
| 3      | 54    | Extract 3 shared clone groups into `backend/src/routes` |

---

### Backend Services – `analytics.service.ts`

| Groups | Lines | Suggestion                                           |
| ------ | ----- | ---------------------------------------------------- |
| 3      | 28    | Extract shared functions: 12 lines, 9 lines, 7 lines |

---

### Cross-Layer – Analytics (Backend + Frontend)

| Groups | Lines | Suggestion                                                |
| ------ | ----- | --------------------------------------------------------- |
| 3      | 96    | Extract 3 shared clone groups into a **shared directory** |

**Files involved:**

- `backend/src/services/analytics.service.ts`
- `frontend/src/services/api/analytics.ts`

---

### Backend Tests – `api-key.test.ts`

| Groups | Lines | Suggestion                                   |
| ------ | ----- | -------------------------------------------- |
| 2      | 19    | Extract shared function (13 lines + 6 lines) |

---

### Backend Tests – `equipment.test.ts`

| Groups | Lines | Suggestion                            |
| ------ | ----- | ------------------------------------- |
| 2      | 18    | Extract shared function (9 lines × 2) |

---

### Cross-Test – `equipment.test.ts` + `booking.test.ts`

| Groups | Lines | Suggestion                                                     |
| ------ | ----- | -------------------------------------------------------------- |
| 5      | 109   | Extract 5 shared clone groups into a **shared test directory** |

**Files involved:**

- `backend/tests/routes/equipment.test.ts`
- `backend/tests/services/booking.test.ts`

---

### Backend Tests – `booking.test.ts`

| Groups | Lines | Suggestion                                                  |
| ------ | ----- | ----------------------------------------------------------- |
| 3      | 69    | Extract 3 shared clone groups into `backend/tests/services` |

---

### ... and 17 more families

📖 [Learn more about clone families](https://docs.fallow.tools/explanations/duplication#clone-families)

---

## 💡 Recommendations

| Priority  | Issue                              | Suggested Action                                      |
| --------- | ---------------------------------- | ----------------------------------------------------- |
| 🔴 High   | 207-line duplicate (Equipment)     | Extract shared logic into a custom hook or composable |
| 🔴 High   | 71-line duplicate (Check-in/out)   | Create a shared `CheckFlow` component                 |
| 🔴 High   | 60-line duplicate (Analytics)      | Move shared types/logic to `shared` package           |
| 🟡 Medium | 49-line duplicate (DataGrid/Table) | Create a base `DataTable` component                   |
| 🟡 Medium | 40-line duplicate (4 properties)   | Create a base `PropertySection` component             |
| 🟢 Low    | Test duplication                   | Extract test helpers and factories                    |

---

_Report generated from code duplication analysis_
