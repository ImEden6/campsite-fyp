Here's a clean, human-readable Markdown version of your dead code analysis report:

---

# 🧹 Dead Code Analysis Report

> **Note:** This report has been manually reviewed to remove false positives. Items flagged by the tool but verified as actually used have been removed or annotated.

> **⚠️ Known tool limitations:**
> - Fails to trace through barrel-file re-export chains (e.g., `types/index.ts` → `fabricTypes.ts` → consumer)
> - Does not detect non-code references (Dockerfile, Prisma schema defaults, migration files)
> - Struggles with Vite's `@/` path alias resolution (see Unresolved Imports section)

## 📊 Overview

> Counts below reflect the raw tool output. Items marked as false positives during review are annotated inline.

| Category              | Raw Count | Reviewed Status |
| --------------------- | --------- | --------------- |
| Unused files          | 229       | 2 false positives removed (prisma config files) |
| Unused exports        | 448       | Barrel-file re-exports likely inflated; verify individually |
| Unused type exports   | 183       | Barrel-file re-exports likely inflated; verify individually |
| Unused enum members   | 19        | 1 false positive removed (`GroupBookingStatus.INQUIRY`) |
| Unused class members  | 91        | 20 false positives removed (Command classes + mock.ts + local.ts) |
| Unresolved imports    | 742       | ⚠️ Mostly false positives — see section below |
| Unlisted dependencies | 1         | Confirmed accurate (`idb`) |
| Duplicate exports     | 24        | Confirmed accurate |
| Circular dependencies | 3         | Confirmed accurate |

---

## 🗑️ Unused Files (229)

These files are not imported or referenced by any entry point.

### Backend

- `backend\prisma\backfill-guests.ts`
- `backend\src\services\sms.service.ts`
- `backend\tests\utils\auth.ts`
- `backend\tests\utils\factories.ts`
- `backend\tests\utils\http.ts`
- `backend\tests\utils\index.ts`

> **Review note:** `backend\prisma\prisma.config.js` was removed from this list — it IS referenced in `backend/Dockerfile:69` (copied into production image). Note: `prisma.config.ts` does not exist as a file but is listed in `backend/tsconfig.json` excludes.

### Deployment

- `deployment\ecosystem.config.js` _(note: invoked by `pm2` CLI at deploy time, not by application code)_

### Additional

- ... and 219 more files

