// Booking Routes

import { Router, Request, Response, NextFunction } from 'express';
import { Prisma, Booking } from '@prisma/client';
import { authenticate, authorize, authorizeBookingOwnership } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import logger from '@/utils/logger';
import bookingService from '@/services/booking.service';
import { getPrismaClient } from '@/database';
import {
  validateBody,
  createBookingSchema,
  updateBookingSchema,
  updateGuestsSchema
} from '@/middleware/validate';

const router = Router();
const prisma = getPrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface BookingFilters {
  status?: string;
  siteId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

/**
 * Build Prisma where clause for booking queries.
 * Handles role-based filtering and common search/filter parameters.
 */
function buildBookingWhereClause(
  user: NonNullable<Request['user']>,
  filters: BookingFilters
): Prisma.BookingWhereInput {
  const { status, siteId, startDate, endDate, searchTerm } = filters;
  const where: Prisma.BookingWhereInput = {};

  // Customers can only see their own bookings
  if (user.role === 'CUSTOMER') {
    where.userId = user.id;
  }

  if (status) {
    where.status = status as Prisma.BookingWhereInput['status'];
  }

  if (siteId) {
    where.siteId = siteId;
  }

  if (startDate || endDate) {
    where.checkInDate = {};
    if (startDate) {
      where.checkInDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.checkInDate.lte = new Date(endDate);
    }
  }

  if (searchTerm) {
    where.OR = [
      { bookingNumber: { contains: searchTerm, mode: 'insensitive' } },
      { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  return where;
}

/**
 * Common booking select fields for list views.
 */
const bookingListSelect = {
  id: true,
  bookingNumber: true,
  checkInDate: true,
  checkOutDate: true,
  status: true,
  paymentStatus: true,
  totalAmount: true,
  adultGuests: true,
  childGuests: true,
  petGuests: true,
  taxAmount: true,
  paidAmount: true,
  depositAmount: true,
  discountAmount: true,
  checkInTime: true,
  checkOutTime: true,
  specialRequests: true,
  notes: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  site: {
    select: {
      id: true,
      name: true,
      type: true,
      basePrice: true,
      amenities: true,
    },
  },
  guests: true,
  vehicles: true,
  equipmentReservations: {
    include: {
      equipment: true,
    },
  },
} as const;

interface BookingWithGuestCounts {
  adultGuests: number;
  childGuests: number;
  petGuests: number;
  _count?: { guests: number; vehicles: number; equipmentReservations: number };
}

/**
 * Transform booking to include structured guest counts.
 */
function transformBookingForResponse<T extends BookingWithGuestCounts>(booking: T) {
  const { _count, ...rest } = booking as T & { _count?: BookingWithGuestCounts['_count'] };
  return {
    ...rest,
    guests: {
      adults: booking.adultGuests,
      children: booking.childGuests,
      pets: booking.petGuests,
    },
    guestDetails: (booking as any).guests || [],
    ...(
      _count && {
        guestCount: _count.guests,
        vehicleCount: _count.vehicles,
        equipmentRentalCount: _count.equipmentReservations,
      }
    ),
  };
}

interface CancellationRefundResponse {
  refundAmount: number;
  refundPercentage: number;
  cancellationFee: number;
  reason: string;
}

function computeCancellationRefund(booking: { checkInDate: Date; paidAmount: number; totalAmount: number; paymentStatus?: string }): CancellationRefundResponse {
  const now = Date.now();
  const checkInAt = booking.checkInDate.getTime();
  const msUntilCheckIn = Math.max(checkInAt - now, 0);
  const daysUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60 * 24);

  // Simple, deterministic policy for customer-facing pre-check:
  // - >= 7 days: full refund
  // - >= 2 days: 90% refund
  // - < 2 days: 75% refund
  const refundPercentage =
    daysUntilCheckIn >= 7 ? 100 : daysUntilCheckIn >= 2 ? 90 : 75;

  // Some legacy rows can have paymentStatus=PAID while paidAmount stayed at 0.
  // In that case, use totalAmount as the refundable base to avoid showing RM 0.
  const normalizedPaidAmount =
    booking.paidAmount > 0
      ? booking.paidAmount
      : booking.paymentStatus === 'PAID'
        ? booking.totalAmount
        : 0;

  const paidAmount = Math.max(normalizedPaidAmount, 0);
  const refundAmount = Number(((paidAmount * refundPercentage) / 100).toFixed(2));
  const cancellationFee = Number((paidAmount - refundAmount).toFixed(2));

  return {
    refundAmount,
    refundPercentage,
    cancellationFee,
    reason:
      paidAmount <= 0
        ? 'No payment recorded yet. Cancelling now will not incur a refund or fee.'
        : `Cancellation policy applies ${refundPercentage}% refund based on check-in date proximity.`,
  };
}

// ============================================================================
// ROUTES
// ============================================================================


/**
 * GET /bookings
 * Get all bookings (with filters)
 * Staff/Manager/Admin: Can see all bookings
 * Customer: Can only see their own bookings
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, siteId, startDate, endDate, searchTerm } = req.query;
    const user = req.user!;

    const where = buildBookingWhereClause(user, {
      status: status as string | undefined,
      siteId: siteId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      searchTerm: searchTerm as string | undefined,
    });

    const bookings = await prisma.booking.findMany({
      where,
      select: bookingListSelect,
      orderBy: { checkInDate: 'desc' },
    });

    const transformedBookings = bookings.map(transformBookingForResponse);

    logger.info('Bookings retrieved', {
      userId: user.id,
      userRole: user.role,
      count: bookings.length,
      filters: { status, siteId, startDate, endDate, searchTerm },
    });

    res.json({
      success: true,
      data: transformedBookings,
      count: transformedBookings.length,
    });
  } catch (error) {
    logger.error('Failed to retrieve bookings', error);
    next(error);
  }
});

/**
 * GET /bookings/paginated
 * Get paginated bookings
 */
router.get('/paginated', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status, siteId, startDate, endDate, searchTerm } = req.query;
    const user = req.user!;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = buildBookingWhereClause(user, {
      status: status as string | undefined,
      siteId: siteId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      searchTerm: searchTerm as string | undefined,
    });

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: bookingListSelect,
        orderBy: { checkInDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    const transformedBookings = bookings.map(transformBookingForResponse);

    res.json({
      success: true,
      data: transformedBookings,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    logger.error('Failed to retrieve paginated bookings', error);
    next(error);
  }
});

/**
 * GET /bookings/my-bookings
 * Get current user's bookings
 */
router.get('/my-bookings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status } = req.query;

    const where: any = {
      userId: user.id,
    };

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
        vehicles: true,
        guests: true,
        equipmentReservations: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });

    const now = Date.now();
    const transformedBookings = bookings.map(booking => {
      const derivedStatus =
        booking.status === 'CHECKED_IN' && new Date(booking.checkOutDate).getTime() < now
          ? 'CHECKED_OUT'
          : booking.status;

      return {
        ...booking,
        status: derivedStatus,
        guests: {
          adults: booking.adultGuests,
          children: booking.childGuests,
          pets: booking.petGuests,
        },
      };
    });

    res.json({
      success: true,
      data: transformedBookings,
    });
  } catch (error) {
    logger.error('Failed to retrieve user bookings', error);
    next(error);
  }
});

