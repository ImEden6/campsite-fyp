// Booking Service

import { PrismaClient, Equipment, EquipmentCategory, GuestType, Prisma, Booking, BookingStatus, PaymentMethod, PaymentStatus, Payment } from '@prisma/client';
import logger from '@/utils/logger';
import { ApiError } from '@/utils/errors';
import cacheService from '@/services/cache.service';
import { getPrismaClient } from '@/database';
import { config } from '@/config';
import { generateBookingNumber, isBookingNumberCollision } from '@/utils/bookingNumber';
import pricingService from '@/services/pricing.service';
import bookingQueryService, { BOOKING_USER_SELECT } from '@/services/booking-query.service';
import { computeCancellationRefund, ALREADY_CANCELLED_REFUND, type CancellationRefund } from '@/services/booking-policy';
import { publishBookingEvent, BOOKING_EVENTS, type BookingEventName } from '@/socket/booking-events';
import { publishPaymentEvent, PAYMENT_EVENTS } from '@/socket/payment-events';

const prisma = getPrismaClient();

/**
 * Booking statuses that hold a site for their dates. A new booking starts as PENDING, so it
 * must block the site too. Keep in sync with the `bookings_no_overlap` constraint in
 * prisma/migrations/20261005120000_prevent_overlapping_bookings.
 */
const SITE_HOLDING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

/**
 * A payment attempt this recent means the customer may be paying right now, so the booking is
 * not expired underneath them. Deliberately much shorter than the booking hold itself.
 */
const PAYMENT_IN_FLIGHT_MINUTES = 60;

const CANCELLABLE_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

