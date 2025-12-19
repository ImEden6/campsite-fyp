// Booking Service

import { PrismaClient, Equipment, EquipmentStatus, GuestType, Prisma, Booking } from '@prisma/client';
import logger from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import cacheService from '@/services/cache.service';

const prisma = new PrismaClient();

export interface EquipmentAvailabilityQuery {
  startDate: Date;
  endDate: Date;
  siteId?: string;
  equipmentType?: string;
}

export interface EquipmentAvailability extends Equipment {
  available: boolean;
  conflictingBookings?: Array<{
    bookingId: string;
    startDate: Date;
    endDate: Date;
  }>;
}


export interface GuestInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  type: GuestType;
  isPrimary: boolean;
}

export interface CreateBookingDto {
  userId: string;
  siteId: string;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  adultGuests: number;
  childGuests: number;
  petGuests?: number;
  guests?: GuestInput[];
}

export class BookingService {
  /**
   * Get available equipment for a given date range
   * Checks for conflicting bookings and maintenance schedules
   * Handles timezone conversion correctly
   */
  async getAvailableEquipment(
    query: EquipmentAvailabilityQuery
  ): Promise<EquipmentAvailability[]> {
    const { startDate, endDate, equipmentType } = query;

    // Validate date range
    if (startDate >= endDate) {
      throw new ApiError(400, 'Start date must be before end date');
    }

    // Convert dates to UTC to ensure consistent timezone handling
    const startDateUTC = new Date(startDate.toISOString());
    const endDateUTC = new Date(endDate.toISOString());

    // Generate a unique cache key
    const cacheKey = `equipment:availability:${startDateUTC.getTime()}:${endDateUTC.getTime()}:${equipmentType || 'all'}`;

    try {
      // Use cacheService to remember the result
      return await cacheService.remember(cacheKey, async () => {
        // Query equipment with availability check
        const equipment = await prisma.equipment.findMany({
          where: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(equipmentType && { category: equipmentType as any }),
            status: EquipmentStatus.AVAILABLE,
          },
          include: {
            rentals: {
              where: {
                // Check for overlapping rentals
                OR: [
                  {
                    // Rental starts during requested period
                    startDate: {
                      gte: startDateUTC,
                      lt: endDateUTC,
                    },
                  },
                  {
                    // Rental ends during requested period
                    endDate: {
                      gt: startDateUTC,
                      lte: endDateUTC,
                    },
                  },
                  {
                    // Rental spans entire requested period
                    AND: [
                      { startDate: { lte: startDateUTC } },
                      { endDate: { gte: endDateUTC } },
                    ],
                  },
                ],
                // Only consider active rentals (not returned)
                returnedAt: null,
              },
              include: {
                booking: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        // Calculate availability for each equipment item
        const equipmentWithAvailability: EquipmentAvailability[] = equipment.map((item) => {
          // Filter rentals for confirmed/active bookings only
          const activeRentals = item.rentals.filter(
            (rental) =>
              rental.booking.status === 'CONFIRMED' ||
              rental.booking.status === 'CHECKED_IN'
          );

          // Calculate total quantity rented during the period
          const totalRented = activeRentals.reduce(
            (sum, rental) => sum + rental.quantity,
            0
          );

          // Calculate available quantity
          const availableQuantity = item.quantity - totalRented;

          // Get conflicting bookings info
          const conflictingBookings = activeRentals.map((rental) => ({
            bookingId: rental.bookingId,
            startDate: rental.startDate,
            endDate: rental.endDate,
          }));

          // Remove rentals from the returned object
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { rentals, ...equipmentData } = item;

          return {
            ...equipmentData,
            availableQuantity,
            available: availableQuantity > 0,
            conflictingBookings: conflictingBookings.length > 0 ? conflictingBookings : undefined,
          };
        });

        logger.info('Equipment availability checked (cache miss)', {
          startDate: startDateUTC,
          endDate: endDateUTC,
          equipmentType,
          totalEquipment: equipmentWithAvailability.length,
          availableCount: equipmentWithAvailability.filter((e) => e.available).length,
        });

        return equipmentWithAvailability;
      }, 300); // Cache for 5 minutes (300 seconds)
    } catch (error) {
      logger.error('Failed to get available equipment', { error, query });
      throw new ApiError(500, 'Failed to retrieve equipment availability');
    }
  }

  /**
   * Create a new booking with guest validation
   */
  async createBooking(data: CreateBookingDto): Promise<Booking> {
    const {
      userId, siteId, checkInDate, checkOutDate,
      petGuests = 0, guests, ...rest
    } = data;

    // 1. Basic Date Validation
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (start >= end) throw new ApiError(400, 'Check-in must be before check-out');

    // 2. Normalize Guest Data
    let finalGuests: GuestInput[] = guests || [];
    let finalAdultCount = data.adultGuests;

    // Recalculate based on guests if provided
    if (guests && guests.length > 0) {
      finalAdultCount = guests.filter(g => g.type === GuestType.ADULT).length;
      // data.childGuests is overridden by array count
    } else {
      // Legacy: Generate synthetic guests if not provided
      finalGuests = [];
      let guestCounter = 1;

      for (let i = 0; i < data.adultGuests; i++) {
        finalGuests.push({
          firstName: `Guest ${guestCounter++}`,
          lastName: '(Adult)',
          type: GuestType.ADULT,
          isPrimary: i === 0, // First adult is primary
        });
      }
      for (let i = 0; i < data.childGuests; i++) {
        finalGuests.push({
          firstName: `Guest ${guestCounter++}`,
          lastName: '(Child)',
          type: GuestType.CHILD,
          isPrimary: false,
        });
      }
    }

    const finalChildCount = finalGuests.filter(g => g.type === GuestType.CHILD).length; // Ensure accurate count

    // 3. Strict Validation
    const totalGuests = finalAdultCount + finalChildCount;

    if (totalGuests === 0) throw new ApiError(400, 'Booking must have at least 1 guest');
    if (finalAdultCount < 1) throw new ApiError(400, 'MISSING_ADULT: Booking must have at least 1 adult');
    if (finalGuests.length !== totalGuests) throw new ApiError(400, 'GUEST_COUNT_MISMATCH: Guest list mismatch');

    const primaryGuest = finalGuests.find(g => g.isPrimary);
    if (!primaryGuest) throw new ApiError(400, 'One guest must be marked as primary');
    if (finalGuests.filter(g => g.isPrimary).length > 1) throw new ApiError(400, 'Only one primary guest allowed');
    if (primaryGuest.type !== GuestType.ADULT) throw new ApiError(400, 'PRIMARY_MUST_BE_ADULT: Primary guest must be an adult');

    // 4. Transaction: Verify Site & Create
    return await prisma.$transaction(async (tx) => {
      // Check Site
      const site = await tx.site.findUnique({ where: { id: siteId } });
      if (!site) throw new ApiError(404, 'Site not found');

      if (totalGuests > site.capacity) {
        throw new ApiError(400, `Exceeds site capacity of ${site.capacity}`);
      }

      // Check Availability (Simple overlap check)
      const conflicting = await tx.booking.findFirst({
        where: {
          siteId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          OR: [
            { checkInDate: { lt: end }, checkOutDate: { gt: start } }
          ]
        }
      });
      if (conflicting) throw new ApiError(409, 'Site is not available for these dates');

      // Calculate Price (Simplified for MVP)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = site.basePrice * days; // + equipment logic?

      // Create Booking
      const bookingNumber = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          siteId,
          checkInDate: start,
          checkOutDate: end,
          adultGuests: finalAdultCount,
          childGuests: finalChildCount,
          petGuests,
          totalAmount,
          status: 'PENDING',
          guests: {
            create: finalGuests.map(g => ({
              firstName: g.firstName,
              lastName: g.lastName,
              email: g.email,
              phone: g.phone,
              type: g.type,
              isPrimary: g.isPrimary
            }))
          }
        },
        include: { guests: true }
      });
    });
  }

  /**
   * Update booking (Dates, Guests, Notes, etc.)
   */
  async updateBooking(id: string, data: Partial<CreateBookingDto> & { notes?: string, specialRequests?: string }): Promise<Booking> {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { site: true, guests: true }
      });
      if (!booking) throw new ApiError(404, 'Booking not found');

