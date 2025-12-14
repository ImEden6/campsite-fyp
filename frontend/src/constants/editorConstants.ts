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

  // Panel dimensions
  PANEL: {
    TOOLBOX_WIDTH: 200,
    TOOLBOX_COLLAPSED_WIDTH: 48,
    PROPERTIES_WIDTH: 280,
    LAYERS_WIDTH: 240,
  },

  // Ruler settings
  RULER: {
    SIZE: 20,
    TICK_SMALL: 10,
    TICK_MEDIUM: 50,
    TICK_LARGE: 100,
    COLOR: 'oklch(0.243 0.03 283.9)',
    TEXT_COLOR: 'oklch(0.879 0.043 272.3)',
    TICK_COLOR: 'oklch(0.55 0.034 277.1)',
  },

  // Guide settings
  GUIDE: {
    COLOR: 'oklch(0.729 0.126 210.8)',
    STROKE_WIDTH: 1,
    DASH_ARRAY: [5, 5],
    SNAP_THRESHOLD: 5,
  },

  // Background image constraints
  BACKGROUND: {
    MAX_WIDTH: 4000,
    MAX_HEIGHT: 4000,
    MIN_WIDTH: 400,
    MIN_HEIGHT: 300,
    VALID_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  },
} as const;

