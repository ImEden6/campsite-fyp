// Booking Routes
//
// Thin on purpose: each handler checks permissions, calls a service, and shapes the response.
// The rules live in booking.service.ts (changes), booking-query.service.ts (reads),
// pricing.service.ts and booking-policy.ts.

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize, authorizeBookingOwnership } from '@/middleware/auth';
import { ApiError } from '@/utils/errors';
import bookingService from '@/services/booking.service';
import bookingQueryService, { withGuestCounts, withGuestCountsOnly, type BookingFilters } from '@/services/booking-query.service';
import pricingService from '@/services/pricing.service';
import {
  validateBody,
  createBookingSchema,
  updateBookingSchema,
  updateGuestsSchema,
  calculatePriceSchema,
  confirmBookingSchema,
  ConfirmBookingInput,
} from '@/middleware/validate';
import { publishBookingEvent, BOOKING_EVENTS } from '@/socket/booking-events';

const router = Router();

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const filtersFrom = (query: Request['query']): BookingFilters => ({
  status: asString(query.status),
  siteId: asString(query.siteId),
  startDate: asString(query.startDate),
  endDate: asString(query.endDate),
  searchTerm: asString(query.searchTerm),
});

/** A positive whole number from a query string, or the fallback. */
const positiveInt = (value: unknown, fallback: number, max = 100): number => {
  const n = parseInt(String(value), 10);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
};

const STAFF = ['STAFF', 'MANAGER', 'ADMIN'] as const;

// ---------------------------------------------------------------------------------------------
// Reading bookings
// ---------------------------------------------------------------------------------------------

/**
 * GET /bookings
 * Staff, managers and admins see every booking; customers only their own.
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bookingQueryService.list(req.user!, filtersFrom(req.query));
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
});

/** GET /bookings/paginated */
router.get('/paginated', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = positiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveInt(req.query.limit, 10);

    const result = await bookingQueryService.listPaginated(req.user!, filtersFrom(req.query), page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/** GET /bookings/my-bookings: the signed-in user's own bookings */
router.get('/my-bookings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bookingQueryService.listMine(req.user!.id, asString(req.query.status));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/** GET /bookings/:id/refund-calculation: what cancelling now would refund */
router.get('/:id/refund-calculation', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await bookingQueryService.getRefundPreview(req.params.id as string) });
  } catch (error) {
    next(error);
  }
});

/** GET /bookings/:id */
router.get('/:id', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingQueryService.getDetail(req.params.id as string);
    res.json({ success: true, data: withGuestCounts(booking) });
  } catch (error) {
    next(error);
  }
});

/** GET /bookings/:id/payments */
router.get('/:id/payments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await bookingQueryService.getPayments(req.params.id as string, req.user!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------------------------

/**
 * POST /bookings/calculate-price
 * Quote what a stay would cost: nightly rates, equipment, tax and deposit.
 * Public (prices are shown to visitors anyway); uses the same engine as booking creation.
 */
router.post('/calculate-price', validateBody(calculatePriceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteId, checkInDate, checkOutDate, equipmentReservations } = req.body;

    const quote = await pricingService.quote({
      siteId,
      start: new Date(checkInDate),
      end: new Date(checkOutDate),
      equipmentReservations,
    });

    res.json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------------------------
// Changing bookings
// ---------------------------------------------------------------------------------------------

/** POST /bookings: create a booking */
router.post('/', authenticate, validateBody(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking({ ...req.body, userId: req.user!.id });

    // Staff calendars and the booking's owner see the new booking in real-time
    publishBookingEvent(BOOKING_EVENTS.created, booking);

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

/** PUT /bookings/:id: change dates, guests or notes */
router.put('/:id', authenticate, authorizeBookingOwnership, validateBody(updateBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.updateBooking(req.params.id as string, req.body);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

/** PUT /bookings/:id/guests: replace the guest list (staff) */
router.put('/:id/guests', authenticate, authorize('ADMIN', 'MANAGER', 'STAFF'), validateBody(updateGuestsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { guests } = req.body;
    if (!guests || !Array.isArray(guests)) {
      throw new ApiError(400, 'Valid guests array is required');
    }

    const booking = await bookingService.updateBookingGuests(req.params.id as string, guests);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings/:id/cancel
 * Cancel a booking and report what is owed back. Cancelling twice is harmless.
 */
router.post('/:id/cancel', authenticate, authorizeBookingOwnership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { booking, refund } = await bookingService.cancelBooking(req.params.id as string, {
      reason: asString(req.body?.reason) ?? '',
      cancelledBy: req.user!.id,
    });

    res.json({ success: true, data: withGuestCounts(booking), meta: { refund } });
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------------------------
// Front desk (staff)
// ---------------------------------------------------------------------------------------------

/**
 * POST /bookings/:id/confirm
 * Confirm a pending booking. Body: { paymentMethod? }; when given, the outstanding balance is
 * recorded as paid by that method.
 */
router.post('/:id/confirm', authenticate, authorize(...STAFF), validateBody(confirmBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentMethod } = req.body as ConfirmBookingInput;

    const booking = await bookingService.confirmBooking(req.params.id as string, {
      ...(paymentMethod && { paymentMethod }),
      confirmedBy: req.user!.id,
    });

    res.json({ success: true, data: withGuestCountsOnly(booking) });
  } catch (error) {
    next(error);
  }
});

/** POST /bookings/:id/check-in */
router.post('/:id/check-in', authenticate, authorize(...STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.checkIn(req.params.id as string, req.user!.id);
    res.json({ success: true, data: withGuestCountsOnly(booking) });
  } catch (error) {
    next(error);
  }
});

/** POST /bookings/:id/check-out */
router.post('/:id/check-out', authenticate, authorize(...STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.checkOut(req.params.id as string, req.user!.id);
    res.json({ success: true, data: withGuestCountsOnly(booking) });
  } catch (error) {
    next(error);
  }
});

export default router;