const SITE_UNAVAILABLE_MESSAGE = 'Site is not available for these dates';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Make sure every requested equipment item has enough units free for the dates.
 *
 * The equipment rows are locked first (FOR UPDATE, in id order so two bookings can't deadlock),
 * so two bookings racing for the last unit are handled one after the other and the second one
 * sees the first one's reservation. Without the lock both would read "1 left" and both succeed.
 */
async function assertEquipmentAvailable(
  tx: Prisma.TransactionClient,
  lines: Array<{ equipmentId: string; quantity: number }>,
  start: Date,
  end: Date,
  excludeBookingId?: string
): Promise<void> {
  if (lines.length === 0) return;

  const ids = [...new Set(lines.map((l) => l.equipmentId))].sort();
  await tx.$queryRaw`SELECT id FROM equipment WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;

  const [equipment, reserved] = await Promise.all([
    tx.equipment.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, quantity: true } }),
    tx.equipmentReservation.groupBy({
      by: ['equipmentId'],
      where: {
        equipmentId: { in: ids },
        status: 'CONFIRMED',
        startDate: { lt: end },
        endDate: { gt: start },
        ...(excludeBookingId && { bookingId: { not: excludeBookingId } }),
      },
      _sum: { quantity: true },
    }),
  ]);

  const takenById = new Map(reserved.map((r) => [r.equipmentId, r._sum.quantity ?? 0]));
  for (const item of equipment) {
    const wanted = lines.filter((l) => l.equipmentId === item.id).reduce((sum, l) => sum + l.quantity, 0);
    const free = item.quantity - (takenById.get(item.id) ?? 0);
    if (wanted > free) {
      throw new ApiError(409, `Not enough ${item.name} available for these dates (${Math.max(free, 0)} left)`);
    }
  }
}

const BOOKING_NUMBER_ATTEMPTS = 5;

/**
 * Run a booking insert, retrying with a fresh number if (very rarely) the random one is taken.
 * The whole transaction is retried because a failed insert aborts it.
 */
async function withBookingNumberRetry<T>(insert: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await insert();
    } catch (error) {
      if (!isBookingNumberCollision(error)) throw error;
      if (attempt >= BOOKING_NUMBER_ATTEMPTS) {
        logger.error('Could not find a free booking number', { attempts: attempt });
        throw new ApiError(500, 'Could not allocate a booking number, please try again');
      }
    }
  }
}

/**
 * True when Postgres rejected a write because of the `bookings_no_overlap` exclusion constraint,
 * i.e. a concurrent request took the site between our availability check and the write.
 */
function isOverlapViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('bookings_no_overlap') || message.includes('exclusion constraint');
}

export interface EquipmentAvailabilityQuery {
  startDate: Date;
  endDate: Date;
  siteId?: string;
  equipmentType?: string;
}

export interface EquipmentAvailability extends Equipment {
  available: boolean;
  /** Units free for the requested dates (total quantity minus confirmed reservations) */
  availableQuantity: number;
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
  equipmentReservations?: Array<{ equipmentId: string; quantity: number }>;
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

    if (equipmentType && !(Object.values(EquipmentCategory) as string[]).includes(equipmentType)) {
      throw new ApiError(400, `Unknown equipment type: ${equipmentType}`);
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

            ...(equipmentType && { category: equipmentType as EquipmentCategory }),
          },
          include: {
            reservations: {
              where: {
                // Check for overlapping reservations
                OR: [
                  {
                    // Reservation starts during requested period
                    startDate: {
                      gte: startDateUTC,
                      lt: endDateUTC,
                    },
                  },
                  {
                    // Reservation ends during requested period
                    endDate: {
                      gt: startDateUTC,
                      lte: endDateUTC,
                    },
                  },
                  {
                    // Reservation spans entire requested period
                    AND: [
                      { startDate: { lte: startDateUTC } },
                      { endDate: { gte: endDateUTC } },
                    ],
                  },
                ],
                // Only consider confirmed reservations
                status: 'CONFIRMED',
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
          // Calculate total quantity reserved during the period
          const totalReserved = item.reservations.reduce(
            (sum, res) => sum + res.quantity,
            0
          );

          // Calculate available quantity
          const availableQuantity = item.quantity - totalReserved;

          // Get conflicting bookings info
          const conflictingBookings = item.reservations.map((res) => ({
            bookingId: res.bookingId,
            startDate: res.startDate,
            endDate: res.endDate,
          }));

          // Remove reservations from the returned object

          const { reservations, ...equipmentData } = item;

          return {
            ...equipmentData,
            available: availableQuantity > 0,
            availableQuantity: Math.max(availableQuantity, 0),
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
      petGuests = 0, guests, equipmentReservations, ...rest
    } = data;

    // 1. Basic Date Validation
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (start >= end) throw new ApiError(400, 'Check-in must be before check-out');

    // 2. Normalize Guest Data
    let finalGuests: GuestInput[] = guests || [];
    let finalAdultCount = data.adultGuests;
    let finalChildCount = data.childGuests || 0;

    // If guests array provided, validate it matches the explicit counts
    if (guests && guests.length > 0) {
      const arrayAdultCount = guests.filter(g => g.type === GuestType.ADULT).length;
      const arrayChildCount = guests.filter(g => g.type === GuestType.CHILD).length;
      
      // Use explicit counts if provided, otherwise use array counts
      finalAdultCount = data.adultGuests > 0 ? data.adultGuests : arrayAdultCount;
      finalChildCount = (data.childGuests !== undefined && data.childGuests > 0) ? data.childGuests : arrayChildCount;
      
      // If mismatch, generate missing guests to match explicit counts
      const totalGuests = finalAdultCount + finalChildCount;
      if (guests.length !== totalGuests) {
        logger.warn('Guest array count mismatch, generating additional guests', { 
          explicitAdults: data.adultGuests, 
          explicitChildren: data.childGuests,
          arrayAdults: arrayAdultCount, 
          arrayChildren: arrayChildCount,
          arrayLength: guests.length 
        });
        
        // Generate missing guests
        const existingGuests = [...guests];
        let counter = existingGuests.length + 1;
        
        // Add missing adults
        while (existingGuests.filter(g => g.type === GuestType.ADULT).length < finalAdultCount) {
          existingGuests.push({
            firstName: `Guest ${counter++}`,
            lastName: '(Adult)',
            type: GuestType.ADULT,
            isPrimary: false,
          });
        }
        
        // Add missing children
        while (existingGuests.filter(g => g.type === GuestType.CHILD).length < finalChildCount) {
          existingGuests.push({
            firstName: `Guest ${counter++}`,
            lastName: '(Child)',
            type: GuestType.CHILD,
            isPrimary: false,
          });
        }
        
        finalGuests = existingGuests;
      }
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
      for (let i = 0; i < (data.childGuests || 0); i++) {
        finalGuests.push({
          firstName: `Guest ${guestCounter++}`,
          lastName: '(Child)',
          type: GuestType.CHILD,
          isPrimary: false,
        });
      }
    }

    const arrayChildCount = finalGuests.filter(g => g.type === GuestType.CHILD).length;
    finalChildCount = finalChildCount || arrayChildCount;

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
    // The overlap check below gives a clean error in the common case; the database constraint
    // catches the race where two requests pass it at once.
    const booking = await withBookingNumberRetry(() => prisma.$transaction(async (tx) => {
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
          status: { in: SITE_HOLDING_STATUSES },
          OR: [
            { checkInDate: { lt: end }, checkOutDate: { gt: start } }
          ]
        }
      });
      if (conflicting) throw new ApiError(409, SITE_UNAVAILABLE_MESSAGE);

      // Price the stay (site rules, equipment, tax, deposit) with the same engine that quotes it
      const quote = await pricingService.quote({ siteId, start, end, equipmentReservations }, tx);
      await assertEquipmentAvailable(tx, quote.equipment, start, end);

      // Create Booking
      const bookingNumber = generateBookingNumber();

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
          totalAmount: quote.totalAmount,
          taxAmount: quote.taxAmount,
          depositAmount: quote.depositAmount,
          discountAmount: quote.discountAmount,
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
          },
          equipmentReservations: {
            create: quote.equipment.map((line) => ({
              equipmentId: line.equipmentId,
              quantity: line.quantity,
              startDate: start,
              endDate: end,
              status: 'CONFIRMED' as const,
              dailyRate: line.dailyRate,
              totalAmount: line.totalAmount,
            })),
          },
        },
        include: { guests: true, equipmentReservations: true }
      });
    })).catch((error: unknown) => {
      if (isOverlapViolation(error)) throw new ApiError(409, SITE_UNAVAILABLE_MESSAGE);
      throw error;
    });

    // Invalidate caches after successful transaction
    await this.invalidateBookingCaches();

    return booking;
  }

  /**
   * Staff confirmation of a PENDING booking (e.g. paid at the desk, or approved to pay later).
   *
   * With a paymentMethod, the outstanding balance is recorded as paid in full by that method.
   * Without one, the booking is confirmed and the balance stays due.
   */
  async confirmBooking(
    id: string,
    options: { paymentMethod?: PaymentMethod; confirmedBy: string }
  ): Promise<Booking> {
    const { paymentMethod, confirmedBy } = options;

    const { booking: confirmed, payment } = await prisma.$transaction(async (tx) => {
      // Claim the PENDING -> CONFIRMED transition so concurrent confirms/expiry can't both win
      const claimed = await tx.booking.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });

      if (claimed.count === 0) {
        const existing = await tx.booking.findUnique({ where: { id }, select: { status: true } });
        if (!existing) throw new ApiError(404, 'Booking not found');
        throw new ApiError(409, `Only pending bookings can be confirmed (this one is ${existing.status})`);
      }

      const booking = await tx.booking.findUniqueOrThrow({ where: { id } });
      const outstanding = Math.round((booking.totalAmount - booking.paidAmount) * 100) / 100;

      let payment: Payment | null = null;
      if (paymentMethod && outstanding > 0) {
        payment = await tx.payment.create({
          data: {
            bookingId: id,
            userId: booking.userId,
            amount: outstanding,
            method: paymentMethod,
            status: PaymentStatus.PAID,
            processedAt: new Date(),
            description: `Recorded by staff (${confirmedBy})`,
          },
        });
        await tx.booking.update({
          where: { id },
          data: { paidAmount: { increment: outstanding }, paymentStatus: PaymentStatus.PAID },
        });
      }

      logger.info('Booking confirmed by staff', {
        bookingId: id,
        confirmedBy,
        paymentRecorded: Boolean(paymentMethod && outstanding > 0),
      });

      const updated = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          site: true,
        },
      });
      return { booking: updated, payment };
    });

    // After commit, so clients that refetch always see the new state
    publishBookingEvent(BOOKING_EVENTS.confirmed, confirmed);
    if (payment) publishPaymentEvent(PAYMENT_EVENTS.processed, payment);

    return confirmed;
  }

  /**
   * Cancel unpaid PENDING bookings that have held their site longer than the hold window.
   *
   * A booking is left alone if any money is involved: a payment taken, or a payment started
   * within the last PAYMENT_IN_FLIGHT_MINUTES (the customer may be paying right now).
   * Returns the bookings that were cancelled so callers can notify clients.
   */
  async expireUnpaidBookings(): Promise<Booking[]> {
    const cutoff = new Date(Date.now() - config.business.pendingBookingHoldMinutes * 60_000);
    const inFlightCutoff = new Date(Date.now() - PAYMENT_IN_FLIGHT_MINUTES * 60_000);

    const where: Prisma.BookingWhereInput = {
      status: 'PENDING',
      createdAt: { lt: cutoff },
      paidAmount: 0,
      payments: {
        none: {
          OR: [
            { status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIAL] } },
            { status: PaymentStatus.PENDING, createdAt: { gte: inFlightCutoff } },
          ],
        },
      },
    };

    const candidates = await prisma.booking.findMany({ where, select: { id: true } });
    if (candidates.length === 0) return [];
    const ids = candidates.map((b) => b.id);

    // Re-apply the conditions in the write itself so a payment landing in between wins, and
    // release the equipment of whichever bookings were really cancelled
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { ...where, id: { in: ids } },
        data: { status: 'CANCELLED' },
      }),
      prisma.equipmentReservation.updateMany({
        where: { bookingId: { in: ids }, status: 'CONFIRMED', booking: { status: 'CANCELLED' } },
        data: { status: 'CANCELLED' },
      }),
    ]);

    const cancelled = await prisma.booking.findMany({ where: { id: { in: ids }, status: 'CANCELLED' } });

    if (cancelled.length > 0) {
      logger.info('Expired unpaid pending bookings', {
        count: cancelled.length,
        holdMinutes: config.business.pendingBookingHoldMinutes,
      });
      await this.invalidateBookingCaches();
    }

    return cancelled;
  }

  /**
   * Cancel a booking (customer or staff).
   *
   * The PENDING/CONFIRMED -> CANCELLED move is claimed atomically, so two simultaneous cancels
   * cannot both go through (and announce it twice). Cancelling again is a harmless no-op.
   * Equipment held by the booking is released, and cached availability is cleared.
   *
   * NOTE: this records what is owed back (`refund`) but does not send money anywhere; a staff
   * member issues the actual refund from the payments screen.
   */
  async cancelBooking(id: string, options: { reason?: string; cancelledBy: string }) {
    const reason = options.reason?.trim() ?? '';

    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, checkInDate: true, paidAmount: true, totalAmount: true, paymentStatus: true, notes: true },
    });
    if (!existing) throw new ApiError(404, 'Booking not found');

    if (existing.status === 'CANCELLED') {
      return { booking: await bookingQueryService.getDetail(id), refund: ALREADY_CANCELLED_REFUND, alreadyCancelled: true };
    }
    if (!CANCELLABLE_STATUSES.includes(existing.status)) {
      throw new ApiError(400, 'Only pending or confirmed bookings can be cancelled');
    }

    const refund: CancellationRefund = computeCancellationRefund(existing);

    const [claimed] = await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id, status: { in: CANCELLABLE_STATUSES } },
        data: {
          status: 'CANCELLED',
          paymentStatus: existing.paidAmount > 0 ? 'REFUNDED' : 'PENDING',
          notes: reason ? [existing.notes, `Cancellation reason: ${reason}`].filter(Boolean).join('\n') : existing.notes,
        },
      }),
      // Give the equipment back so someone else can book it
      prisma.equipmentReservation.updateMany({
        where: { bookingId: id, status: 'CONFIRMED', booking: { status: 'CANCELLED' } },
        data: { status: 'CANCELLED' },
      }),
    ]);

    // Someone else changed the booking between our read and our write
    if (claimed.count === 0) {
      const now = await prisma.booking.findUnique({ where: { id }, select: { status: true } });
      if (now?.status === 'CANCELLED') {
        return { booking: await bookingQueryService.getDetail(id), refund: ALREADY_CANCELLED_REFUND, alreadyCancelled: true };
      }
      throw new ApiError(400, 'Only pending or confirmed bookings can be cancelled');
    }

    const booking = await bookingQueryService.getDetail(id);

    await this.invalidateBookingCaches();
    publishBookingEvent(BOOKING_EVENTS.cancelled, booking);
    logger.info('Booking cancelled', {
      bookingId: id,
      cancelledBy: options.cancelledBy,
      refundAmount: refund.refundAmount,
      refundPercentage: refund.refundPercentage,
    });

    return { booking, refund, alreadyCancelled: false };
  }

  /** Check a guest in. Only a CONFIRMED booking can be; doing it twice is refused, not repeated. */
  async checkIn(id: string, checkedInBy: string) {
    return this.moveStay(id, {
      from: 'CONFIRMED',
      to: 'CHECKED_IN',
      timeField: 'checkInTime',
      refusal: 'Only confirmed bookings can be checked in',
      event: BOOKING_EVENTS.checkedIn,
      actor: checkedInBy,
    });
  }

  /** Check a guest out. Only a CHECKED_IN booking can be. */
  async checkOut(id: string, checkedOutBy: string) {
    return this.moveStay(id, {
      from: 'CHECKED_IN',
      to: 'CHECKED_OUT',
      timeField: 'checkOutTime',
      refusal: 'Only checked-in bookings can be checked out',
      event: BOOKING_EVENTS.checkedOut,
      actor: checkedOutBy,
    });
  }

  private async moveStay(
    id: string,
    step: { from: BookingStatus; to: BookingStatus; timeField: 'checkInTime' | 'checkOutTime'; refusal: string; event: BookingEventName; actor: string }
  ) {
    // Claim the move in the write itself, so a double click can't do it twice
    const claimed = await prisma.booking.updateMany({
      where: { id, status: step.from },
      data: { status: step.to, [step.timeField]: new Date() },
    });

    if (claimed.count === 0) {
      const exists = await prisma.booking.findUnique({ where: { id }, select: { id: true } });
      throw exists ? new ApiError(400, step.refusal) : new ApiError(404, 'Booking not found');
    }

    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id },
      include: { user: { select: BOOKING_USER_SELECT }, site: true },
    });

    publishBookingEvent(step.event, booking);
    logger.info(`Booking moved to ${step.to}`, { bookingId: id, bookingNumber: booking.bookingNumber, by: step.actor });

    return booking;
  }

  /**
   * Invalidate booking-related caches
   */
  private async invalidateBookingCaches(): Promise<void> {
    await cacheService.flushPattern('equipment:availability:*');
    await cacheService.flushPattern('sites:list:*');
    logger.info('Booking-related caches invalidated');
  }

  /**
   * Update booking (Dates, Guests, Notes, etc.)
   */
  async updateBooking(id: string, data: Partial<CreateBookingDto> & { notes?: string, specialRequests?: string }): Promise<Booking> {
    const updated = await prisma.$transaction(async (tx) => {
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
              status: { in: SITE_HOLDING_STATUSES },
              OR: [
                { checkInDate: { lt: end }, checkOutDate: { gt: start } }
              ]
            }
          });
          if (conflicting) throw new ApiError(409, SITE_UNAVAILABLE_MESSAGE);

          updates.checkInDate = start;
          updates.checkOutDate = end;

          // Equipment travels with the stay: keep what was reserved (at the rates agreed then),
          // check it is free for the new dates, and re-price everything with the same engine
          const reservations = await tx.equipmentReservation.findMany({ where: { bookingId: id, status: 'CONFIRMED' } });
          const quote = await pricingService.quote(
            {
              siteId: booking.siteId,
              start,
              end,
              equipmentReservations: reservations.map((r) => ({ equipmentId: r.equipmentId, quantity: r.quantity })),
              equipmentRates: new Map(reservations.map((r) => [r.equipmentId, r.dailyRate])),
            },
            tx
          );
          await assertEquipmentAvailable(tx, quote.equipment, start, end, id);

          for (const reservation of reservations) {
            await tx.equipmentReservation.update({
              where: { id: reservation.id },
              data: {
                startDate: start,
                endDate: end,
                totalAmount: round2(reservation.dailyRate * reservation.quantity * quote.nights),
              },
            });
          }

          updates.totalAmount = quote.totalAmount;
          updates.taxAmount = quote.taxAmount;
          updates.depositAmount = quote.depositAmount;
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
    }).catch((error: unknown) => {
      if (isOverlapViolation(error)) throw new ApiError(409, SITE_UNAVAILABLE_MESSAGE);
      throw error;
    });

    publishBookingEvent(BOOKING_EVENTS.updated, updated);
    return updated;
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

    const updated = await prisma.$transaction(async (tx) => {
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

    publishBookingEvent(BOOKING_EVENTS.updated, updated);
    return updated;
  }
}

export default new BookingService();
