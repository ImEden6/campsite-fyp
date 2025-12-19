# Maps API Documentation

This document describes the Maps API service for the frontend, which handles all campsite map-related operations including map management and interactive module placement.

## Overview

The Maps API service provides a type-safe interface for:
- Managing campsite maps (CRUD operations)
- Adding, updating, and deleting map modules (sites, amenities, structures)
- Bulk operations for efficient map editing
- Module duplication for quick layout creation

## Service Location

```typescript
import * as mapsApi from '@/services/api/maps';
```

## Type Definitions

### Request Types

```typescript
interface CreateMapRequest {
  name: string;
  description: string;
  imageFile: File;
  scale: number;
  metadata?: Record<string, any>;
}

interface UpdateMapRequest {
  name?: string;
  description?: string;
  imageFile?: File;
  scale?: number;
  metadata?: Record<string, any>;
}

interface CreateModuleRequest {
  type: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
}

interface UpdateModuleRequest {
  position?: { x: number; y: number };
  properties?: Record<string, any>;
}

interface BulkUpdateModulesRequest {
  mapId: string;
  modules: Array<{
    id: string;
    position?: { x: number; y: number };
    properties?: Record<string, any>;
  }>;
}
```

### Response Types

```typescript
interface CampsiteMap {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  scale: number;
  metadata: Record<string, any>;
  modules: AnyModule[];
  createdAt: Date;
  updatedAt: Date;
}

type AnyModule = SiteModule | AmenityModule | StructureModule;
```

## API Methods

### Map Management

#### getMaps()

Retrieves all campsite maps.

```typescript
const maps = await mapsApi.getMaps();
```

**Returns**: `Promise<CampsiteMap[]>`

