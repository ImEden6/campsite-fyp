/**
 * Map Editor Constants
 * Centralized constants for the map editor
 */

export const EDITOR_CONSTANTS = {
  // Zoom settings
  ZOOM_SCALE_FACTOR: 1.1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  DEFAULT_ZOOM: 1,

  // Paste/Duplicate offsets
  PASTE_OFFSET: { x: 20, y: 20 },
  DUPLICATE_OFFSET: { x: 20, y: 20 },

  // Grid settings
  GRID_DEFAULT_SIZE: 20,
  GRID_DEFAULT_SNAP: true,
  GRID_DEFAULT_VISIBLE: true,

  // Module constraints
  MIN_MODULE_SIZE: { width: 20, height: 20 },
  MAX_MODULE_SIZE: { width: 10000, height: 10000 },

  // Rotation
  ROTATION_SNAP_ANGLE: 15,

  // History
  MAX_HISTORY_SIZE: 50,

  // Performance
  RAF_THROTTLE_ENABLED: true,
  CACHE_STATIC_ELEMENTS: true,

  // Toast durations (ms)
  TOAST_DURATION: {
    SHORT: 1500,
    MEDIUM: 2000,
    LONG: 3000,
    ERROR: 5000,
  },
} as const;

