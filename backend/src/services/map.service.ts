import { Prisma, SiteType } from '@prisma/client';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';
import { getPrismaClient } from '@/database';
import cacheService from '@/services/cache.service';

const prisma = getPrismaClient();

const CAMPSITE_MODULE_TYPE = 'campsite';

/** Canvas box for map editor (px). Seed `sizeLength`/`sizeWidth` are lot dimensions in feet — do not use those as Fabric pixels. */
const EDITOR_SITE_VISUAL_SIZE: Record<SiteType, { width: number; height: number }> = {
  [SiteType.CABIN]: { width: 80, height: 60 },
  [SiteType.RV]: { width: 100, height: 40 },
  [SiteType.TENT]: { width: 50, height: 50 },
};

export type SaveMapModuleInput = {
  id: string;
  type?: string;
  x?: number;
  y?: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  metadata?: Record<string, unknown>;
};

function mapSiteTypeToModuleType(type: SiteType): string {
  switch (type) {
    case SiteType.TENT:
    case SiteType.RV:
    case SiteType.CABIN:
      return CAMPSITE_MODULE_TYPE;
    default:
      return CAMPSITE_MODULE_TYPE;
  }
}

function siteRowToModule(site: {
  id: string;
  type: SiteType;
  name: string;
  capacity: number;
  amenities: string[];
  basePrice: number;
  hasElectricity: boolean;
  hasWater: boolean;
  hasSewer: boolean;
  mapPositionX: number | null;
  mapPositionY: number | null;
  sizeLength: number;
  sizeWidth: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  const visual = EDITOR_SITE_VISUAL_SIZE[site.type] ?? { width: 60, height: 60 };
  return {
    id: site.id,
    type: mapSiteTypeToModuleType(site.type),
    position: {
      x: site.mapPositionX ?? 100,
      y: site.mapPositionY ?? 100,
    },
    size: {
      width: visual.width,
      height: visual.height,
    },
    rotation: 0,
    zIndex: 0,
    locked: false,
    visible: true,
    metadata: {
      name: site.name,
      capacity: site.capacity,
      amenities: site.amenities ?? [],
      pricing: {
        basePrice: site.basePrice,
        seasonalMultiplier: 1,
      },
      accessibility: false,
      electricHookup: site.hasElectricity,
      waterHookup: site.hasWater,
      sewerHookup: site.hasSewer,
    },
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  };
}

function facilityRowToModule(f: {
  id: string;
  type: string;
  mapPositionX: number;
  mapPositionY: number;
  sizeLength: number;
  sizeWidth: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  const meta =
    f.metadata && typeof f.metadata === 'object' && !Array.isArray(f.metadata)
      ? (f.metadata as Record<string, unknown>)
      : {};
  return {
    id: f.id,
    type: f.type,
    position: { x: f.mapPositionX, y: f.mapPositionY },
    size: { width: f.sizeLength, height: f.sizeWidth },
    rotation: f.rotation,
    zIndex: f.zIndex,
    locked: f.locked,
    visible: f.visible,
    metadata: meta,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}

function inferSiteType(meta: Record<string, unknown>): SiteType {
  const raw = meta.siteType;
  if (typeof raw === 'string') {
    const u = raw.toUpperCase();
    if (u === 'RV') return SiteType.RV;
    if (u === 'CABIN') return SiteType.CABIN;
    if (u === 'TENT') return SiteType.TENT;
  }
  if (raw === SiteType.RV) return SiteType.RV;
  if (raw === SiteType.CABIN) return SiteType.CABIN;
  if (raw === SiteType.TENT) return SiteType.TENT;
  if (meta.electricHookup && meta.waterHookup && meta.sewerHookup) return SiteType.RV;
  return SiteType.TENT;
}

async function uniqueSiteName(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const slug = (base || 'Site').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Site';
  let candidate = slug;
  let n = 0;
  while (await tx.site.findUnique({ where: { name: candidate }, select: { id: true } })) {
    n += 1;
    candidate = `${slug} (${n})`;
  }
  return candidate;
}

async function invalidateSiteCaches(siteIds: string[]) {
  await cacheService.flushPattern('sites:list:*');
  await Promise.all(siteIds.map((id) => cacheService.delete(`site:${id}`)));
}

/**
 * Service to handle Virtual Map logic.
 * Aggregates `Site` (bookable pads) and `MapFacility` (other editor modules) for the map editor.
 */
export class MapService {
  /**
   * Gets the main campsite map.
   * The `id` parameter selects facilities by `mapId`; sites are global (same as before).
   */
  async getMapById(id: string) {
    try {
      const mapKey = id || 'main-map';

      const [sites, facilities] = await Promise.all([
        prisma.site.findMany({
          where: {
            status: { not: 'OUT_OF_SERVICE' },
            onMap: true,
          },
        }),
        prisma.mapFacility.findMany({
          where: { mapId: mapKey },
        }),
      ]);

      const siteMods = sites.map(siteRowToModule);
      const facMods = facilities.map(facilityRowToModule);
      const modules = [...siteMods, ...facMods].sort((a, b) => {
        if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      return {
        id: mapKey,
        name: 'Main Campsite Map',
        description: 'Auto-generated map from site data',
        imageUrl: '/images/map.png',
        imageSize: { width: 1024, height: 1024 },
        scale: 10,
        bounds: { minX: 0, minY: 0, maxX: 1024, maxY: 1024 },
        gridBounds: { width: 1024, height: 1024 },
        modules,
        backgroundLayer: {
          imageData: '',
          position: { x: 0, y: 0 },
          size: { width: 1024, height: 1024 },
          opacity: 1,
          originalSize: { width: 1024, height: 1024 },
          originalFormat: 'PNG',
          locked: true,
        },
        metadata: {
          address: '',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'UTC',
          capacity: sites.reduce((sum, s) => sum + s.capacity, 0),
          amenities: [],
          rules: [],
          emergencyContacts: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error fetching virtual map', { id, error });
      throw new ApiError(500, 'Failed to fetch map data');
    }
  }

  /**
   * Persists module geometry and creates rows for new campsite / facility modules.
   * Does not delete `Site` rows when removed from the canvas (bookings safety).
   */
  async saveMap(id: string, mapData: { modules?: SaveMapModuleInput[] }) {
    try {
      const mapKey = id || 'main-map';
      const modules = mapData.modules ?? [];

      const touchedSiteIds = new Set<string>();
      const incomingFacilityIds = new Set(
        modules.filter((m) => m.type && m.type !== CAMPSITE_MODULE_TYPE).map((m) => m.id)
      );

      await prisma.$transaction(async (tx) => {
        const moduleIds = [...new Set(modules.map((m) => m.id))];
        const [existingSites, existingFacs] = await Promise.all([
          moduleIds.length
            ? tx.site.findMany({ where: { id: { in: moduleIds } }, select: { id: true } })
            : Promise.resolve([] as { id: string }[]),
          moduleIds.length
            ? tx.mapFacility.findMany({ where: { id: { in: moduleIds } }, select: { id: true } })
            : Promise.resolve([] as { id: string }[]),
        ]);
        const siteIdSet = new Set(existingSites.map((s) => s.id));
        const facIdSet = new Set(existingFacs.map((f) => f.id));

        for (const mod of modules) {
          const px = mod.position?.x ?? mod.x ?? 100;
          const py = mod.position?.y ?? mod.y ?? 100;
          const w = mod.size?.width ?? 60;
          const h = mod.size?.height ?? 60;
          const meta = (mod.metadata ?? {}) as Record<string, unknown>;
          const modType = mod.type;

          const treatAsCampsite =
            modType === CAMPSITE_MODULE_TYPE || modType === undefined || modType === '';

          if (treatAsCampsite) {
            if (facIdSet.has(mod.id)) {
              await tx.mapFacility.delete({ where: { id: mod.id } });
            }
            if (siteIdSet.has(mod.id)) {
              await tx.site.update({
                where: { id: mod.id },
                data: {
                  mapPositionX: px,
                  mapPositionY: py,
                  // Do not overwrite sizeLength/sizeWidth — seed stores lot size in feet; module w/h are editor pixels.
                  onMap: true,
                },
              });
              touchedSiteIds.add(mod.id);
            } else {
              const name = await uniqueSiteName(tx, String(meta.name ?? 'New campsite'));
              const pricing = meta.pricing as { basePrice?: number } | undefined;
              await tx.site.create({
                data: {
                  id: mod.id,
                  name,
                  type: inferSiteType(meta),
                  capacity: Number(meta.capacity) || 4,
                  amenities: Array.isArray(meta.amenities) ? (meta.amenities as string[]) : [],
                  basePrice: Number(pricing?.basePrice) || 25,
                  hasElectricity: Boolean(meta.electricHookup),
                  hasWater: Boolean(meta.waterHookup),
                  hasSewer: Boolean(meta.sewerHookup),
                  sizeLength: w,
                  sizeWidth: h,
                  latitude: 0,
                  longitude: 0,
                  mapPositionX: px,
                  mapPositionY: py,
                  onMap: true,
                },
              });
              touchedSiteIds.add(mod.id);
            }
            continue;
          }

          if (siteIdSet.has(mod.id)) {
            logger.warn('Map save: module type is facility but id matches a Site; updating site only', {
              id: mod.id,
              type: modType,
            });
            await tx.site.update({
              where: { id: mod.id },
              data: {
                mapPositionX: px,
                mapPositionY: py,
                onMap: true,
              },
            });
            touchedSiteIds.add(mod.id);
            continue;
          }

          const facType = modType ?? 'custom';
          const jsonMeta = meta as Prisma.InputJsonValue;

          if (facIdSet.has(mod.id)) {
            await tx.mapFacility.update({
              where: { id: mod.id },
              data: {
                type: facType,
                mapPositionX: px,
                mapPositionY: py,
                sizeLength: w,
                sizeWidth: h,
                rotation: mod.rotation ?? 0,
                zIndex: mod.zIndex ?? 0,
                locked: mod.locked ?? false,
                visible: mod.visible ?? true,
                metadata: jsonMeta,
              },
            });
          } else {
            await tx.mapFacility.create({
              data: {
                id: mod.id,
                mapId: mapKey,
                type: facType,
                mapPositionX: px,
                mapPositionY: py,
                sizeLength: w,
                sizeWidth: h,
                rotation: mod.rotation ?? 0,
                zIndex: mod.zIndex ?? 0,
                locked: mod.locked ?? false,
                visible: mod.visible ?? true,
                metadata: jsonMeta,
              },
            });
          }
        }

        const allFacs = await tx.mapFacility.findMany({
          where: { mapId: mapKey },
          select: { id: true },
        });
        const orphanIds = allFacs.map((f) => f.id).filter((fid) => !incomingFacilityIds.has(fid));
        if (orphanIds.length > 0) {
          await tx.mapFacility.deleteMany({ where: { id: { in: orphanIds } } });
        }

        const incomingCampsiteIds = new Set(
          modules.filter((m) => !m.type || m.type === CAMPSITE_MODULE_TYPE).map((m) => m.id)
        );
        const stillOnMap = await tx.site.findMany({
          where: { onMap: true, status: { not: 'OUT_OF_SERVICE' } },
          select: { id: true },
        });
        const siteIdsToHide = stillOnMap.map((s) => s.id).filter((sid) => !incomingCampsiteIds.has(sid));
        if (siteIdsToHide.length > 0) {
          await tx.site.updateMany({
            where: { id: { in: siteIdsToHide } },
            data: { onMap: false },
          });
          for (const sid of siteIdsToHide) {
            touchedSiteIds.add(sid);
          }
        }
      });

      if (touchedSiteIds.size > 0) {
        await invalidateSiteCaches([...touchedSiteIds]);
      }

      logger.info('Map saved successfully', { id: mapKey, moduleCount: modules.length });

      const map = await this.getMapById(mapKey);
      return {
        map,
        modules: map.modules,
        serverVersion: map.updatedAt,
      };
    } catch (error) {
      logger.error('Error saving map', { id, error });
      throw new ApiError(500, 'Failed to save map data');
    }
  }
}

export default new MapService();
