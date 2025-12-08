/**
 * Lucide Icon Paths for Konva
 * SVG path data for Lucide icons used in module rendering
 * These paths match the icons used in the ModuleLibrary component
 */

import type { ModuleType } from '@/types';

/**
 * SVG path data for Lucide icons
 * These are the actual path strings from lucide-react icons
 */
export const lucideIconPaths: Record<ModuleType, string> = {
  campsite: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  toilet: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18 M6 12h12 M6 12V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4',
  storage: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18 M6 12h12 M6 12V8h12v4 M6 12h12 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
  parking: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.7 10c-.3-.1-.5-.4-.5-.7V5c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v4.3c0 .3-.2.6-.5.7l-1.8.6c-.8.2-1.5 1-1.5 1.9V16c0 .6.4 1 1 1h2 M5 17H3c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v11c0 .6-.4 1-1 1z',
  road: 'M17.5 19H9a7 7 0 0 1-5-11.562M15 5l3-3M15 2l3 3M12 22v-8.5M9.5 2.328A10 10 0 0 1 12 2a10 10 0 0 1 5 1.292M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0z',
  water_source: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  electricity: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  waste_disposal: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2 M10 11v6 M14 11v6',
  recreation: 'M17.5 19H9a7 7 0 0 1-5-11.562M15 5l3-3M15 2l3 3M12 22v-8.5M9.5 2.328A10 10 0 0 1 12 2a10 10 0 0 1 5 1.292M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0z',
  custom: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
};

/**
 * Get the SVG path for a module type
 */
export function getModuleIconPath(type: ModuleType): string {
  return lucideIconPaths[type] || lucideIconPaths.custom;
}
