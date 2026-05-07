import { describe, it, expect } from 'vitest';
import { SiteStatus, SiteType } from '@prisma/client';
import { normalizeSiteCreateBody, normalizeSiteUpdateBody } from '@/utils/sitePayload';

describe('sitePayload', () => {
  it('normalizeSiteCreateBody maps nested size and location', () => {
    const row = normalizeSiteCreateBody({
      name: 'Lake A',
      type: 'TENT',
      capacity: 4,
      basePrice: 55,
      amenities: ['Fire Pit'],
      images: ['/uploads/site_x.webp'],
      maxVehicles: 1,
      maxTents: 2,
      size: { length: 40, width: 35, unit: 'feet' },
      location: {
        latitude: 12.5,
        longitude: -98.25,
        mapPosition: { x: 120, y: 340 },
      },
    });

    expect(row.name).toBe('Lake A');
    expect(row.type).toBe(SiteType.TENT);
    expect(row.status).toBe(SiteStatus.AVAILABLE);
    expect(row.sizeLength).toBe(40);
    expect(row.sizeWidth).toBe(35);
    expect(row.sizeUnit).toBe('feet');
    expect(row.latitude).toBe(12.5);
    expect(row.longitude).toBe(-98.25);
    expect(row.mapPositionX).toBe(120);
    expect(row.mapPositionY).toBe(340);
    expect(row.images).toEqual(['/uploads/site_x.webp']);
  });

  it('normalizeSiteUpdateBody merges nested size only when provided', () => {
    const upd = normalizeSiteUpdateBody({
      size: { length: 10, width: 8, unit: 'meters' },
    });
    expect(upd.sizeLength).toBe(10);
    expect(upd.sizeWidth).toBe(8);
    expect(upd.sizeUnit).toBe('meters');
    expect(upd.name).toBeUndefined();
  });
});
