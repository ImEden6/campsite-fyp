/**
 * Grid Presets Constants
 * Common grid size presets for map editor
 */

export const GRID_PRESETS = {
  A4: {
    name: 'A4',
    width: 2100, // 210mm at 10px/mm
    height: 2970, // 297mm at 10px/mm
    description: 'A4 Paper (210 × 297 mm)',
  },
  LETTER: {
    name: 'Letter',
    width: 2159, // 8.5" at 254px/inch
    height: 2794, // 11" at 254px/inch
    description: 'US Letter (8.5 × 11 inches)',
  },
  A3: {
    name: 'A3',
    width: 2970,
    height: 4200,
    description: 'A3 Paper (297 × 420 mm)',
  },
  CUSTOM: {
    name: 'Custom',
    width: 0,
    height: 0,
    description: 'Custom dimensions',
  },
} as const;

export type PresetKey = keyof typeof GRID_PRESETS;

