/**
 * Maps API Service
 * Handles all campsite map-related API calls
 */

import { get, post, put, del } from './client';
import type {
  CampsiteMap,
  AnyModule,
  CreateMapRequest,
  UpdateMapRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
  MapSaveModulePayload,
  BulkUpdateModulesRequest,
  ApiResponse
} from '@/types';

/**
 * Get all maps
 */
export const getMaps = async (): Promise<CampsiteMap[]> => {
  const response = await get<ApiResponse<CampsiteMap[]>>('/maps');
  return response.data || [];
};

/**
 * Get map by ID
 */
export const getMapById = async (id: string): Promise<CampsiteMap> => {
  const response = await get<ApiResponse<CampsiteMap>>(`/maps/${id}`);
  return response.data!;
};

/**
 * Create a new map
 */
export const createMap = async (mapData: CreateMapRequest): Promise<CampsiteMap> => {
  const formData = new FormData();
  formData.append('name', mapData.name);
  formData.append('description', mapData.description);
  formData.append('imageFile', mapData.imageFile);
  formData.append('scale', mapData.scale.toString());
  formData.append('metadata', JSON.stringify(mapData.metadata));

  const response = await post<ApiResponse<CampsiteMap>>('/maps', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data!;
};

/**
 * Update map
 */
export const updateMap = async (id: string, mapData: UpdateMapRequest): Promise<CampsiteMap> => {
  const formData = new FormData();

  if (mapData.name) formData.append('name', mapData.name);
  if (mapData.description) formData.append('description', mapData.description);
  if (mapData.imageFile) formData.append('imageFile', mapData.imageFile);
  if (mapData.scale) formData.append('scale', mapData.scale.toString());
  if (mapData.metadata) formData.append('metadata', JSON.stringify(mapData.metadata));

  const response = await put<ApiResponse<CampsiteMap>>(`/maps/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data!;
};

/**
 * Delete map
 */
export const deleteMap = async (id: string): Promise<void> => {
  await del(`/maps/${id}`);
};

/**
 * Add module to map
 */
export const addModule = async (mapId: string, moduleData: CreateModuleRequest): Promise<AnyModule> => {
  const response = await post<ApiResponse<AnyModule>>(`/maps/${mapId}/modules`, moduleData);
  return response.data!;
};

/**
 * Update module
 */
export const updateModule = async (
  mapId: string,
  moduleId: string,
  moduleData: UpdateModuleRequest
): Promise<AnyModule> => {
  const response = await put<ApiResponse<AnyModule>>(`/maps/${mapId}/modules/${moduleId}`, moduleData);
  return response.data!;
};

/**
 * Delete module
 */
export const deleteModule = async (mapId: string, moduleId: string): Promise<void> => {
  await del(`/maps/${mapId}/modules/${moduleId}`);
};

/**
 * Bulk update modules
 */
export const bulkUpdateModules = async (request: BulkUpdateModulesRequest): Promise<AnyModule[]> => {
  const response = await put<ApiResponse<AnyModule[]>>(`/maps/${request.mapId}/modules/bulk`, {
    modules: request.modules,
  });
  return response.data || [];
};

/**
 * Duplicate module
 */
export const duplicateModule = async (mapId: string, moduleId: string): Promise<AnyModule> => {
  const response = await post<ApiResponse<AnyModule>>(`/maps/${mapId}/modules/${moduleId}/duplicate`);
  return response.data!;
};


export interface SaveMapRequest {
  mapId: string;
  modules: MapSaveModulePayload[];
  metadata?: {
    name?: string;
    description?: string;
  };
  clientVersion?: Date; // For optimistic concurrency control
}

export interface SaveMapResponse {
  map: CampsiteMap;
  modules: AnyModule[];
  serverVersion: Date;
}

export const saveMap = async (request: SaveMapRequest): Promise<SaveMapResponse> => {
  try {
    // Try atomic endpoint first
    const response = await post<ApiResponse<SaveMapResponse>>(`/maps/${request.mapId}/save`, {
      modules: request.modules,
      metadata: request.metadata,
      clientVersion: request.clientVersion?.toISOString(),
    });
    return response.data!;
  } catch (error: unknown) {
    // Check if this is a 404 (endpoint not implemented)
    // Works with axios errors which have response.status
    const is404 =
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      error.response !== null &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 404;

    if (is404) {
      // Fallback: Update modules first, then metadata
      const modulesResult = await bulkUpdateModules({
        mapId: request.mapId,
        modules: request.modules,
      });

      let mapResult: CampsiteMap | undefined;
      if (request.metadata && (request.metadata.name || request.metadata.description)) {
        mapResult = await updateMap(request.mapId, {
          id: request.mapId,
          name: request.metadata.name,
          description: request.metadata.description,
        });
      }

      // Get current map state for response
      const currentMap = mapResult || await getMapById(request.mapId);

      return {
        map: currentMap,
        modules: modulesResult,
        serverVersion: currentMap.updatedAt,
      };
    }
    throw error;
  }
};
