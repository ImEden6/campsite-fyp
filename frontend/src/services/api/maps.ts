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