      const updates: Prisma.BookingUpdateInput = {};

      // 1. Handle Dates
      if (data.checkInDate && data.checkOutDate) {
        const start = new Date(data.checkInDate);
        const end = new Date(data.checkOutDate);

        if (start.getTime() !== booking.checkInDate.getTime() || end.getTime() !== booking.checkOutDate.getTime()) {
          if (start >= end) throw new ApiError(400, 'Check-in must be before check-out');

          // Check Availability
          const conflicting = await tx.booking.findFirst({
            where: {
              siteId: booking.siteId,
              id: { not: id }, // Exclude self
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              OR: [
                { checkInDate: { lt: end }, checkOutDate: { gt: start } }
              ]
            }
          });
          if (conflicting) throw new ApiError(409, 'Site is not available for these dates');

          updates.checkInDate = start;
          updates.checkOutDate = end;

          // Re-calculate price (Simple version)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          updates.totalAmount = booking.site.basePrice * days;
        }
      }

      // 2. Handle Guests
      if (data.guests) {
        // Full replacement logic
        const finalGuests = data.guests;
        const adultCount = finalGuests.filter(g => g.type === GuestType.ADULT).length;
        const childCount = finalGuests.filter(g => g.type === GuestType.CHILD).length;
        const total = adultCount + childCount;

        if (adultCount < 1) throw new ApiError(400, 'Must have at least 1 adult');
        if (total > booking.site.capacity) throw new ApiError(400, 'Exceeds site capacity');

        updates.adultGuests = adultCount;
        updates.childGuests = childCount;
        if (data.petGuests !== undefined) updates.petGuests = data.petGuests;

        // Replace guests
        await tx.guest.deleteMany({ where: { bookingId: id } });
        await tx.guest.createMany({
          data: finalGuests.map(g => ({
            bookingId: id,
            firstName: g.firstName,
            lastName: g.lastName,
            email: g.email,
            phone: g.phone,
            type: g.type,
            isPrimary: g.isPrimary
          }))
        });
      } else if (data.adultGuests !== undefined || data.childGuests !== undefined) {
        // Legacy path: Updating counts without array -> Validation/Synthetic generation needed?
        // For now, if array is missing, we enforce it must be provided for data integrity
        // unless we are only updating notes/dates and keeping existing guests.
        if (data.adultGuests !== booking.adultGuests || data.childGuests !== booking.childGuests) {
          throw new ApiError(400, 'To change guest counts, please provide the full guest list');
        }
      }

