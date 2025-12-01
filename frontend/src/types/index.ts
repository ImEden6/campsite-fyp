// ==========================================================================
// CONSOLIDATED TYPE RE-EXPORTS
// ==========================================================================
// These types are now defined in dedicated files and re-exported here
// for backward compatibility and centralized access

// Common types (date ranges, shared utilities)
export type {
  DateRange,
  DateRangeFilter,
  LegacyDateRange,
} from './common';

export {
  dateRangeToLegacy,
  legacyToDateRange,
  isValidDateString,
  isValidDateRange,
  formatDateRange,
} from './common';

// Equipment types (filters, availability, rental operations)
export type {
  EquipmentFilters,
  EquipmentAvailabilityParams,
} from './equipment';

export {
  isSingleCategory,
  isCategoryArray,
  isSingleStatus,
  isStatusArray,
  normalizeCategoryFilter,
  normalizeStatusFilter,
  getSearchTerm,
} from './equipment';

// Booking types (filters, booking operations)
export type {
  BookingFilters,
} from './booking';

export {
  isBookingFilters,
  createEmptyBookingFilters,
  hasActiveFilters,
} from './booking';

// ============================================================================
// SHARED BACKEND TYPES
// ============================================================================
// Re-export shared types from backend

export {
  UserRole,
  SiteType,
  SiteStatus,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  EquipmentCategory,
  EquipmentStatus,
  Theme,
  VehicleType,
  MeasurementUnit,
  GroupBookingStatus,
} from '@shared/types';

import type {
  User as SharedUser,
  Site,
  Booking,
  Vehicle,
  Payment,
  Equipment,
  EquipmentRental,
  Notification,
  NotificationType,
  PaginatedResponse,
} from '@shared/types';

export type User = SharedUser;
export type { Site, Booking, Vehicle, Payment, Equipment, EquipmentRental, Notification, NotificationType, PaginatedResponse };

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// GEOMETRY AND LAYOUT TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// ============================================================================
// CAMPSITE MAP MODULE TYPES
// ============================================================================

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
  createdAt: Date;
  updatedAt: Date;
}

export interface CampsiteModule extends CampsiteModuleBase {
  type: 'campsite';
  metadata: {
    name: string;
    capacity: number;
    amenities: string[];
    pricing: {
      basePrice: number;
      seasonalMultiplier: number;
    };
    accessibility: boolean;
    electricHookup: boolean;
    waterHookup: boolean;
    sewerHookup: boolean;
  };
}

export interface ToiletModule extends CampsiteModuleBase {
  type: 'toilet';
  metadata: {
    name: string;
    capacity: number;
    facilities: ('male' | 'female' | 'accessible' | 'family')[];
    maintenanceSchedule: string;
    accessible: boolean;
  };
}

export interface StorageModule extends CampsiteModuleBase {
  type: 'storage';
  metadata: {
    name: string;
    storageType: 'equipment' | 'maintenance' | 'general';
    capacity: number;
    contents: string[];
    accessLevel: 'public' | 'staff' | 'admin';
  };
}

export interface BuildingModule extends CampsiteModuleBase {
  type: 'building';
  metadata: {
    name: string;
    buildingType: 'office' | 'reception' | 'store' | 'restaurant' | 'activity_center' | 'other';
    capacity: number;
    operatingHours: {
      open: string;
      close: string;
    };
    services: string[];
  };
}

export interface ParkingModule extends CampsiteModuleBase {
  type: 'parking';
  metadata: {
    name: string;
    capacity: number;
    vehicleTypes: ('car' | 'rv' | 'motorcycle' | 'bicycle')[];
    accessible: boolean;
  };
}

export interface RoadModule extends CampsiteModuleBase {
  type: 'road';
  metadata: {
    name: string;
    roadType: 'main' | 'secondary' | 'path' | 'emergency';
    surfaceType: 'paved' | 'gravel' | 'dirt' | 'boardwalk';
    width: number;
    speedLimit: number;
    accessLevel: 'public' | 'staff' | 'emergency';
  };
}

export interface WaterSourceModule extends CampsiteModuleBase {
  type: 'water_source';
  metadata: {
    name: string;
    sourceType: 'tap' | 'well' | 'spring' | 'hookup';
    potable: boolean;
    pressure: number;
    capacity: number;
  };
}