📖 [Learn more about unused files](https://docs.fallow.tools/explanations/dead-code#unused-files)

---

## 📤 Unused Exports (448)

Exported symbols not imported by any reachable file.

> **Review note:** The following exports were removed after verification — they ARE used:
> - `API_TIMEOUT` (used in `services/api/client.ts`)
> - `PaymentError`, `ExternalServiceError`, `DatabaseError`, `handleZodError` (used internally in `errors.ts`)
> - `authorizeCustom` (used to create specialized auth middlewares)
>
> **Correction:** `createRateLimit` and `helmetConfig` were moved to the unused list below — they are only used internally within `security.ts` and never imported by other files.

### Frontend – `constants.ts` (39 exports)

> **Review note:** `API_TIMEOUT` IS used in `services/api/client.ts`. `QUERY_STALE_TIME`, `QUERY_CACHE_TIME`, `QUERY_RETRY_ATTEMPTS` ARE used in `config/react-query.ts`. The following are confirmed unused:

| Line | Export                  | Status |
| ---- | ----------------------- | ------ |
| 8    | `API_RETRY_ATTEMPTS`    | Unused |
| 9    | `API_RETRY_DELAY`       | Unused |
| 12   | `WS_RECONNECT_ATTEMPTS` | Unused |
| 13   | `WS_RECONNECT_DELAY`    | Unused |
| 14   | `WS_MAX_RECONNECT_DELAY`| Unused |
| 25   | `TOKEN_REFRESH_THRESHOLD`| Unused |
| +33  | more...                 | Verify individually |

### Frontend – `types/index.ts` (33 exports)

> **Review note:** Many of these are false positives caused by the tool's inability to trace barrel-file re-export chains. The following were verified as USED and should be ignored:
> - `MAX_ZOOM` — used in `frontend/src/hooks/editor/usePanZoom.ts:16,117,125,176`
> - `FIT_TO_SCREEN_PADDING` — used in `frontend/src/hooks/editor/usePanZoom.ts:20,152`
> - `DEFAULT_GRID_SIZE` — re-exported from `fabricTypes.ts`, used by canvas configuration

Re-exports including: `GroupBookingStatus`, `GuestType`, and 28 more (verify individually before removing).

### Backend – `config/index.ts` (24 exports)

> **Review note:** All 18 destructured convenience aliases (`serverConfig`, `databaseConfig`, `jwtConfig`, `redisConfig`, `emailConfig`, `smsConfig`, `stripeConfig`, `uploadConfig`, `weatherConfig`, `googleConfig`, `sessionConfig`, `securityConfig`, `loggingConfig`, `jobsConfig`, `monitoringConfig`, `featureFlags`, `cacheConfig`, `paginationConfig`, `businessConfig`, `notificationsConfig`, `apiConfig`, `developmentConfig`) are confirmed unused — the codebase accesses config via the main `config` object (e.g., `config.jwt.secret`). `validateConfig` IS used internally at line 339.

| Line | Export           | Status |
| ---- | ---------------- | ------ |
| 267  | `validateConfig` | Used internally |
| 314  | `serverConfig`   | Unused — dead code |
| 315  | `databaseConfig` | Unused — dead code |
| 316  | `jwtConfig`      | Unused — dead code |
| 317  | `redisConfig`    | Unused — dead code |
| +18  | more aliases...  | All unused — dead code |

### Backend – `utils/errors.ts` (23 exports)

> **Review note:** Most error classes ARE actively used across routes, services, and middleware. Confirmed usage:
> - `AuthenticationError` — used extensively in `auth.service.ts` (10+ throw sites)
> - `NotFoundError` — used in `auth.service.ts`, `upload.routes.ts`, error handlers
> - `ConflictError` — used in `auth.service.ts`, `site.service.ts`, error handlers
> - `RateLimitError` — used in `security.ts`, Stripe error handler
> - `BusinessLogicError` — used in `auth.service.ts`
> - `PaymentError`, `ExternalServiceError`, `DatabaseError` — used in Stripe error handler
> - `ValidationError` — used in multer/stripe handlers, validation middleware
> 
> **Confirmed unused:**
> - `AuthorizationError` — declared at line 63 and re-exported at line 419, but never imported or thrown anywhere in the codebase

### Backend – `middleware/security.ts` (22 exports)

> **Review note:** Only **4 of 22 exports** are actually used. The remaining 18 are dead code:

| Export | Status |
| ------ | ------ |
| `generalRateLimit` | Used in `backend/src/index.ts:65` |
| `authRateLimit` | Used in `routes/auth.routes.ts:18` |
| `registerRateLimit` | Used in `routes/auth.routes.ts:48` |
| `paymentRateLimit` | Used in `routes/payment.routes.ts:22` |
| `passwordResetRateLimit` | **Unused** — never imported |
| `uploadRateLimit` | **Unused** — never imported |
| `bookingRateLimit` | **Unused** — only referenced in a comment in `index.ts:79` |
| `createRateLimit` | **Unused externally** — only used internally to build the 7 predefined limiters |
| `helmetConfig` | **Unused** — `index.ts` calls `helmet()` with its own inline config |
| `corsConfig` | **Unused** — `index.ts` configures `cors()` with inline options |
| `sanitizeInput` | **Unused** — only in internal `securityMiddleware` array |
| `requestLogger` | **Unused** — `index.ts` uses `morgan` instead |
| `ipWhitelist` | **Unused** — never imported |
| `validateUserAgent` | **Unused** — never imported |
| `requestSizeLimit` | **Unused** — `index.ts` uses `express.json({ limit: '10mb' })` |
| `sqlInjectionDetection` | **Unused** — never imported |
| `xssProtection` | **Unused** — never imported |
| `securityHeaders` | **Unused** — only in internal `securityMiddleware` array |
| `maintenanceMode` | **Unused** — never imported |
| `validateApiVersion` | **Unused** — never imported |
| `securityMiddleware` | **Unused** — imported in `index.ts:21` but never applied via `app.use()` |
| `default` (aggregated object) | **Unused** — never imported |

### Frontend – `fabricTypes.ts` (17 exports)

> **Review note:** Most of these ARE used but the tool misses them due to barrel-file re-export chains. Verified usage:
> - `isGridObject` — used in `useModuleRenderer.ts:64`, `useGrid.ts:119`, re-exported from `moduleFactory.ts`
> - `isBackgroundObject` — used in `useModuleRenderer.ts:65`, `backgroundHandler.ts:131,165,178`
> - `getModuleId` — used extensively in `useModuleRenderer.ts`, `useInputHandler.ts`, `useTransformHandler.ts`, `useSelectionManager.ts`
> - `hasDataProperty` — used internally by other fabricTypes functions and in `moduleFactory.ts`
> - `getModuleType` — re-exported from `types/index.ts` and `moduleFactory.ts`; no direct call-site beyond re-exports
> 
> The remaining exports in this file should be verified individually before removing.

### Frontend – `stores/index.ts` (16 exports)

> **Review note:** Stores are heavily used across the frontend (77+ import matches). The re-export selectors (`selectCustomModules`, `selectGuidesByOrientation`, `selectHasMultiSelection`, `selectHasSelection`, `selectIsSelected`) are likely used via Zustand's `useStore(selectors)` pattern. Verify individually before removing.

### Backend – `middleware/auth.ts` (15 exports)

> **Review note:** `authorizeCustom` IS used to create the 5 specialized auth middlewares below. However, 4 of those middlewares are never wired to any route:

| Export | Status |
| ------ | ------ |
| `authorizeBookingOwnership` | Used in `routes/booking.routes.ts` |
| `authorizeSiteManagement` | Unused — defined but never imported in routes |
| `authorizeAnalytics` | Unused — defined but never imported in routes |
| `authorizeEquipmentManagement` | Unused — defined but never imported in routes |
| `authorizeUserManagement` | Unused — defined but never imported in routes |

`optionalAuthenticate`, `authorizeMinimumRole`, `authorizeOwnership`, and 10 more.

### Backend – `email/index.ts` (13 exports)

> **Review note:** `emailService` is imported and used in `auth.service.ts:17`. Email providers (Nodemailer, SendGrid, Mock) are used via the factory pattern in `email/factory.ts`. Types like `EmailOptions`, `EmailResult`, `EmailProvider` are used in base classes and provider implementations. Verify individual type exports before removing.

### Frontend – `propertyValidation.ts` (13 exports)

> **Review note:** These ARE used. Confirmed imports in property components:
> - `validateCapacity`, `validatePrice`, `validateMultiplier` — used in `CampsiteProperties.tsx`, `BuildingProperties.tsx`
> - `validateName` — used across `RoadProperties.tsx`, `CampsiteProperties.tsx`, `BuildingProperties.tsx`, `CustomProperties.tsx`
> - `validateWidth`, `validateSpeedLimit` — used in `RoadProperties.tsx`
> - `validateDescription` — used in `CustomProperties.tsx`
> 
> This section is likely a false positive — verify remaining exports individually before removing.

### Additional

... and 237 more exports across 92 files.

📖 [Learn more about unused exports](https://docs.fallow.tools/explanations/dead-code#unused-exports)

---

## 🏷️ Unused Type Exports (183)

Exported types/interfaces not imported by any reachable file.

### Frontend – `types/index.ts` (33 types)

> **Review note:** Barrel re-exports. Verified status of listed types:

| Type | Status |
| ---- | ------ |
| `DateRangeFilter` | **Used** — imported in `AnalyticsPage.tsx:30` |
| `CanvasOptions` | **Unused** — consumers import directly from `fabricTypes.ts`, not from barrel |
| `EquipmentAvailabilityParams` | **Unused** — `config/query-keys.ts` declares its own local interface |
| `FabricCanvas` | **Unused as barrel export** — 15+ consumers import directly from `@/types/fabricTypes` |
| `FabricControl` | **Unused** — zero external imports |

Verify remaining 28 re-exports individually before removing.

### Frontend – `fabricTypes.ts` (13 types)

> **Review note:** All 5 listed types ARE used — this section is a false positive caused by the tool missing type-only imports:

| Type | Status |
| ---- | ------ |
| `FabricObject` | **Used** — 10+ files import from `@/types/fabricTypes` |
| `FabricGroup` | **Used** — `moduleFactory.ts`, `useModuleRenderer.ts` |
| `FabricImage` | **Used** — `backgroundHandler.ts`, `backgroundLayer.ts` |
| `FabricLine` | **Used** — `guideRenderer.ts` |
| `Point` | **Used** — `useInputHandler.ts`, `useGrid.ts`, `usePanZoom.ts`, `useFabricCanvas.ts` |

Verify remaining 8 types individually before removing.

### Frontend – `websocket/types.ts` (12 types)

> **Review note:** These ARE used. Confirmed:
> - `ConnectionStatus` — used in `hooks/useWebSocket.ts:8`
> - `BookingEventPayload` — used in `hooks/useBookingEvents.ts:9`
> - `NotificationEventPayload` — used in `hooks/useNotificationEvents.ts:9`
> - `EventHandler` — used in `hooks/useWebSocketEvent.ts:9`
> 
> Verify remaining type exports individually before removing.

### Backend – `analytics.service.ts` (8 types)

> **Review note:** These types ARE used. `DateRange`, `DashboardMetrics`, `RevenueDataPoint`, `RevenueMetrics`, `OccupancyDataPoint` are imported from `@campsite-management/shared` and used as return type annotations and parameter types throughout the service. The tool likely misses type-only usage. Verify before removing.

### Frontend – `payment.types.ts` (8 types)

> **Review note:** Actual file is at `frontend/src/features/payments/types/payment.types.ts`. Verified:

| Type | Status |
| ---- | ------ |
| `Payment` | **Used** — 5+ files including `PaymentHistory.tsx`, `RefundDialog.tsx`, `payment.service.ts` |
| `PaymentIntent` | **Used** — `mock-payment-intent.ts`, `payment.service.ts` |
| `CreatePaymentIntentRequest` | **Used** — `payment.service.ts`, `usePayments.ts` |
| `RefundRequest` | **Used** — `payment.service.ts`, `usePayments.ts` |
| `ProcessPaymentRequest` | **Unused** — zero imports anywhere |

### Backend – `validate.ts` (7 types)

> **Review note:** All 5 listed types are **unused**. They are either duplicates of types defined elsewhere or internal-only:

| Type | Status |
| ---- | ------ |
| `ValidationErrorDetail` | **Unused** — duplicate of definition in `errors.ts:48`; only used internally |
| `ValidationErrorResponse` | **Unused** — only used as local variable annotation at line 197 |
| `RefreshTokenInput` | **Unused** — zero imports anywhere |
| `GuestInputValidated` | **Unused** — zero imports anywhere |
| `CreateBookingInput` | **Unused** — duplicate of `shared/schemas/index.ts:487`; consumers use the shared version |

### Frontend – `bookingFormTypes.ts` (7 types)

> **Review note:** Actual file is at `frontend/src/features/bookings/types/bookingFormTypes.ts`. Verified:

| Type | Status |
| ---- | ------ |
| `BookingFormData` | **Used** — 6+ files via `../types` barrel |
| `BookingFormErrors` | **Used** — 4+ files via `../types` barrel |
| `PrimaryGuestInfo` | **Used** — `MultiStepBookingForm.tsx:16,54` |
| `GuestDetail` | **Unused** — duplicate of local definition in `GuestDetailsInput.tsx:12`; consumers import from there |
| `EquipmentReservation` | **Unused** — duplicate of `shared/types/index.ts:365`; zero imports from this file |

### Frontend – `bookings/types/index.ts` (7 types)

> **Review note:** Barrel re-exports. Verified:

| Type | Status |
| ---- | ------ |
| `BookingFormData` | **Used** — consumed via `../types` imports by 6+ files |
| `BookingFormErrors` | **Used** — consumed via `../types` imports by 4+ files |
| `BookingFormStep` | **Used** — `MultiStepBookingForm.tsx`, `BookingProgressStepper.tsx`, `useMultiStepForm.ts` |
| `BookingStepConfig` | **Used** — `BookingProgressStepper.tsx:7,23` |
| `EquipmentReservation` | **Unused** — zero consumers import it from this barrel |

### Frontend – `properties/index.ts` (6 types)

> **Review note:** Actual file is at `frontend/src/components/editor/properties/index.ts`. All 5 listed types are **unused** — they are component-local prop interfaces that are re-exported from the barrel but never imported from it:

| Type | Status |
| ---- | ------ |
| `BuildingPropertiesProps` | **Unused** — defined in `BuildingProperties.tsx`, re-exported from barrel, zero imports from barrel |
| `CampsitePropertiesProps` | **Unused** — defined in `CampsiteProperties.tsx`, re-exported from barrel, zero imports from barrel |
| `CustomPropertiesProps` | **Unused** — defined in `CustomProperties.tsx`, re-exported from barrel, zero imports from barrel |
| `ModuleIconConfig` | **Unused** — defined in `moduleIcons.ts`, re-exported from barrel, zero imports from barrel |
| `PropertySectionProps` | **Unused** — defined in `PropertySection.tsx`, re-exported from barrel, zero imports from barrel |

### Backend – `auth.service.ts` (5 types)

> **Review note:** All 5 types are **unused as exports**. They are only consumed internally within `auth.service.ts`:

| Type | Status |
| ---- | ------ |
| `AuthTokens` | **Unused as export** — duplicate of `shared/types/index.ts:101` and `frontend/src/types/index.ts:128`; consumers import from those, not from this file |
| `LoginCredentials` | **Unused as export** — duplicate of `frontend/src/types/index.ts:134`; consumers import from frontend barrel |
| `RegisterData` | **Unused** — only used internally at line 159; zero external imports |
| `ResetPasswordData` | **Unused** — only used internally at line 452; zero external imports |
| `ChangePasswordData` | **Unused** — only used internally at line 499; zero external imports |

### Additional

... and 77 more types across 45 files.

📖 [Learn more about unused types](https://docs.fallow.tools/explanations/dead-code#unused-types)

---

## 📦 Unused devDependencies (1)

Packages in `package.json` not imported anywhere in the project.

> **Review note:** `tsconfig-paths` was removed from this list — it IS used in `dev` and `db:seed` scripts via `-r tsconfig-paths/register`.

| Package          | Location                | Notes |
| ---------------- | ----------------------- | ----- |
| `workbox-window` | `frontend\package.json` | Not directly imported in source code, but used by `vite-plugin-pwa` (which IS used in `vite.config.ts`). Likely safe to keep as a peer dependency of the PWA plugin. Verify if `vite-plugin-pwa` already bundles it. |

📖 [Learn more about unused dependencies](https://docs.fallow.tools/explanations/dead-code#unused-dependencies)

---

## 🔢 Unused Enum Members (19)

Enum variants never referenced outside their declaration.

**Location:** `shared\types\index.ts`

| Enum                 | Unused Members                                | Notes |
| -------------------- | --------------------------------------------- | ----- |
| `MeasurementUnit`    | `METERS`                                      |       |
| `GroupBookingStatus` | `QUOTED`, `CONFIRMED`, `CANCELLED`            | `INQUIRY` removed — used as Prisma schema default `@default(INQUIRY)` and in test factories |
| +14 more...          |                                               |       |

> **Review note:** `GroupBookingStatus.INQUIRY` was removed from this list — it IS used as the default value in `backend/prisma/schema.prisma:470` and referenced in test factories. The tool does not detect database-level enum usage.

📖 [Learn more about unused enum members](https://docs.fallow.tools/explanations/dead-code#unused-enum-members)

---

## 🧩 Unused Class Members (91)

Class methods/properties never referenced outside their class.

### Backend – `cache.service.ts` (39 public members)

> **Review note:** `increment` IS used 3 times in `backend/src/services/api-key/service.ts:389,394,399`. Of 39 public members, only **13 are actively used** by other files:

| Status | Members |
| ------ | ------- |
| **Used (13)** | `hashQuery`, `set`, `get`, `delete`, `expire`, `increment`, `flushPattern`, `safeGet`, `safeSet`, `safeDelete`, `safeFlushPattern`, `getWithSoftTtl`, `remember` |
| **Internal-only (3)** | `isReady`, `deleteMany`, `keys` — called by other CacheService methods, not dead code |
| **Unused (23)** | `connect`, `disconnect`, `exists`, `ttl`, `decrement`, `mget`, `mset`, `flushAll`, `sadd`, `srem`, `sismember`, `smembers`, `zadd`, `zrange`, `lpush`, `lpop`, `lrange`, `hset`, `hget`, `hdel`, `hgetall`, `rememberForever`, `healthCheck` |

> The unused members fall into entire Redis data-type operation families that were implemented but never consumed: set ops, sorted set ops, list ops, hash ops, bulk ops, and lifecycle methods.

### Frontend – `keyboardHandler.ts` (15 members)

> **Review note:** The entire `KeyboardHandler` class is unused in production code. All 15 members are only referenced by `keyboardHandler.test.ts`. The class is exported from `utils/index.ts` but never imported by any component, hook, or page.

`unregister`, `registerMultiple`, `clearAll`, `enable`, `disable`, and 10 more.

### Backend – `sentry.ts` (10 members)

> **Review note:** Most members are used via the `IErrorTracker` interface contract. Confirmed unused:
> - `getErrorHandler` — commented out in `backend/src/index.ts`
> - `flush` — no callers anywhere

`initialize`, `captureException`, `captureMessage`, `setUser`, `clearUser`, and 3 more (see note above).

### Backend – `console.ts` (7 members)

> **Review note:** Most members are used via the `IErrorTracker` interface contract. Confirmed unused:
> - `getBreadcrumbs` — only used in tests
> - `clearBreadcrumbs` — no callers anywhere

`captureException`, `captureMessage`, `setUser`, `clearUser`, `addBreadcrumb`, and 0 more (see note above).

### Backend – `mock.ts` (5 members)

> **⚠️ Removed — file does not exist.** No `mock.ts` found in `backend/src/services/error-tracking/` or anywhere in the backend. This was a false positive.

### Backend – `local.ts` (3 members)

> **⚠️ Partially removed — FALSE POSITIVE.** `LocalUploadService` at `backend/src/services/upload/local.ts` IS actively used. `uploadAvatar` is called in `routes/upload.routes.ts:76` and `deleteAvatar` in `routes/upload.routes.ts:68,139`. However, `getFileUrl` is only called in tests (`upload.test.ts:206`) — no production caller. Still, it is part of the `IUploadService` interface contract, so the entire class should not be flagged as dead.

### Frontend – Commands (0 members — FALSE POSITIVE)

> **⚠️ Removed — all Command classes are actively used.** `DeleteCommand`, `MoveCommand`, `PropertyCommand`, and `ReorderCommand` are all imported and instantiated across `PropertiesPanel.tsx`, `useCommandFacade.ts`, `LayersPanel.tsx`, `AlignmentToolbar.tsx`, `useTransformHandler.ts`, and `editorStore.ts`. All `name`, `execute`, and `undo` members are part of the active command pattern.

### Additional

... and 10 more members across 6 files.

---

## 🔍 Additional Dead Code Found During Review

> These items were NOT flagged by the tool but were discovered during manual verification.

### Unused config aliases (`backend/src/config/index.ts`)

All 18+ destructured convenience aliases are exported but never imported anywhere:
`serverConfig`, `databaseConfig`, `jwtConfig`, `redisConfig`, `emailConfig`, `smsConfig`, `stripeConfig`, `uploadConfig`, `weatherConfig`, `googleConfig`, `sessionConfig`, `securityConfig`, `loggingConfig`, `jobsConfig`, `monitoringConfig`, `featureFlags`, `cacheConfig`, `paginationConfig`, `businessConfig`, `notificationsConfig`, `apiConfig`, `developmentConfig`

The codebase accesses config via the main `config` object (e.g., `config.jwt.secret`).

### Unused auth middlewares (`backend/src/middleware/auth.ts`)

Four specialized middlewares created via `authorizeCustom` but never wired to routes:
- `authorizeSiteManagement`
- `authorizeAnalytics`
- `authorizeEquipmentManagement`
- `authorizeUserManagement`

### Unused error tracking methods

- `SentryErrorTracker.flush` — no callers
- `SentryErrorTracker.getErrorHandler` — commented out in `backend/src/index.ts`
- `ConsoleErrorTracker.clearBreadcrumbs` — no callers

📖 [Learn more about unused class members](https://docs.fallow.tools/explanations/dead-code#unused-class-members)

---

## ❌ Unresolved Imports (742)

> **⚠️ This entire section is unreliable.** The tool failed to resolve path aliases (`@/`) correctly for many files that DO exist and compile fine. Examples:
>
> - `@/hooks/editor` — **EXISTS** at `frontend/src/hooks/editor/index.ts` (barrel file). Used by `frontend/src/pages/MapEditor.tsx:14` and property components.
> - `@/stores/mapStore`, `@/stores/editorStore` — **EXIST** at `frontend/src/stores/`. Used by `MapEditor.tsx` and `useModuleRenderer.ts`.
> - `@/components/ui/PageLoader`, `@/components/ui/Modal`, `@/components/ui/Button`, etc. — **EXIST** in `frontend/src/components/ui/`.
> - `@/services/api/analytics`, `@/services/api/sites`, `@/services/api/bookings`, etc. — **EXIST** in `frontend/src/services/api/`.
> - `MapEditor.tsx` — **EXISTS** at `frontend/src/pages/MapEditor.tsx` (548 lines).
> - `ReportsPage.tsx` — **EXISTS** at `frontend/src/pages/ReportsPage.tsx`.
> - `UserManagementPage.tsx` — **EXISTS** at `frontend/src/pages/UserManagementPage.tsx`.
> - Only `InventoryManager.tsx` appears to be genuinely missing.
>
> **Conclusion:** The 742 count is a false positive caused by the tool not understanding Vite's `@/` path alias resolution. Do not act on this section without manually verifying each import.

---

## 📦 Unlisted Dependencies (1)

Packages imported in code but missing from `package.json`.

| Package | Location |
| ------- | -------- |
| `idb`   | imported in `frontend/src/utils/indexedDBStorage.ts` but not in any `package.json` |

> **⚠️ Known bug (not in table):** `backend/src/services/error-tracking/__tests__/error-tracking.test.ts:7` imports from `@campsite/shared` — this is a typo. The correct package name is `@campsite-management/shared` (which IS listed in `frontend/package.json`). Fix: change the import to `@campsite-management/shared`.

> **⚠️ Additional finding:** `@campsite-management/shared` is NOT listed in `backend/package.json` at all (neither `dependencies` nor `devDependencies`). The backend imports from it in multiple files (e.g., `analytics.service.ts`, `auth.service.ts`) but the workspace dependency is only declared in `frontend/package.json`. This should be added to `backend/package.json`.

📖 [Learn more about unlisted dependencies](https://docs.fallow.tools/explanations/dead-code#unlisted-dependencies)

---

## 🔄 Duplicate Exports (24)

Same export name defined in multiple files.

| Export                                                                                              | Conflict Between                                                                              |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `CreateBookingInput`, `LoginInput`, `RegisterInput`, `UpdateBookingInput`, `createBookingSchema` +3 | `backend\src\middleware\validate.ts` ↔ `shared\schemas\index.ts` (8 exports)                  |
| `Breadcrumb`, `ErrorContext`, `ErrorLevel`, `ErrorTrackerConfig`, `IErrorTracker` +1                | `backend\src\services\error-tracking\types.ts` ↔ `shared\types\error-tracking.ts` (6 exports) |
| `ValidationErrorDetail`, `validateParams`, `validateQuery`                                          | `backend\src\middleware\validate.ts` ↔ `backend\src\utils\errors.ts` (3 exports)              |
| `ApiError`, `ValidationError`                                                                       | `backend\src\utils\errors.ts` ↔ `shared\types\index.ts` (2 exports)                           |
| `OccupancyMetrics`, `RevenueMetrics`                                                                | `backend\src\services\analytics.service.ts` ↔ `shared\types\index.ts` (2 exports)             |
| `AuthTokens`                                                                                        | `backend\src\services\auth.service.ts` ↔ `shared\types\index.ts`                              |
| `DateRange`                                                                                         | `backend\src\services\analytics.service.ts` ↔ `frontend\src\types\common.ts`                  |
| `LoginCredentials`                                                                                  | `backend\src\services\auth.service.ts` ↔ `frontend\src\types\index.ts`                        |

📖 [Learn more about duplicate exports](https://docs.fallow.tools/explanations/dead-code#duplicate-exports)

---

## ⭕ Circular Dependencies (3)

Files that import each other, forming dependency cycles.

### Cycle 1

```
frontend\src\features\bookings\components\ManualBookingForm.tsx
  → frontend\src\features\bookings\components\index.ts
  → frontend\src\features\bookings\components\ManualBookingForm.tsx
```

### Cycle 2

```
frontend\src\types\booking.ts
  → frontend\src\types\index.ts
  → frontend\src\types\booking.ts
```

### Cycle 3

```
frontend\src\types\equipment.ts
  → frontend\src\types\index.ts
  → frontend\src\types\equipment.ts
```

📖 [Learn more about circular dependencies](https://docs.fallow.tools/explanations/dead-code#circular-dependencies)

---

_Report generated from dead code analysis, manually reviewed to remove false positives_