      // 3. Other Fields
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.specialRequests !== undefined) updates.specialRequests = data.specialRequests;

      if (Object.keys(updates).length > 0) {
        await tx.booking.update({
          where: { id },
          data: updates
        });
      }

      return await tx.booking.findUniqueOrThrow({
        where: { id },
        include: { guests: true }
      });
    });
  }

  /**
   * Full replacement of guest list
   */
  async updateBookingGuests(bookingId: string, guests: GuestInput[]): Promise<Booking> {
    // Validate Input
    const adultCount = guests.filter(g => g.type === GuestType.ADULT).length;
    const childCount = guests.filter(g => g.type === GuestType.CHILD).length;

    if (adultCount < 1) throw new ApiError(400, 'MISSING_ADULT: Must have at least 1 adult');

    const primary = guests.find(g => g.isPrimary);
    if (!primary || primary.type !== GuestType.ADULT) throw new ApiError(400, 'PRIMARY_MUST_BE_ADULT');
    if (guests.filter(g => g.isPrimary).length !== 1) throw new ApiError(400, 'Exactly one primary guest required');

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { site: true } });
      if (!booking) throw new ApiError(404, 'Booking not found');

      if ((adultCount + childCount) > booking.site.capacity) {
        throw new ApiError(400, 'Exceeds site capacity');
      }

      // Update Booking Counts
      await tx.booking.update({
        where: { id: bookingId },
        data: { adultGuests: adultCount, childGuests: childCount }
      });

      // Replace Guests: Delete all, then create new
      await tx.guest.deleteMany({ where: { bookingId } });

      await tx.guest.createMany({
        data: guests.map(g => ({
          bookingId,
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email,
          phone: g.phone,
          type: g.type,
          isPrimary: g.isPrimary
        }))
      });

      return await tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: { guests: true }
      });
    });
  }
}

export default new BookingService();