**Example Response**:
```json
[
  {
    "id": "map-123",
    "name": "Main Campground",
    "description": "Primary camping area with 50 sites",
    "imageUrl": "/uploads/maps/main-campground.jpg",
    "scale": 1.0,
    "metadata": {},
    "modules": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### getMapById(id)

Retrieves a specific map by ID with all its modules.

```typescript
const map = await mapsApi.getMapById('map-123');
```

**Parameters**:
- `id` (string): Map ID

**Returns**: `Promise<CampsiteMap>`

**Example Response**:
```json
{
  "id": "map-123",
  "name": "Main Campground",
  "description": "Primary camping area",
  "imageUrl": "/uploads/maps/main-campground.jpg",
  "scale": 1.0,
  "metadata": {},
  "modules": [
    {
      "id": "module-1",
      "type": "site",
      "position": { "x": 100, "y": 150 },
      "properties": {
        "siteNumber": "A-1",
        "siteType": "RV",
        "capacity": 4
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### createMap(mapData)

Creates a new campsite map with a background image.

```typescript
const newMap = await mapsApi.createMap({
  name: 'North Campground',
  description: 'Northern camping area',
  imageFile: file, // File object from input
  scale: 1.0,
  metadata: { region: 'north' }
});
```

**Parameters**:
- `mapData` (CreateMapRequest): Map creation data

**Returns**: `Promise<CampsiteMap>`

**Notes**:
- Uses `multipart/form-data` for file upload
- `imageFile` must be a valid File object
- Supported image formats: JPG, PNG, WebP
- Maximum file size: 10MB

---

#### updateMap(id, mapData)

Updates an existing map. All fields are optional.

```typescript
const updatedMap = await mapsApi.updateMap('map-123', {
  name: 'Main Campground - Updated',
  scale: 1.2
});
```

**Parameters**:
- `id` (string): Map ID
- `mapData` (UpdateMapRequest): Fields to update

**Returns**: `Promise<CampsiteMap>`

**Notes**:
- Only provided fields are updated
- Use `imageFile` to replace the background image
- Uses `multipart/form-data` if image is included

---

#### deleteMap(id)

Deletes a map and all its modules.

```typescript
await mapsApi.deleteMap('map-123');
```

**Parameters**:
- `id` (string): Map ID

**Returns**: `Promise<void>`

**Warning**: This operation is irreversible and deletes all associated modules.

---

### Module Management

#### addModule(mapId, moduleData)

Adds a new module (site, amenity, or structure) to a map.

```typescript
const newModule = await mapsApi.addModule('map-123', {
  type: 'site',
  position: { x: 200, y: 300 },
  properties: {
    siteNumber: 'B-5',
    siteType: 'tent',
    capacity: 6,
    amenities: ['water', 'electric']
  }
});
```

**Parameters**:
- `mapId` (string): Map ID
- `moduleData` (CreateModuleRequest): Module data

**Returns**: `Promise<AnyModule>`

**Module Types**:
- `site`: Campsite location
- `amenity`: Facility (restroom, shower, etc.)
- `structure`: Building or landmark

---

#### updateModule(mapId, moduleId, moduleData)

Updates an existing module's position or properties.

```typescript
const updatedModule = await mapsApi.updateModule('map-123', 'module-1', {
  position: { x: 250, y: 350 },
  properties: {
    capacity: 8
  }
});
```

**Parameters**:
- `mapId` (string): Map ID
- `moduleId` (string): Module ID
- `moduleData` (UpdateModuleRequest): Fields to update

**Returns**: `Promise<AnyModule>`

---

#### deleteModule(mapId, moduleId)

Removes a module from the map.

```typescript
await mapsApi.deleteModule('map-123', 'module-1');
```

**Parameters**:
- `mapId` (string): Map ID
- `moduleId` (string): Module ID

**Returns**: `Promise<void>`

---

#### bulkUpdateModules(request)

Updates multiple modules in a single request. Useful for drag-and-drop operations.

```typescript
const updatedModules = await mapsApi.bulkUpdateModules({
  mapId: 'map-123',
  modules: [
    {
      id: 'module-1',
      position: { x: 100, y: 200 }
    },
    {
      id: 'module-2',
      position: { x: 150, y: 250 }
    }
  ]
});
```

**Parameters**:
- `request` (BulkUpdateModulesRequest): Bulk update data

**Returns**: `Promise<AnyModule[]>`

**Use Cases**:
- Moving multiple modules at once
- Batch property updates
- Optimizing network requests during editing

---

#### duplicateModule(mapId, moduleId)

Creates a copy of an existing module with a slight position offset.

```typescript
const duplicatedModule = await mapsApi.duplicateModule('map-123', 'module-1');
```

**Parameters**:
- `mapId` (string): Map ID
- `moduleId` (string): Module ID to duplicate

**Returns**: `Promise<AnyModule>`

**Notes**:
- New module is positioned slightly offset from original
- All properties are copied
- Useful for creating similar sites quickly

---

## Usage with React Query

The Maps API is designed to work seamlessly with React Query for caching and state management.

### Example: Fetching Maps

```typescript
import { useQuery } from '@tanstack/react-query';
import * as mapsApi from '@/services/api/maps';

function MapsList() {
  const { data: maps, isLoading } = useQuery({
    queryKey: ['maps'],
    queryFn: mapsApi.getMaps
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {maps?.map(map => (
        <div key={map.id}>{map.name}</div>
      ))}
    </div>
  );
}
```

### Example: Creating a Map

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as mapsApi from '@/services/api/maps';

function CreateMapForm() {
  const queryClient = useQueryClient();

  const createMapMutation = useMutation({
    mutationFn: mapsApi.createMap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maps'] });
    }
  });

  const handleSubmit = (formData: CreateMapRequest) => {
    createMapMutation.mutate(formData);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example: Bulk Update with Optimistic Updates

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as mapsApi from '@/services/api/maps';

function MapEditor({ mapId }: { mapId: string }) {
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: mapsApi.bulkUpdateModules,
    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['maps', mapId] });

      // Snapshot previous value
      const previousMap = queryClient.getQueryData(['maps', mapId]);

      // Optimistically update
      queryClient.setQueryData(['maps', mapId], (old: CampsiteMap) => ({
        ...old,
        modules: old.modules.map(module => {
          const update = request.modules.find(m => m.id === module.id);
          return update ? { ...module, ...update } : module;
        })
      }));

      return { previousMap };
    },
    onError: (err, request, context) => {
      // Rollback on error
      queryClient.setQueryData(['maps', mapId], context?.previousMap);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['maps', mapId] });
    }
  });

  return <div>...</div>;
}
```

## Error Handling

All API methods throw errors that should be caught and handled appropriately.

```typescript
try {
  const map = await mapsApi.getMapById('invalid-id');
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Map not found');
  } else {
    console.error('Failed to fetch map:', error.message);
  }
}
```

## Best Practices

1. **Use React Query**: Leverage caching and automatic refetching
2. **Bulk Operations**: Use `bulkUpdateModules` for multiple changes
3. **Optimistic Updates**: Improve UX with optimistic UI updates
4. **Error Boundaries**: Wrap map editor in error boundaries
5. **File Validation**: Validate image files before upload
6. **Debounce Updates**: Debounce position updates during drag operations

## Related Documentation

- [Map Editor User Guide](../user-guide/map-editor.md)
- [WebSocket Events](./websocket.md)
- [API Client Types](./README.md#frontend-api-client)

## Support

For API issues or questions:
- Check the [Development Setup Guide](../development/setup.md)
- Review [UI Components Documentation](../development/ui-components.md)
- Contact: support@campsite-system.com
