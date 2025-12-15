/**
 * Generate Modules from Sites
 * Merges site data (source of truth) with stored user overrides.
 * 
 * Module ID Conventions:
 * - Site-linked modules: `site-${siteId}`
 * - Custom modules: `custom-${uuid}`
 */

import type { Site, CampsiteMap, AnyModule, SiteType } from '@/types';
import { useMapOverridesStore, type SiteModuleOverride } from '@/stores/mapOverridesStore';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default module sizes by site type (in pixels)
 */
const DEFAULT_SIZES: Record<SiteType, { width: number; height: number }> = {
    CABIN: { width: 80, height: 60 },
    RV: { width: 100, height: 40 },
    TENT: { width: 50, height: 50 },
};

const FALLBACK_SIZE = { width: 60, height: 60 };

// ============================================================================
// Module Generation
// ============================================================================

/**
 * Convert a Site to a CampsiteModule, applying any stored overrides.
 * 
 * @param site - The site from the database/mock
 * @param override - Optional stored user override for position/size/rotation
 * @returns A CampsiteModule ready for the map canvas
 */
export function siteToModule(
    site: Site,
    override?: Partial<SiteModuleOverride>
): AnyModule {
    const defaultSize = DEFAULT_SIZES[site.type] ?? FALLBACK_SIZE;

    // Return as AnyModule since we add extended properties for site linking
    return {
        id: `site-${site.id}`,
        type: 'campsite',
        // Visual properties - use override if available, else defaults
        position: override?.position ?? site.location.mapPosition,
        size: override?.size ?? defaultSize,
        rotation: override?.rotation ?? 0,
        zIndex: override?.zIndex ?? 1,
        locked: override?.locked ?? false,
        visible: override?.visible ?? true,
        // Metadata - always from site (source of truth)
        // Extended with siteId/siteType/siteStatus for linking
        metadata: {
            name: site.name,
            siteId: site.id,
            siteType: site.type,
            siteStatus: site.status,
            capacity: site.capacity,
            amenities: site.amenities,
            pricing: {
                basePrice: site.basePrice,
                seasonalMultiplier: 1,
            },
            accessibility: false,
            electricHookup: site.hasElectricity,
            waterHookup: site.hasWater,
            sewerHookup: site.hasSewer,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    } as AnyModule;
}

/**
 * Generate a complete CampsiteMap from sites, applying stored overrides.
 * 
 * This function:
 * 1. Cleans up orphaned overrides (deleted sites) - once per session
 * 2. Generates modules from sites with overrides applied
 * 3. Includes custom modules (toilets, parking, etc.)
 * 4. Calculates appropriate map bounds
 * 
 * @param sites - Array of sites from the database/mock
 * @returns A complete CampsiteMap ready for rendering
 */
export function generateMapFromSites(sites: Site[]): CampsiteMap {
    const { siteOverrides, customModules, mapSettings, cleanupOrphanedOverrides } =
        useMapOverridesStore.getState();

    // Cleanup orphaned overrides (only runs once per session)
    cleanupOrphanedOverrides(sites.map((s) => s.id));

    // Generate modules from sites with overrides
    const siteModules: AnyModule[] = sites.map((site) => {
        const override = siteOverrides[site.id];
        return siteToModule(site, override);
    });

    // Include custom modules (already typed correctly)
    const allModules: AnyModule[] = [...siteModules, ...customModules as AnyModule[]];

    // Calculate map bounds to fit all modules with padding
    const PADDING = 100;
    const DEFAULT_MIN_WIDTH = 1000;
    const DEFAULT_MIN_HEIGHT = 800;

    let maxX = DEFAULT_MIN_WIDTH;
    let maxY = DEFAULT_MIN_HEIGHT;

    for (const module of allModules) {
        const moduleRight = module.position.x + module.size.width;
        const moduleBottom = module.position.y + module.size.height;
        if (moduleRight > maxX) maxX = moduleRight;
        if (moduleBottom > maxY) maxY = moduleBottom;
    }

    maxX += PADDING;
    maxY += PADDING;

    return {
        id: 'campsite-map',
        name: 'Campsite Map',
        description: 'Main campsite layout with all sites',
        imageUrl: '',
        imageSize: { width: maxX, height: maxY },
        scale: mapSettings.scale,
        bounds: { minX: 0, minY: 0, maxX, maxY },
        modules: allModules,
        metadata: {
            address: 'Campsite Address',
            coordinates: { latitude: 34.0522, longitude: -118.2437 },
            timezone: 'America/Los_Angeles',
            capacity: sites.reduce((sum, s) => sum + s.capacity, 0),
            amenities: [],
            rules: [],
            emergencyContacts: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

/**
 * Check if a module ID is site-linked
 */
export function isSiteModule(moduleId: string): boolean {
    return moduleId.startsWith('site-');
}

/**
 * Extract site ID from a module ID
 */
export function getSiteIdFromModuleId(moduleId: string): string | null {
    if (moduleId.startsWith('site-')) {
        return moduleId.slice(5);
    }
    return null;
}

/**
 * Check if a module ID is custom (not linked to a site)
 */
export function isCustomModule(moduleId: string): boolean {
    return moduleId.startsWith('custom-');
}
