# Fabric.js Upgrade Findings (v6 -> v7)

## Overview
The project currently uses `fabric` v6.9.0 with `@types/fabric` v5.3.10. Upgrading to v7.2.0 introduces several breaking changes related to how modules and the map factory are initialized.

## Key Changes in Fabric v7

### 1. Class Structure
- **Old:** `fabric.util.createClass` is completely removed.
- **New:** Uses standard ES6 `class extends`.
- **Impact:** Custom modules in `ModuleFactory` must be refactored from functional/util-based definitions to proper class inheritance.

### 2. Static Methods & Utilities
- many `fabric.util.*` methods have been moved to top-level exports or renamed.
- `fabric.util.requestAnimFrame` is now `fabric.util.animFrame`.
- **Impact:** Any custom animation logic for map movements needs updates.

### 3. State Management
- `stateProperties` and `originalState` are handled differently or moved to internal cache.
- **Impact:** `mapOverridesStore` logic that relies on capturing object state might need to use new serialization methods.

### 4. ESM Support
- Fabric 7 is ESM-first.
- **Impact:** Current Vite config handles this well, but some transitive dependencies might still expect CJS.

## ModuleFactory Findings
The `ModuleFactory` (likely in `frontend/src/features/maps/utils/moduleFactory.ts`) uses Fabric's object model to instantiate campsites, toilets, etc.
- **Current:** Likely uses `fabric.Rect` or `fabric.Group` with custom properties.
- **v7 Change:** Recommendation is to use "Subclassing" via classes rather than attaching arbitrary properties to `fabric.*` instances.

## Recommendations for FYP Demo
> [!IMPORTANT]
> Since this is a Final Year Project aimed at a **stable demo**, upgrading Fabric to v7 right before the deadline is **high risk** for low visual reward. 
> 
> **Decision:** Defer the Fabric upgrade until after the core test suite is stabilized, unless the current vulnerabilities in Fabric 6.x are shown to break the build or demo.

## Action Items
1. Update `@types/fabric` to match v6.x to resolve type mismatches first.
2. If proceeding with v7, refactor `ModuleFactory` to use ES6 classes.
