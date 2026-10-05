// Pricing and equipment on real bookings (real Postgres)
//
// Rules and sites here are scoped to CABIN sites and far-future dates so they cannot affect
// bookings made by other test files that share the database.

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import bookingService from '@/services/booking.service';
import pricingService from '@/services/pricing.service';
import prisma from '@/database';
import { config } from '@/config';

const DAY = 86_400_000;
const unique = () => `${Date.now()}-${Math.random()}`;

// First Friday on or after 1 June 2037, so "weekend" rules are predictable
const FRIDAY = (() => {
  const d = new Date(Date.UTC(2037, 5, 1));
  while (d.getUTCDay() !== 5) d.setUTCDate(d.getUTCDate() + 1);
  return d;
})();
const nights = (from: Date, count: number) => ({ checkInDate: from, checkOutDate: new Date(from.getTime() + count * DAY) });

describe('Pricing and equipment on bookings', () => {
  let userId: string;
  const siteIds: string[] = [];
  const equipmentIds: string[] = [];
  let ruleIds: string[] = [];
  const settingsIds: string[] = [];

  const newSite = async (basePrice = 100, type: 'CABIN' | 'TENT' = 'CABIN') => {
    const site = await prisma.site.create({
      data: {
        name: `Pricing ${unique()}`, type, status: 'AVAILABLE', capacity: 6, basePrice, maxVehicles: 1, maxTents: 1,
        sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
      },
    });
    siteIds.push(site.id);
    return site;
  };

  const newEquipment = async (quantity: number, dailyRate = 10, name = `Kit ${unique()}`) => {
    const item = await prisma.equipment.create({
      data: { name, category: 'CAMPING_GEAR', quantity, dailyRate, weeklyRate: dailyRate * 6, monthlyRate: dailyRate * 20, deposit: 0 },
    });
    equipmentIds.push(item.id);
    return item;
  };

  const newRule = async (data: Record<string, unknown>) => {
    const rule = await prisma.pricingRule.create({
      data: {
        name: 'Test rule', siteTypes: ['CABIN'], startDate: new Date('2037-01-01'), endDate: new Date('2037-12-31'),
        priceModifier: 1, modifierType: 'multiplier', priority: 1, ...data,
      } as never,
    });
    ruleIds.push(rule.id);
    return rule;
  };

  const book = (siteId: string, dates: { checkInDate: Date; checkOutDate: Date }, equipmentReservations?: Array<{ equipmentId: string; quantity: number }>) =>
    bookingService.createBooking({ userId, siteId, ...dates, adultGuests: 1, childGuests: 0, ...(equipmentReservations && { equipmentReservations }) });

  beforeAll(async () => {
    userId = (
      await prisma.user.create({
        data: { email: `pricing-${unique()}@example.com`, firstName: 'P', lastName: 'T', password: 'x', role: 'CUSTOMER' },
      })
    ).id;
  });

  // Rules stack, so a rule left over from one test would change the price in the next
  afterEach(async () => {
    await prisma.pricingRule.deleteMany({ where: { id: { in: ruleIds } } });
    ruleIds = [];
  });

  afterAll(async () => {
    await prisma.equipmentReservation.deleteMany({ where: { booking: { userId } } });
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.equipment.deleteMany({ where: { id: { in: equipmentIds } } });
    await prisma.site.deleteMany({ where: { id: { in: siteIds } } });
    await prisma.pricingRule.deleteMany({ where: { id: { in: ruleIds } } });
    await prisma.campsiteSettings.deleteMany({ where: { id: { in: settingsIds } } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('PricingService.quote', () => {
    it('quotes a stay at the base rate, with the default tax and deposit when no settings exist', async () => {
      const site = await newSite(100);
      const dates = nights(new Date('2037-02-02'), 3);

      const quote = await pricingService.quote({ siteId: site.id, start: dates.checkInDate, end: dates.checkOutDate });

      const tax = config.business.defaultTaxRate;
      expect(quote).toMatchObject({ basePrice: 100, nights: 3, subtotal: 300, equipmentTotal: 0, taxAmount: Math.round(300 * tax * 100) / 100 });
      expect(quote.breakdown).toHaveLength(3);
    });

    it('applies active rules that overlap the stay and ignores inactive or unrelated ones', async () => {
      const site = await newSite(100);
      await newRule({ name: 'Summer', priceModifier: 1.5, startDate: new Date('2037-07-01'), endDate: new Date('2037-07-31') });
      await newRule({ name: 'Switched off', priceModifier: 9, startDate: new Date('2037-07-01'), endDate: new Date('2037-07-31'), isActive: false });
      await newRule({ name: 'Tents only', priceModifier: 9, siteTypes: ['TENT'], startDate: new Date('2037-07-01'), endDate: new Date('2037-07-31') });
      await newRule({ name: 'August', priceModifier: 9, startDate: new Date('2037-08-01'), endDate: new Date('2037-08-31') });

      const quote = await pricingService.quote({ siteId: site.id, start: new Date('2037-07-10'), end: new Date('2037-07-12') });

      expect(quote.breakdown.map((n) => [n.rate, n.description])).toEqual([[150, 'Summer'], [150, 'Summer']]);
    });

    it('prices weekend nights with a day-of-week rule', async () => {
      const site = await newSite(100);
      await newRule({ name: 'Weekend', priceModifier: 1.2, daysOfWeek: [5, 6], startDate: new Date('2037-06-01'), endDate: new Date('2037-06-30') });

      const quote = await pricingService.quote({ siteId: site.id, ...{ start: FRIDAY, end: new Date(FRIDAY.getTime() + 3 * DAY) } }); // Fri Sat Sun

      expect(quote.breakdown.map((n) => n.rate)).toEqual([120, 120, 100]);
    });

    it('uses the tax rate and deposit percentage from the campsite settings', async () => {
      const site = await newSite(100);
      const settings = await prisma.campsiteSettings.create({
        data: {
          name: 'Test camp', addressStreet: '-', addressCity: '-', addressState: '-', addressZip: '-', addressCountry: '-', contactPhone: '-',
          contactEmail: 'a@b.c', checkInTime: '14:00', checkOutTime: '11:00', quietHoursStart: '22:00', quietHoursEnd: '07:00',
          petPolicy: '-', cancellationPolicy: '-', refundPolicy: '-', taxRate: 0.1, depositPercentage: 50,
          createdAt: new Date('2099-01-01'), // newest, so it is the one in force
        },
      });
      settingsIds.push(settings.id);

      try {
        const quote = await pricingService.quote({ siteId: site.id, start: new Date('2037-02-02'), end: new Date('2037-02-04') });

        expect(quote).toMatchObject({ subtotal: 200, taxAmount: 20, totalAmount: 220, depositAmount: 110 });
      } finally {
        await prisma.campsiteSettings.delete({ where: { id: settings.id } });
      }
    });

    it('prices equipment per night and merges repeated items', async () => {
      const site = await newSite(100);
      const kit = await newEquipment(10, 15);

      const quote = await pricingService.quote({
        siteId: site.id,
        start: new Date('2037-02-02'),
        end: new Date('2037-02-04'),
        equipmentReservations: [{ equipmentId: kit.id, quantity: 1 }, { equipmentId: kit.id, quantity: 2 }],
      });

      expect(quote.equipment).toEqual([expect.objectContaining({ equipmentId: kit.id, quantity: 3, dailyRate: 15, totalAmount: 90 })]);
      expect(quote.equipmentTotal).toBe(90);
    });

    it('rejects an unknown site and unknown equipment', async () => {
      const site = await newSite();
      const range = { start: new Date('2037-02-02'), end: new Date('2037-02-04') };

      await expect(pricingService.quote({ siteId: 'missing', ...range })).rejects.toMatchObject({ statusCode: 404 });
      await expect(
        pricingService.quote({ siteId: site.id, ...range, equipmentReservations: [{ equipmentId: 'missing', quantity: 1 }] })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('createBooking', () => {
    it('stores the engine\'s totals, and the equipment reservations with their prices', async () => {
      const site = await newSite(100);
      const kit = await newEquipment(5, 10);
      await newRule({ name: 'Weekend', priceModifier: 1.5, daysOfWeek: [5], startDate: new Date('2037-06-01'), endDate: new Date('2037-06-30') });
      const dates = nights(FRIDAY, 2); // Fri (150) + Sat (100)

      const booking = await book(site.id, dates, [{ equipmentId: kit.id, quantity: 2 }]);
      const quote = await pricingService.quote({ siteId: site.id, start: dates.checkInDate, end: dates.checkOutDate, equipmentReservations: [{ equipmentId: kit.id, quantity: 2 }] });

      expect(quote.subtotal).toBe(250);
      expect(booking).toMatchObject({
        totalAmount: quote.totalAmount,
        taxAmount: quote.taxAmount,
        depositAmount: quote.depositAmount,
        discountAmount: 0,
      });
      expect(booking.totalAmount).toBe(Math.round((250 + 40) * (1 + config.business.defaultTaxRate) * 100) / 100);
      expect(booking.equipmentReservations).toEqual([
        expect.objectContaining({ equipmentId: kit.id, quantity: 2, dailyRate: 10, totalAmount: 40, status: 'CONFIRMED' }),
      ]);
    });

    it('creates a booking with no equipment as before', async () => {
      const site = await newSite(80);

      const booking = await book(site.id, nights(new Date('2037-03-02'), 2));

      expect(booking.equipmentReservations).toEqual([]);
      expect(booking.totalAmount).toBeGreaterThanOrEqual(160);
    });

    it('rejects equipment that does not exist, without creating the booking', async () => {
      const site = await newSite();

      await expect(book(site.id, nights(new Date('2037-03-02'), 2), [{ equipmentId: 'missing', quantity: 1 }])).rejects.toMatchObject({ statusCode: 404 });
      expect(await prisma.booking.count({ where: { siteId: site.id } })).toBe(0);
    });
  });

  describe('equipment availability', () => {
    it('refuses more units than are free, then allows what is left', async () => {
      const kit = await newEquipment(3);
      const dates = nights(new Date('2037-04-06'), 2);

      await book((await newSite()).id, dates, [{ equipmentId: kit.id, quantity: 2 }]);

      await expect(book((await newSite()).id, dates, [{ equipmentId: kit.id, quantity: 2 }])).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('1 left'),
      });
      await expect(book((await newSite()).id, dates, [{ equipmentId: kit.id, quantity: 1 }])).resolves.toBeDefined();
    });

    it('does not count reservations on other dates', async () => {
      const kit = await newEquipment(1);

      await book((await newSite()).id, nights(new Date('2037-04-06'), 2), [{ equipmentId: kit.id, quantity: 1 }]);

      await expect(book((await newSite()).id, nights(new Date('2037-04-08'), 2), [{ equipmentId: kit.id, quantity: 1 }])).resolves.toBeDefined(); // starts when the first ends
    });

    it('lets exactly one of several simultaneous bookings take the last unit', async () => {
      const kit = await newEquipment(1);
      const dates = nights(new Date('2037-05-04'), 2);
      const sites = await Promise.all(Array.from({ length: 6 }, () => newSite()));

      const results = await Promise.allSettled(sites.map((s) => book(s.id, dates, [{ equipmentId: kit.id, quantity: 1 }])));

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      expect(failures.every((f) => (f.reason as { statusCode?: number }).statusCode === 409)).toBe(true);
      expect(await prisma.equipmentReservation.count({ where: { equipmentId: kit.id } })).toBe(1);
    });

    it('releases the equipment when an unpaid booking expires', async () => {
      const kit = await newEquipment(1);
      const dates = nights(new Date('2037-05-18'), 2);
      const first = await book((await newSite()).id, dates, [{ equipmentId: kit.id, quantity: 1 }]);
      await prisma.booking.update({ where: { id: first.id }, data: { createdAt: new Date(Date.now() - (config.business.pendingBookingHoldMinutes + 5) * 60_000) } });

      await bookingService.expireUnpaidBookings();

      expect((await prisma.equipmentReservation.findFirstOrThrow({ where: { bookingId: first.id } })).status).toBe('CANCELLED');
      await expect(book((await newSite()).id, dates, [{ equipmentId: kit.id, quantity: 1 }])).resolves.toBeDefined();
    });
  });

  describe('changing the dates of a booking', () => {
    let site: Awaited<ReturnType<typeof newSite>>;
    beforeEach(async () => {
      site = await newSite(100);
    });

    it('re-prices the stay and moves the equipment with it, at the rates agreed originally', async () => {
      const kit = await newEquipment(5, 10);
      const booking = await book(site.id, nights(new Date('2037-08-03'), 2), [{ equipmentId: kit.id, quantity: 2 }]);
      await prisma.equipment.update({ where: { id: kit.id }, data: { dailyRate: 99 } }); // price rises later

      const newDates = nights(new Date('2037-08-10'), 4);
      const updated = await bookingService.updateBooking(booking.id, { checkInDate: newDates.checkInDate, checkOutDate: newDates.checkOutDate });

      const tax = config.business.defaultTaxRate;
      expect(updated.totalAmount).toBe(Math.round((400 + 80) * (1 + tax) * 100) / 100); // 4 nights x 100 + 2 x 10 x 4
      const [reservation] = await prisma.equipmentReservation.findMany({ where: { bookingId: booking.id } });
      expect(reservation).toMatchObject({ dailyRate: 10, totalAmount: 80, startDate: newDates.checkInDate, endDate: newDates.checkOutDate });
    });

    it('refuses new dates where the equipment is not free, and changes nothing', async () => {
      const kit = await newEquipment(1);
      const original = nights(new Date('2037-09-07'), 2);
      const booking = await book(site.id, original, [{ equipmentId: kit.id, quantity: 1 }]);
      const other = nights(new Date('2037-09-21'), 2);
      await book((await newSite()).id, other, [{ equipmentId: kit.id, quantity: 1 }]); // someone else holds it then

      await expect(
        bookingService.updateBooking(booking.id, { checkInDate: other.checkInDate, checkOutDate: other.checkOutDate })
      ).rejects.toMatchObject({ statusCode: 409 });

      const unchanged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
      expect(unchanged.checkInDate).toEqual(original.checkInDate);
      expect(unchanged.totalAmount).toBe(booking.totalAmount);
    });

    it('keeps its own equipment when moved to overlapping dates', async () => {
      const kit = await newEquipment(1);
      const booking = await book(site.id, nights(new Date('2037-10-05'), 3), [{ equipmentId: kit.id, quantity: 1 }]);

      const moved = nights(new Date('2037-10-06'), 3); // overlaps its own old dates
      await expect(bookingService.updateBooking(booking.id, { checkInDate: moved.checkInDate, checkOutDate: moved.checkOutDate })).resolves.toBeDefined();
    });
  });
});
