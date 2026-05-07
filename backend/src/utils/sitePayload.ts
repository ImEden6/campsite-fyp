/**
 * Normalize API payloads (nested size/location from frontend) to Prisma Site fields.
 */

import type { Prisma } from '@prisma/client';
import { SiteStatus, SiteType } from '@prisma/client';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function coalesceSize(body: Record<string, unknown>): { length: number; width: number; unit: string } {
  const nested = asRecord(body.size);
  if (nested && typeof nested.length === 'number') {
    return {
      length: nested.length,
      width: typeof nested.width === 'number' ? nested.width : nested.length,
      unit: typeof nested.unit === 'string' ? nested.unit : 'feet',
    };
  }
  return {
    length: Number(body.sizeLength) || 30,
    width: Number(body.sizeWidth) || 20,
    unit: typeof body.sizeUnit === 'string' ? body.sizeUnit : 'feet',
  };
}

function coalesceLocation(body: Record<string, unknown>): {
  latitude: number;
  longitude: number;
  mapPositionX: number;
  mapPositionY: number;
} {
  const loc = asRecord(body.location);
  const mapPos = loc ? asRecord(loc.mapPosition) : null;
  if (loc && (typeof loc.latitude === 'number' || typeof loc.longitude === 'number' || mapPos)) {
    return {
      latitude: typeof loc.latitude === 'number' ? loc.latitude : Number(loc.latitude ?? 0),
      longitude: typeof loc.longitude === 'number' ? loc.longitude : Number(loc.longitude ?? 0),
      mapPositionX:
        typeof mapPos?.x === 'number' ? mapPos.x : typeof body.mapPositionX === 'number' ? body.mapPositionX : 0,
      mapPositionY:
        typeof mapPos?.y === 'number' ? mapPos.y : typeof body.mapPositionY === 'number' ? body.mapPositionY : 0,
    };
  }
  return {
    latitude: Number(body.latitude ?? 0),
    longitude: Number(body.longitude ?? 0),
    mapPositionX: Number(body.mapPositionX ?? 0),
    mapPositionY: Number(body.mapPositionY ?? 0),
  };
}

/** Build Prisma create input from POST body (nested or flat). */
export function normalizeSiteCreateBody(body: Record<string, unknown>): Prisma.SiteUncheckedCreateInput {
  const size = coalesceSize(body);
  const loc = coalesceLocation(body);

  const type =
    typeof body.type === 'string' && (Object.values(SiteType) as string[]).includes(body.type)
      ? (body.type as SiteType)
      : SiteType.TENT;

  const status =
    typeof body.status === 'string' && (Object.values(SiteStatus) as string[]).includes(body.status)
      ? (body.status as SiteStatus)
      : SiteStatus.AVAILABLE;

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const capacity = Math.max(1, Number(body.capacity) || 1);
  const basePrice = Math.max(0, Number(body.basePrice) || 0);

  const amenities = Array.isArray(body.amenities)
    ? (body.amenities as unknown[]).filter((a): a is string => typeof a === 'string')
    : [];

  const images = Array.isArray(body.images)
    ? (body.images as unknown[]).filter((u): u is string => typeof u === 'string')
    : [];

  const row: Prisma.SiteUncheckedCreateInput = {
    name,
    type,
    status,
    capacity,
    description: typeof body.description === 'string' ? body.description : undefined,
    amenities,
    images,
    basePrice,
    maxVehicles: Number(body.maxVehicles ?? 2),
    maxTents: Number(body.maxTents ?? 1),
    isPetFriendly: Boolean(body.isPetFriendly),
    hasElectricity: Boolean(body.hasElectricity),
    hasWater: Boolean(body.hasWater),
    hasSewer: Boolean(body.hasSewer),
    hasWifi: Boolean(body.hasWifi),
    sizeLength: size.length,
    sizeWidth: size.width,
    sizeUnit: size.unit,
    latitude: loc.latitude,
    longitude: loc.longitude,
    mapPositionX: loc.mapPositionX,
    mapPositionY: loc.mapPositionY,
  };
  if (typeof body.onMap === 'boolean') {
    row.onMap = body.onMap;
  }
  return row;
}

/** Partial update: merge nested fragments into flat Prisma fields. */
export function normalizeSiteUpdateBody(body: Record<string, unknown>): Prisma.SiteUpdateInput {
  const out: Prisma.SiteUpdateInput = {};

  if (typeof body.name === 'string') out.name = body.name.trim();
  if (typeof body.type === 'string' && (Object.values(SiteType) as string[]).includes(body.type)) {
    out.type = body.type as SiteType;
  }
  if (typeof body.status === 'string' && (Object.values(SiteStatus) as string[]).includes(body.status)) {
    out.status = body.status as SiteStatus;
  }
  if (body.capacity !== undefined) out.capacity = Math.max(1, Number(body.capacity) || 1);
  if (body.description !== undefined) {
    out.description = typeof body.description === 'string' ? body.description : null;
  }
  if (Array.isArray(body.amenities)) {
    out.amenities = (body.amenities as unknown[]).filter((a): a is string => typeof a === 'string');
  }
  if (Array.isArray(body.images)) {
    out.images = (body.images as unknown[]).filter((u): u is string => typeof u === 'string');
  }
  if (body.basePrice !== undefined) out.basePrice = Math.max(0, Number(body.basePrice) || 0);
  if (body.maxVehicles !== undefined) out.maxVehicles = Number(body.maxVehicles);
  if (body.maxTents !== undefined) out.maxTents = Number(body.maxTents);
  if (body.isPetFriendly !== undefined) out.isPetFriendly = Boolean(body.isPetFriendly);
  if (body.hasElectricity !== undefined) out.hasElectricity = Boolean(body.hasElectricity);
  if (body.hasWater !== undefined) out.hasWater = Boolean(body.hasWater);
  if (body.hasSewer !== undefined) out.hasSewer = Boolean(body.hasSewer);
  if (body.hasWifi !== undefined) out.hasWifi = Boolean(body.hasWifi);
  if (typeof body.onMap === 'boolean') out.onMap = body.onMap;

  const fakeBody = { ...body, ...(body.size !== undefined ? { size: body.size } : {}) };
  if (body.size !== undefined || body.sizeLength !== undefined || body.sizeWidth !== undefined || body.sizeUnit !== undefined) {
    const size = coalesceSize(fakeBody);
    out.sizeLength = size.length;
    out.sizeWidth = size.width;
    out.sizeUnit = size.unit;
  }

  if (
    body.location !== undefined ||
    body.latitude !== undefined ||
    body.longitude !== undefined ||
    body.mapPositionX !== undefined ||
    body.mapPositionY !== undefined
  ) {
    const loc = coalesceLocation(fakeBody);
    out.latitude = loc.latitude;
    out.longitude = loc.longitude;
    out.mapPositionX = loc.mapPositionX;
    out.mapPositionY = loc.mapPositionY;
  }

  return out;
}
