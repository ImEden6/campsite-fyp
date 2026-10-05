// Booking queries (reads)
//
// Who may see what, how lists are filtered and paged, and the shape bookings are returned in.
// Writes live in booking.service.ts.

import { Prisma } from '@prisma/client';
import { getPrismaClient } from '@/database';
import { ApiError } from '@/utils/errors';
import { computeCancellationRefund, ALREADY_CANCELLED_REFUND, type CancellationRefund } from './booking-policy';

const prisma = getPrismaClient();

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

export interface Viewer {
  id: string;
  role: string;
}

export interface BookingFilters {
  status?: string | undefined;
  siteId?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  searchTerm?: string | undefined;
}

/** The customer fields shown next to a booking. Never includes the password hash. */
export const BOOKING_USER_SELECT = { id: true, email: true, firstName: true, lastName: true, phone: true } as const;

const SITE_SUMMARY_SELECT = { id: true, name: true, type: true, basePrice: true } as const;

/** Everything shown on a booking's detail page. */
export const BOOKING_DETAIL_INCLUDE = {
  user: { select: BOOKING_USER_SELECT },
  site: { select: { ...SITE_SUMMARY_SELECT, description: true, amenities: true } },
  vehicles: true,
  guests: true,
  equipmentReservations: { include: { equipment: true } },
  payments: true,
} satisfies Prisma.BookingInclude;

const BOOKING_LIST_SELECT = {
  id: true,
  siteId: true,
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
  user: { select: BOOKING_USER_SELECT },
  site: { select: { ...SITE_SUMMARY_SELECT, amenities: true } },
  guests: true,
  vehicles: true,
  equipmentReservations: { include: { equipment: true } },
} satisfies Prisma.BookingSelect;

// ---------------------------------------------------------------------------------------------
// Response shaping
// ---------------------------------------------------------------------------------------------

interface HasGuestCounts {
  adultGuests: number;
  childGuests: number;
  petGuests: number;
}

/** The API reports guests as counts: { adults, children, pets }. */
export const guestCounts = (booking: HasGuestCounts) => ({
  adults: booking.adultGuests,
  children: booking.childGuests,
  pets: booking.petGuests,
});

/** Replace the guest rows with counts, keeping the rows available as `guestDetails`. */
export function withGuestCounts<T extends HasGuestCounts & { guests?: unknown }>(booking: T) {
  return { ...booking, guests: guestCounts(booking), guestDetails: booking.guests ?? [] };
}

/** Counts only, for responses that never carried the guest rows. */
export function withGuestCountsOnly<T extends HasGuestCounts>(booking: T) {
  return { ...booking, guests: guestCounts(booking) };
}

// ---------------------------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------------------------

/** Customers only ever see their own bookings; staff see everyone's. */
export function buildBookingWhere(viewer: Viewer, filters: BookingFilters): Prisma.BookingWhereInput {
  const { status, siteId, startDate, endDate, searchTerm } = filters;
  const where: Prisma.BookingWhereInput = {};

  if (!STAFF_ROLES.includes(viewer.role)) where.userId = viewer.id;
  if (status) where.status = status as Prisma.BookingWhereInput['status'];
  if (siteId) where.siteId = siteId;

  if (startDate || endDate) {
    where.checkInDate = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
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

export class BookingQueryService {
  async list(viewer: Viewer, filters: BookingFilters) {
    const rows = await prisma.booking.findMany({
      where: buildBookingWhere(viewer, filters),
      select: BOOKING_LIST_SELECT,
      orderBy: { checkInDate: 'desc' },
    });
    return rows.map(withGuestCounts);
  }

  async listPaginated(viewer: Viewer, filters: BookingFilters, page: number, limit: number) {
    const where = buildBookingWhere(viewer, filters);
    const [rows, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: BOOKING_LIST_SELECT,
        orderBy: { checkInDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return { data: rows.map(withGuestCounts), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** The signed-in user's own bookings. A stay that is past its check-out date reads as checked out. */
  async listMine(userId: string, status?: string, now: Date = new Date()) {
    const rows = await prisma.booking.findMany({
      where: { userId, ...(status && { status: status as Prisma.BookingWhereInput['status'] }) },
      include: {
        site: { select: SITE_SUMMARY_SELECT },
        vehicles: true,
        guests: true,
        equipmentReservations: { include: { equipment: true } },
      },
      orderBy: { checkInDate: 'desc' },
    });

    return rows.map((booking) => ({
      ...withGuestCountsOnly(booking),
      status: booking.status === 'CHECKED_IN' && booking.checkOutDate.getTime() < now.getTime() ? 'CHECKED_OUT' : booking.status,
    }));
  }

  async getDetail(id: string) {
    const booking = await prisma.booking.findUnique({ where: { id }, include: BOOKING_DETAIL_INCLUDE });
    if (!booking) throw new ApiError(404, 'Booking not found');
    return booking;
  }

  async getRefundPreview(id: string): Promise<CancellationRefund> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { checkInDate: true, paidAmount: true, totalAmount: true, paymentStatus: true, status: true },
    });
    if (!booking) throw new ApiError(404, 'Booking not found');

    return booking.status === 'CANCELLED' ? ALREADY_CANCELLED_REFUND : computeCancellationRefund(booking);
  }

  async getPayments(id: string, viewer: Viewer) {
    const booking = await prisma.booking.findUnique({ where: { id }, select: { userId: true } });
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.userId !== viewer.id && !STAFF_ROLES.includes(viewer.role)) throw new ApiError(403, 'Unauthorized');

    return prisma.payment.findMany({ where: { bookingId: id }, orderBy: { createdAt: 'desc' } });
  }
}

export default new BookingQueryService();
