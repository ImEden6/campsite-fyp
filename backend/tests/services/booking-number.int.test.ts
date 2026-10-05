// Booking reference numbers: format, uniqueness, and recovering from a collision (real Postgres)

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

vi.mock('@/utils/bookingNumber', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/bookingNumber')>();
  return { ...actual, generateBookingNumber: vi.fn(actual.generateBookingNumber) };
});

import bookingService from '@/services/booking.service';
import prisma from '@/database';
import { generateBookingNumber } from '@/utils/bookingNumber';

const realGenerate = (await vi.importActual<typeof import('@/utils/bookingNumber')>('@/utils/bookingNumber')).generateBookingNumber;
const generateMock = vi.mocked(generateBookingNumber);

describe('generateBookingNumber', () => {
  it('looks like BK- followed by 8 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(realGenerate()).toMatch(/^BK-[2-9A-HJKMNP-Z]{8}$/); // no 0 O 1 I L
    }
  });

  it('does not repeat, even for many numbers generated in the same millisecond', () => {
    const numbers = new Set(Array.from({ length: 20_000 }, realGenerate));

    expect(numbers.size).toBe(20_000);
  });

  it('does not encode the time it was created', () => {
    const [a, b] = [realGenerate(), realGenerate()];

    expect(a).not.toContain(String(Date.now()).slice(0, 6));
    expect(a).not.toBe(b);
  });
});

describe('createBooking and booking number collisions', () => {
  let userId: string;
  let siteId: string;
  let seq = 0;

  // Each call gets its own dates so the site-overlap constraint never interferes
  const book = () => {
    const n = seq++;
    return bookingService.createBooking({
      userId,
      siteId,
      checkInDate: new Date(Date.UTC(2035, 0, 1 + n * 3)),
      checkOutDate: new Date(Date.UTC(2035, 0, 3 + n * 3)),
      adultGuests: 1,
      childGuests: 0,
    });
  };

  beforeAll(async () => {
    userId = (
      await prisma.user.create({
        data: { email: `bn-${Date.now()}-${Math.random()}@example.com`, firstName: 'B', lastName: 'N', password: 'x', role: 'CUSTOMER' },
      })
    ).id;
    siteId = (
      await prisma.site.create({
        data: {
          name: `BN site ${Date.now()}-${Math.random()}`, type: 'TENT', status: 'AVAILABLE', capacity: 4, basePrice: 50, maxVehicles: 1,
          maxTents: 1, sizeLength: 1, sizeWidth: 1, sizeUnit: 'feet', latitude: 1, longitude: 1, mapPositionX: 1, mapPositionY: 1,
        },
      })
    ).id;
  });

  afterEach(() => {
    generateMock.mockReset();
    generateMock.mockImplementation(realGenerate);
  });

  afterAll(async () => {
    await prisma.guest.deleteMany({ where: { booking: { userId } } });
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.site.delete({ where: { id: siteId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('stores a generated reference on the booking', async () => {
    const booking = await book();

    expect(booking.bookingNumber).toMatch(/^BK-[2-9A-HJKMNP-Z]{8}$/);
  });

  it('retries with a new number when the first one is already taken', async () => {
    const first = await book();
    const before = await prisma.booking.count({ where: { userId } });
    generateMock.mockClear(); // count only the calls made by the booking under test
    generateMock.mockReturnValueOnce(first.bookingNumber).mockReturnValueOnce(first.bookingNumber);

    const second = await book();

    expect(second.bookingNumber).not.toBe(first.bookingNumber);
    expect(generateMock).toHaveBeenCalledTimes(3); // two collisions, then a fresh number
    expect(await prisma.booking.count({ where: { userId } })).toBe(before + 1); // exactly one new booking
  });

  it('gives up with a clear error if numbers keep colliding, and creates nothing', async () => {
    const first = await book();
    const before = await prisma.booking.count({ where: { userId } });
    generateMock.mockClear();
    generateMock.mockReturnValue(first.bookingNumber);

    await expect(book()).rejects.toMatchObject({ statusCode: 500, message: expect.stringContaining('booking number') });

    expect(generateMock).toHaveBeenCalledTimes(5);
    expect(await prisma.booking.count({ where: { userId } })).toBe(before);
  });

  it('does not retry a different failure (site not found stays a 404)', async () => {
    await expect(
      bookingService.createBooking({
        userId, siteId: 'missing-site', checkInDate: new Date('2035-06-01'), checkOutDate: new Date('2035-06-03'), adultGuests: 1, childGuests: 0,
      })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(generateMock).not.toHaveBeenCalled();
  });
});
