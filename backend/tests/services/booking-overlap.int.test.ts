// Booking overlap protection (real Postgres: needs the bookings_no_overlap constraint migrated)

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import bookingService from '@/services/booking.service';
import prisma from '@/database';
import { ApiError } from '@/utils/errors';

const day = (n: number) => new Date(Date.UTC(2031, 0, n)); // far-future dates, no clash with other tests

describe('Booking overlap protection', () => {
  let userId: string;
  let siteId: string;
  let otherSiteId: string;

  const book = (overrides: { siteId?: string; from?: number; to?: number } = {}) =>
    bookingService.createBooking({
      userId,
      siteId: overrides.siteId ?? siteId,
      checkInDate: day(overrides.from ?? 10),
      checkOutDate: day(overrides.to ?? 15),
      adultGuests: 2,
      childGuests: 0,
    });

  const statusOf = (reason: unknown) => (reason as ApiError).statusCode;

  const createSite = async (label: string) =>
    (
      await prisma.site.create({
        data: {
          name: `Overlap ${label} ${Date.now()}-${Math.random()}`,
          type: 'TENT',
          status: 'AVAILABLE',
          capacity: 4,
          basePrice: 50,
          maxVehicles: 2,
          maxTents: 1,
          sizeLength: 20,
          sizeWidth: 15,
          sizeUnit: 'feet',
          latitude: 1,
          longitude: 1,
          mapPositionX: 1,
          mapPositionY: 1,
        },
      })
    ).id;

  beforeAll(async () => {
    userId = (
      await prisma.user.create({
        data: {
          email: `overlap-${Date.now()}-${Math.random()}@example.com`,
          firstName: 'Overlap',
          lastName: 'Tester',
          password: 'hashedpassword',
          role: 'CUSTOMER',
        },
      })
    ).id;
  });

  beforeEach(async () => {
    siteId = await createSite('A');
    otherSiteId = await createSite('B');
  });

  afterAll(async () => {
    const sites = { siteId: { in: [siteId, otherSiteId] } };
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.site.deleteMany({ where: { id: { in: sites.siteId.in } } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('rejects an overlapping booking while the first is still PENDING', async () => {
    await book({ from: 10, to: 15 });

    await expect(book({ from: 12, to: 18 })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows back-to-back stays (check-out day is free)', async () => {
    await book({ from: 10, to: 15 });

    await expect(book({ from: 15, to: 20 })).resolves.toBeDefined();
  });

  it('allows the same dates on a different site', async () => {
    await book({ from: 10, to: 15 });

    await expect(book({ siteId: otherSiteId, from: 10, to: 15 })).resolves.toBeDefined();
  });

  it('lets a cancelled booking release the site', async () => {
    const first = await book({ from: 10, to: 15 });
    await prisma.booking.update({ where: { id: first.id }, data: { status: 'CANCELLED' } });

    await expect(book({ from: 10, to: 15 })).resolves.toBeDefined();
  });

  it('turns a lost race (check passed, insert rejected) into a 409, not a 500', async () => {
    await book({ from: 10, to: 15 });

    // Simulate the losing request in a real race: its availability check ran before the
    // winner committed, so it sees no conflict and goes on to insert.
    const realTransaction = prisma.$transaction.bind(prisma);
    const spy = vi.spyOn(prisma, '$transaction').mockImplementationOnce(((fn: (tx: any) => unknown) =>
      realTransaction((tx: any) =>
        fn({
          ...tx,
          site: tx.site,
          guest: tx.guest,
          booking: {
            findFirst: async () => null,
            create: (args: unknown) => tx.booking.create(args),
          },
        })
      )) as never);

    try {
      await expect(book({ from: 12, to: 18 })).rejects.toMatchObject({ statusCode: 409 });
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  // Smoke test only: whether requests actually interleave is timing-dependent, so the
  // deterministic tests above and below are what prove the guarantee.
  it('lets exactly one of many concurrent requests win the same dates', async () => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => book({ from: 10, to: 15 })));

    const won = results.filter((r) => r.status === 'fulfilled');
    const lost = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(7);
    expect(lost.every((r) => statusOf(r.reason) === 409)).toBe(true); // clean conflict, never a 500
    expect(await prisma.booking.count({ where: { siteId } })).toBe(1);
  });

  it('is enforced by the database even when the service check is bypassed', async () => {
    const first = await book({ from: 10, to: 15 });

    await expect(
      prisma.booking.create({
        data: {
          bookingNumber: `BK-RAW-${Date.now()}`,
          userId,
          siteId,
          checkInDate: day(11),
          checkOutDate: day(14),
          adultGuests: 1,
          childGuests: 0,
          totalAmount: 50,
          status: 'PENDING',
        },
      })
    ).rejects.toThrow(/bookings_no_overlap|exclusion constraint/);

    expect(first.status).toBe('PENDING');
  });

  it('rejects moving a booking onto dates another booking holds', async () => {
    await book({ from: 10, to: 15 });
    const second = await book({ from: 20, to: 25 });

    await expect(
      bookingService.updateBooking(second.id, { checkInDate: day(12), checkOutDate: day(18) })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
