// Booking Routes

import { Router, Request, Response, NextFunction } from 'express';
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

    // Build where clause based on user role
    const where: any = {};

    // Customers can only see their own bookings
    if (user.role === 'CUSTOMER') {
      where.userId = user.id;
    }

    // Apply filters
    if (status) {
      where.status = status;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) {
        where.checkInDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.checkInDate.lte = new Date(endDate as string);
      }
    }

    // Search by booking number or guest name
    if (searchTerm) {
      where.OR = [
        { bookingNumber: { contains: searchTerm as string, mode: 'insensitive' } },
        { user: { firstName: { contains: searchTerm as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm as string, mode: 'insensitive' } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: {
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
          },
        },
        _count: {
          select: {
            guests: true,
            vehicles: true,
            equipmentRentals: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });

    // Transform bookings to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      guests: {
        adults: booking.adultGuests,
        children: booking.childGuests,
        pets: booking.petGuests,
      },
      // Use counts from _count for list view
      guestCount: booking._count.guests,
      vehicleCount: booking._count.vehicles,
      equipmentRentalCount: booking._count.equipmentRentals,
    }));

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

    // Build where clause
    const where: any = {};

    if (user.role === 'CUSTOMER') {
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (siteId) {
      where.siteId = siteId;
    }

    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) {
        where.checkInDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.checkInDate.lte = new Date(endDate as string);
      }
    }

    if (searchTerm) {
      where.OR = [
        { bookingNumber: { contains: searchTerm as string, mode: 'insensitive' } },
        { user: { firstName: { contains: searchTerm as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchTerm as string, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
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
            },
          },
          _count: {
            select: {
              guests: true,
              vehicles: true,
              equipmentRentals: true,
            },
          },
        },
        orderBy: {
          checkInDate: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      guests: {
        adults: booking.adultGuests,
        children: booking.childGuests,
        pets: booking.petGuests,
      },
      guestCount: booking._count.guests,
      vehicleCount: booking._count.vehicles,
      equipmentRentalCount: booking._count.equipmentRentals,
    }));

    res.json({
      items: transformedBookings,
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
        equipmentRentals: {
          include: {
            equipment: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });

    const transformedBookings = bookings.map(booking => ({
      ...booking,
      guests: {
        adults: booking.adultGuests,
        children: booking.childGuests,
        pets: booking.petGuests,
      },
    }));

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
        equipmentRentals: {
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