export interface ElectricityModule extends CampsiteModuleBase {
  type: 'electricity';
  metadata: {
    name: string;
    voltage: number;
    amperage: number;
    outlets: number;
    circuitType: '15amp' | '30amp' | '50amp';
    weatherproof: boolean;
  };
}

export interface WasteDisposalModule extends CampsiteModuleBase {
  type: 'waste_disposal';
  metadata: {
    name: string;
    disposalType: 'garbage' | 'recycling' | 'compost' | 'sewage';
    capacity: number;
    collectionSchedule: string;
    accessible: boolean;
  };
}

export interface RecreationModule extends CampsiteModuleBase {
  type: 'recreation';
  metadata: {
    name: string;
    activityType: 'playground' | 'sports' | 'swimming' | 'hiking' | 'picnic' | 'fire_pit' | 'other';
    capacity: number;
    equipment: string[];
    ageRestrictions: string;
    safetyRequirements: string[];
  };
}

export interface CustomModule extends CampsiteModuleBase {
  type: 'custom';
  metadata: {
    name: string;
    description: string;
    customType: string;
    properties: Record<string, unknown>;
  };
}

export type AnyModule =
  | CampsiteModule
  | ToiletModule
  | StorageModule
  | BuildingModule
  | ParkingModule
  | RoadModule
  | WaterSourceModule
  | ElectricityModule
  | WasteDisposalModule
  | RecreationModule
  | CustomModule;

// ============================================================================
// CAMPSITE MAP TYPES
// ============================================================================

export interface CampsiteMap {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageSize: Size;
  scale: number; // pixels per meter
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  modules: AnyModule[];
  metadata: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    timezone: string;
    capacity: number;
    amenities: string[];
    rules: string[];
    emergencyContacts: {
      name: string;
      phone: string;
      type: 'fire' | 'police' | 'medical' | 'management';
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CampsiteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: Omit<AnyModule, 'id' | 'createdAt' | 'updatedAt'>[];
  previewImage?: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  type: ModuleType;
  defaultSize: Size;
  defaultMetadata: Record<string, unknown>;
  icon: string;
  color: string;
  category: string;
  previewImage?: string;
  customizable: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MAP EDITOR STATE TYPES
// ============================================================================

export interface ViewportState {
  zoom: number;
  position: Position;
  rotation: number;
}

export interface TransformState {
  type: 'resize' | 'rotate' | 'move' | null;
  moduleIds: string[];
  startBounds: Map<string, { position: Position; size: Size; rotation: number }>;
  currentBounds: Map<string, { position: Position; size: Size; rotation: number }>;
  pivot: Position;
}

export interface EditorState {
  selectedModuleIds: string[];
  clipboardModules: AnyModule[];
  undoStack: CampsiteMap[];
  redoStack: CampsiteMap[];
  maxHistorySize: number;
  isEditing: boolean;
  currentTool: 'select' | 'move' | 'rotate' | 'scale' | 'draw' | 'measure';
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showRulers: boolean;
  showMinimap: boolean;
  layerVisibility: Record<ModuleType, boolean>;
  activeTransform: TransformState | null;
  showShortcutsDialog: boolean;
  pressedKeys: Set<string>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Frontend-specific paginated response with different structure from backend
export interface FrontendPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  success: boolean;
  message?: string;
}

// ============================================================================
// MAP API REQUEST TYPES
// ============================================================================

export interface CreateMapRequest {
  name: string;
  description: string;
  imageFile: File;
  scale: number;
  metadata: CampsiteMap['metadata'];
}

export interface UpdateMapRequest {
  id: string;
  name?: string;
  description?: string;
  imageFile?: File;
  scale?: number;
  metadata?: Partial<CampsiteMap['metadata']>;
}

export interface CreateModuleRequest {
  mapId: string;
  type: ModuleType;
  position: Position;
  size: Size;
  metadata: Record<string, unknown>;
}

export interface UpdateModuleRequest {
  id: string;
  position?: Position;
  size?: Size;
  rotation?: number;
  metadata?: Record<string, unknown>;
  locked?: boolean;
  visible?: boolean;
}

export interface BulkUpdateModulesRequest {
  mapId: string;
  modules: UpdateModuleRequest[];
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface TemplateSearchFilters {
  category?: string;
  type?: ModuleType;
  tags?: string[];
  search?: string;
  isPublic?: boolean;
}

export interface MapSearchFilters {
  search?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}