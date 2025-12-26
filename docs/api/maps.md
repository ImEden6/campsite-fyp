# Maps API Documentation

> [!NOTE]
> **Implementation Status**: This document describes a **Hybrid Implementation**. 
> - **Current**: Map layouts are generated from `Site` data. Visual overrides (position, size, rotation) are persisted client-side in `IndexedDB` via the `MapOverridesStore`.
> - **Planned**: A full server-side Maps API for managing multiple map versions and centralized module storage.

## Overview

The Maps API system provides a type-safe interface for managing campsite maps. In its current state, it handles:
- Dynamic generation of map modules from existing campsite data.
- Persistence of visual layout customizations.
- Interactive module placement and transformation.

## Architectural Approach

### Current (Hybrid)
1. **Source of Truth**: Campsite sites (`/api/v1/campsites`) provide the primary data.
2. **Visual Overrides**: The `MapEditor` uses a client-side store (`mapStore` and `mapOverridesStore`) to manage positions.
3. **Storage**: Customizations are stored in the browser's `IndexedDB` to persist between sessions.

### Planned (Server-Side)
The `services/api/maps.ts` file contains a skeleton for the future REST API. Once implemented, this will allow:
- Multi-map support (e.g., North vs. South campground).
- Collaborative editing via WebSockets.
- Centralized storage of non-site modules (amenities, structures).

---

## Type Definitions

### Module Types
Defined in `frontend/src/types/index.ts`:

```typescript
export type ModuleType =
  | 'campsite'
  | 'toilet'
  | 'storage'
  | 'building'
  | 'parking'
  | 'road'
  | 'water_source'
  | 'electricity'
  | 'waste_disposal'
  | 'recreation'
  | 'custom';

export interface Position { x: number; y: number; }
export interface Size { width: number; height: number; }

export interface CampsiteModuleBase {
  id: string;
  type: ModuleType;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  metadata: Record<string, unknown>;
}
```

### Map Type
```typescript
export interface CampsiteMap {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageSize: Size;
  scale: number;
  modules: AnyModule[];
  // ... metadata and timestamps
}
```

---

## Current Implementation (Client-Side)

### Map Overrides Store
Persistence is handled via `useMapOverridesStore` which utilizes `IndexedDB`.

```typescript
// frontend/src/stores/mapOverridesStore.ts
const { setSiteOverride } = useMapOverridesStore();

// Saving a position change
setSiteOverride(siteId, {
    position: { x: 100, y: 200 },
    rotation: 45
});
```

---

## Planned API Methods (Future)

> [!WARNING]
> The following methods are defined in `services/api/maps.ts` but are **not yet connected** to a backend implementation.

### Map Management

#### getMaps()
`GET /maps` - Retrieves all campsite maps.

#### createMap(mapData)
`POST /maps` - Creates a new map with a background image.

### Module Management

#### addModule(mapId, moduleData)
`POST /maps/:mapId/modules` - Adds a module to a map.

#### bulkUpdateModules(request)
`PUT /maps/:mapId/modules/bulk` - Batch updates for performance.

---

## Usage with React Query

The frontend is prepared to use React Query once the backend routes are available.

```typescript
import { useQuery } from '@tanstack/react-query';
import * as mapsApi from '@/services/api/maps';

// Planned usage
const { data: maps } = useQuery({
  queryKey: ['maps'],
  queryFn: mapsApi.getMaps
});
```

## Best Practices

1. **Sites as Foundation**: Always link campsite modules to real `Site` IDs to maintain data integrity.
2. **Debounce Updates**: When saving overrides, use debouncing to prevent excessive `IndexedDB` writes during drag operations.
3. **Coordinate System**: All positions are relative to the map canvas origin (0,0) at scale 1.0.

## Related Documentation

- [Map Editor Implementation](../development/ui-components.md#map-editor)
- [Client-Side Persistence](../development/storage.md)
- [WebSocket Strategy](./websocket.md) (Planned)
