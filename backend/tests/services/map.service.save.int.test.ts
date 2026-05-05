import { describe, it, expect, afterEach } from 'vitest';
import mapService from '@/services/map.service';
import prisma from '@/database';
describe('MapService.saveMap', () => {
  const testMapIds: string[] = [];
  const testFacilityIds: string[] = [];

  afterEach(async () => {
    if (testFacilityIds.length > 0) {
      await prisma.mapFacility.deleteMany({ where: { id: { in: testFacilityIds } } });
      testFacilityIds.length = 0;
    }
    if (testMapIds.length > 0) {
      await prisma.mapFacility.deleteMany({ where: { mapId: { in: testMapIds } } });
      testMapIds.length = 0;
    }
  });

  it('rejects modules without a type', async () => {
    await expect(
      mapService.saveMap('main-map', {
        modules: [
          {
            id: 'test-missing-type-id',
            position: { x: 1, y: 2 },
            size: { width: 10, height: 10 },
          } as { id: string; position: { x: number; y: number }; size: { width: number; height: number } },
        ],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'MAP_MODULE_TYPE_REQUIRED',
    });
  });

  it('clamps zIndex to INT4 so huge client values do not fail insert', async () => {
    const mapId = `test-map-z-${Date.now()}`;
    const facId = `test-fac-z-${Date.now()}`;
    testMapIds.push(mapId);
    testFacilityIds.push(facId);

    await mapService.saveMap(mapId, {
      modules: [
        {
          id: facId,
          type: 'recreation',
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
          zIndex: 1_777_943_550_766_221,
        },
      ],
    });

    const row = await prisma.mapFacility.findUnique({ where: { id: facId } });
    expect(row?.zIndex).toBe(2_147_483_647);
  });

  it('persists recreation as MapFacility', async () => {
    const mapId = `test-map-${Date.now()}`;
    const facId = `test-fac-${Date.now()}`;
    testMapIds.push(mapId);
    testFacilityIds.push(facId);

    await mapService.saveMap(mapId, {
      modules: [
        {
          id: facId,
          type: 'recreation',
          position: { x: 42, y: 43 },
          size: { width: 50, height: 40 },
          rotation: 0,
          zIndex: 5,
          metadata: { name: 'Rec area' },
          locked: false,
          visible: true,
        },
      ],
    });

    const row = await prisma.mapFacility.findUnique({ where: { id: facId } });
    expect(row).not.toBeNull();
    expect(row?.type).toBe('recreation');
    expect(row?.mapId).toBe(mapId);
    expect(row?.mapPositionX).toBe(42);
    expect(row?.mapPositionY).toBe(43);
  });
});
