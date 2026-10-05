# Pre-existing Errors

> These errors existed before the dead code cleanup and are NOT caused by recent changes.

---

## 1. GuestBookingDetailPage.tsx — Syntax Error

**File:** `frontend/src/pages/GuestBookingDetailPage.tsx:194`

**Error:** `')' expected` / `Unterminated regular expression`

**Details:** The file has duplicated JSX blocks (lines 185-194 are duplicates of lines 164-183). The closing tags don't match up, causing a parse error.

**Impact:** Frontend build fails entirely.

**Fix needed:** Remove the duplicated JSX block (lines 185-195) and fix the component structure. Also remove unused imports:
- `CheckCircle` from `lucide-react` (line 4)
- `format` from `date-fns` (line 8)
- `Users` is referenced at line 52 but never imported

---

## 2. Analytics Service — Missing Shared Types in Backend

**Files:**
- `backend/src/services/analytics.service.ts:9-16`
- `frontend/src/services/api/analytics.ts:9-16`

**Errors:**
```
Module '"@campsite-management/shared"' has no exported member 'DateRange'.
Module '"@campsite-management/shared"' has no exported member 'DashboardMetrics'.
Module '"@campsite-management/shared"' has no exported member 'RevenueDataPoint'.
Module '"@campsite-management/shared"' has no exported member 'OccupancyDataPoint'.
Module '"@campsite-management/shared"' has no exported member 'CustomerInsights'.
Module '"@campsite-management/shared"' has no exported member 'SitePerformance'.
```

**Details:** The types exist in `shared/types/analytics.ts` and are correctly built in `shared/dist/types/analytics.d.ts`. However, the backend's `node_modules/@campsite-management/shared/` has a stale copy that doesn't include the analytics types. The workspace symlink/link is out of date.

**Impact:** Backend TypeScript compilation fails (8 errors).

**Fix needed:** Reinstall workspace dependencies so backend picks up the latest shared package:
```bash
npm install
# or
rm -rf backend/node_modules/@campsite-management/shared
npm install
```

Also verify `@campsite-management/shared` is listed in `backend/package.json` workspace dependencies.

---

## 3. Analytics Service — Type Shape Mismatch

**File:** `backend/src/services/analytics.service.ts`

**Errors:**
```
Line 277: Object literal may only specify known properties, and 'total' does not exist in type 'RevenueMetrics'.
Line 304: Object literal may only specify known properties, and 'overall' does not exist in type 'OccupancyMetrics'.
```

**Details:** The analytics service constructs return objects with `total` and `overall` properties, but the `RevenueMetrics` and `OccupancyMetrics` types in shared expect different property names. The types define `total` and `overall` respectively, so this may be a stale type definition issue that will resolve once the shared package is properly linked.

**Impact:** Backend TypeScript compilation fails.

**Fix needed:** Will likely resolve after fixing issue #2. If not, the service's return objects need to match the shared type definitions.

---

## 4. Frontend Lint Errors (19 errors)

**Unrelated to dead code cleanup:**

| File | Error |
|------|-------|
| `frontend/clean_fails.js` | Control character in regex |
| `frontend/extract-fails.js` | `console` not defined (3x) |
| `frontend/get_fails.js` | `console` not defined (2x) |
| `frontend/parse_fails.js` | Control character in regex |
| `frontend/src/components/ui/OptimizedImage.tsx` | `any` type (2x) |
| `frontend/src/config/sentry.ts` | `any` type |
| `frontend/src/services/api/analytics.ts` | Unused vars `RevenueDataPoint`, `OccupancyDataPoint` |
| `frontend/src/services/api/client.ts` | `any` type (2x) |
| `frontend/src/services/api/errors.ts` | `any` type (4x) |

---

## 5. Table.tsx — Duplicate Identifiers

**File:** `frontend/src/components/data-display/Table.tsx`

**Errors:**
```
Duplicate identifier 'LoadingState'.
Duplicate identifier 'EmptyState'.
```

**Details:** These types are imported/defined twice in the same file.

**Impact:** TypeScript compilation warning.

---

## 6. Test Database Connection Failures

**Error:** `Can't reach database server at 127.0.0.1:5433`

**Details:** All backend integration tests fail because no PostgreSQL server is running at the expected address. This is expected in environments without a local database.

**Impact:** 53 test failures across 5 test files.

---

## 7. Staff Check-in Flow Test

**File:** `frontend/src/tests/integration/staff-checkin-flow.test.tsx:139`

**Error:** `Object is possibly 'undefined'.`

**Impact:** Single test failure (unrelated to database).