/**
 * GET /bookings/:id/refund-calculation
 * Calculate potential refund prior to cancellation
 */
router.get('/:id/refund-calculation', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        checkInDate: true,
        paidAmount: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      return res.json({
        success: true,
        data: {
          refundAmount: 0,
          refundPercentage: 0,
          cancellationFee: 0,
          reason: 'Booking is already cancelled.',
        },
      });
    }

    const refund = computeCancellationRefund(booking);

    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/cancel
 * Cancel booking and return refund details
 */
router.post('/:id/cancel', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';

    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      select: {
        id: true,
        status: true,
        checkInDate: true,
        paidAmount: true,
        totalAmount: true,
        paymentStatus: true,
        notes: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      // Treat repeated cancel requests as idempotent success for safer UX.
      const alreadyCancelled = await prisma.booking.findUniqueOrThrow({
        where: { id: id as string },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
              type: true,
              basePrice: true,
              description: true,
              amenities: true,
            },
          },
          vehicles: true,
          guests: true,
          equipmentReservations: {
            include: {
              equipment: true,
            },
          },
          payments: true,
        },
      });

      return res.json({
        success: true,
        data: {
          ...alreadyCancelled,
          guests: {
            adults: alreadyCancelled.adultGuests,
            children: alreadyCancelled.childGuests,
            pets: alreadyCancelled.petGuests,
          },
          guestDetails: alreadyCancelled.guests,
        },
        meta: {
          refund: {
            refundAmount: 0,
            refundPercentage: 0,
            cancellationFee: 0,
            reason: 'Booking is already cancelled.',
          },
        },
      });
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new ApiError(400, 'Only pending or confirmed bookings can be cancelled');
    }

    const refund = computeCancellationRefund(booking);
    const updatedBooking = await prisma.booking.update({
      where: { id: id as string },
      data: {
        status: 'CANCELLED',
        paymentStatus: booking.paidAmount > 0 ? 'REFUNDED' : 'PENDING',
        notes: reason
          ? [booking.notes, `Cancellation reason: ${reason}`].filter(Boolean).join('\n')
          : booking.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
            description: true,
            amenities: true,
          },
        },
        vehicles: true,
        guests: true,
        equipmentReservations: {
          include: {
            equipment: true,
          },
        },
        payments: true,
      },
    });

    logger.info('Booking cancelled', {
      bookingId: updatedBooking.id,
      userId: req.user?.id,
      refundAmount: refund.refundAmount,
      refundPercentage: refund.refundPercentage,
    });

    res.json({
      success: true,
      data: {
        ...updatedBooking,
        guests: {
          adults: updatedBooking.adultGuests,
          children: updatedBooking.childGuests,
          pets: updatedBooking.petGuests,
        },
        guestDetails: updatedBooking.guests,
      },
      meta: {
        refund,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /bookings/:id
 * Get booking by ID
 */
router.get('/:id', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
            description: true,
            amenities: true,
          },
        },
        vehicles: true,
        guests: true,
        equipmentReservations: {
          include: {
            equipment: true,
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const transformedBooking = {
      ...booking,
      guests: {
        adults: booking.adultGuests,
        children: booking.childGuests,
        pets: booking.petGuests,
      },
      guestDetails: booking.guests,
    };

    res.json({
      success: true,
      data: transformedBooking,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/check-in
 * Check in a booking (Staff/Manager/Admin only)
 */
router.post('/:id/check-in', authenticate, authorize('STAFF', 'MANAGER', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new ApiError(400, 'Only confirmed bookings can be checked in');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id as string },
      data: {
        status: 'CHECKED_IN',
        checkInTime: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        site: true,
      },
    });

    logger.info('Booking checked in', {
      bookingId: id,
      bookingNumber: updatedBooking.bookingNumber,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        ...updatedBooking,
        guests: {
          adults: updatedBooking.adultGuests,
          children: updatedBooking.childGuests,
          pets: updatedBooking.petGuests,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/check-out
 * Check out a booking (Staff/Manager/Admin only)
 */
router.post('/:id/check-out', authenticate, authorize('STAFF', 'MANAGER', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.status !== 'CHECKED_IN') {
      throw new ApiError(400, 'Only checked-in bookings can be checked out');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id as string },
      data: {
        status: 'CHECKED_OUT',
        checkOutTime: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        site: true,
      },
    });

    logger.info('Booking checked out', {
      bookingId: id,
      bookingNumber: updatedBooking.bookingNumber,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: {
        ...updatedBooking,
        guests: {
          adults: updatedBooking.adultGuests,
          children: updatedBooking.childGuests,
          pets: updatedBooking.petGuests,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /bookings/:id/payments
 * Get payments for a booking
 */
router.get('/:id/payments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if booking exists and user has access (already covered partly by verify, but let's be safe)
    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
    });

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    if (booking.userId !== req.user!.id && !['ADMIN', 'MANAGER', 'STAFF'].includes(req.user!.role)) {
      throw new ApiError(403, 'Unauthorized');
    }

    const payments = await prisma.payment.findMany({
      where: { bookingId: id as string },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST /bookings
 * Create a new booking
 */
router.post('/', authenticate, validateBody(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking({
      ...req.body,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /bookings/:id
 * Update booking (Dates, Guests, etc.)
 */
router.put('/:id', authenticate, authorizeBookingOwnership, validateBody(updateBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.updateBooking(id as string, req.body);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /bookings/:id/guests
 * Update booking guest list
 */
router.put('/:id/guests', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), validateBody(updateGuestsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { guests } = req.body;

    if (!guests || !Array.isArray(guests)) {
      throw new ApiError(400, 'Valid guests array is required');
    }

    const booking = await bookingService.updateBookingGuests(id as string, guests);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

export default router;
