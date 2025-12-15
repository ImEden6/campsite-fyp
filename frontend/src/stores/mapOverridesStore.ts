/**
 * Map Overrides Store
 * Persists user customizations (positions, sizes, rotations) for map modules.
 * Sites remain the source of truth for metadata; this only stores visual overrides.
 * 
 * Uses IndexedDB for persistence via the existing indexedDBStorage adapter.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/utils/indexedDBStorage';
import type { ModuleType } from '@/types';

// ============================================================================
// Types (exported for use in generateModulesFromSites.ts)
// ============================================================================

/**
 * Override for a site-linked module.
 * Module ID convention: `site-${siteId}`
 */
export interface SiteModuleOverride {
    siteId: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    zIndex: number;
    locked: boolean;
    visible: boolean;
}

/**
 * Custom module not linked to any site (e.g., toilets, parking, roads).
 * Module ID convention: `custom-${uuid}`
 */
export interface CustomModuleData {
    id: string;
    type: Exclude<ModuleType, 'campsite'>;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    zIndex: number;
    locked: boolean;
    visible: boolean;
    metadata: Record<string, unknown>;
}

/**
 * Map-level settings
 */
export interface MapSettings {
    scale: number;
    viewportCenter?: { x: number; y: number };
}

// ============================================================================
// Store State & Actions
// ============================================================================

interface MapOverridesState {
    /** Map of siteId -> visual override */
    siteOverrides: Record<string, SiteModuleOverride>;
    /** Custom modules (toilets, parking, roads, etc.) */
    customModules: CustomModuleData[];
    /** Map-level settings */
    mapSettings: MapSettings;
    /** Flag to track if cleanup has run this session */
    _cleanupRan: boolean;
}

interface MapOverridesActions {
    // Site overrides
    setSiteOverride: (siteId: string, override: Partial<SiteModuleOverride>) => void;
    removeSiteOverride: (siteId: string) => void;

    // Custom modules
    addCustomModule: (module: CustomModuleData) => void;
    updateCustomModule: (id: string, changes: Partial<CustomModuleData>) => void;
    removeCustomModule: (id: string) => void;

    // Map settings
    setMapSettings: (settings: Partial<MapSettings>) => void;

    // Cleanup & reset
    cleanupOrphanedOverrides: (validSiteIds: string[]) => void;
    clearSiteOverrides: () => void;
    clearAll: () => void;
}

type MapOverridesStore = MapOverridesState & MapOverridesActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useMapOverridesStore = create<MapOverridesStore>()(
    persist(
        (set, get) => ({
            // Initial state
            siteOverrides: {},
            customModules: [],
            mapSettings: { scale: 1 },
            _cleanupRan: false,

            // Site override actions
            setSiteOverride: (siteId, override) => set((state) => ({
                siteOverrides: {
                    ...state.siteOverrides,
                    [siteId]: {
                        siteId,
                        position: override.position ?? state.siteOverrides[siteId]?.position ?? { x: 0, y: 0 },
                        size: override.size ?? state.siteOverrides[siteId]?.size ?? { width: 60, height: 60 },
                        rotation: override.rotation ?? state.siteOverrides[siteId]?.rotation ?? 0,
                        zIndex: override.zIndex ?? state.siteOverrides[siteId]?.zIndex ?? 1,
                        locked: override.locked ?? state.siteOverrides[siteId]?.locked ?? false,
                        visible: override.visible ?? state.siteOverrides[siteId]?.visible ?? true,
                    },
                },
            })),

            removeSiteOverride: (siteId) => set((state) => {
                const { [siteId]: _, ...rest } = state.siteOverrides;
                return { siteOverrides: rest };
            }),

            // Custom module actions
            addCustomModule: (module) => set((state) => ({
                customModules: [...state.customModules, module],
            })),

            updateCustomModule: (id, changes) => set((state) => ({
                customModules: state.customModules.map((m) =>
                    m.id === id ? { ...m, ...changes } : m
                ),
            })),

            removeCustomModule: (id) => set((state) => ({
                customModules: state.customModules.filter((m) => m.id !== id),
            })),

            // Map settings
            setMapSettings: (settings) => set((state) => ({
                mapSettings: { ...state.mapSettings, ...settings },
            })),

            // Cleanup orphaned overrides (for deleted sites)
            // Only runs once per session to avoid performance issues
            cleanupOrphanedOverrides: (validSiteIds) => {
                const state = get();
                if (state._cleanupRan) return; // Skip if already ran this session

                const validSet = new Set(validSiteIds);
                const cleaned: Record<string, SiteModuleOverride> = {};
                let hasOrphans = false;

                for (const [siteId, override] of Object.entries(state.siteOverrides)) {
                    if (validSet.has(siteId)) {
                        cleaned[siteId] = override;
                    } else {
                        hasOrphans = true;
                        console.log(`[MapOverrides] Removing orphaned override for deleted site: ${siteId}`);
                    }
                }

                if (hasOrphans) {
                    set({ siteOverrides: cleaned, _cleanupRan: true });
                } else {
                    set({ _cleanupRan: true });
                }
            },

            // Clear only site overrides (keeps custom modules)
            clearSiteOverrides: () => set({ siteOverrides: {} }),

            // Clear everything
            clearAll: () => set({
                siteOverrides: {},
                customModules: [],
                mapSettings: { scale: 1 },
                _cleanupRan: false,
            }),
        }),
        {
            name: 'map-overrides',
            storage: createJSONStorage(() => indexedDBStorage),
        }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectSiteOverride = (siteId: string) => (state: MapOverridesStore) =>
    state.siteOverrides[siteId];

export const selectCustomModules = (state: MapOverridesStore) =>
    state.customModules;

export const selectMapScale = (state: MapOverridesStore) =>
    state.mapSettings.scale;
