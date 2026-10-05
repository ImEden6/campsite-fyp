// POST /bookings/:id/confirm and the expiry job wiring (service, auth and sockets mocked)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const { bookingServiceMock, socketMock, prismaMock } = vi.hoisted(() => ({
  prismaMock: { booking: { findUnique: vi.fn(), update: vi.fn() } },
  bookingServiceMock: { confirmBooking: vi.fn(), expireUnpaidBookings: vi.fn() },
  socketMock: { emitToRooms: vi.fn() },
}));

vi.mock('@/database', () => ({ default: prismaMock, getPrismaClient: () => prismaMock }));
vi.mock('@/services/booking.service', () => ({ default: bookingServiceMock }));
vi.mock('@/services/socket.service', () => ({ default: socketMock }));
vi.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: req.headers['x-user-id'], role: req.headers['x-user-role'] };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: () => void) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ success: false }),
  authorizeBookingOwnership: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import bookingRoutes from '@/routes/booking.routes';
import { expireUnpaidBookingsNow } from '@/jobs/cleanup';
import { errorHandler, ApiError } from '@/utils/errors';

const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);
app.use(errorHandler);

const as = (role: string) => ({ 'x-user-id': 'u-1', 'x-user-role': role });

describe('POST /bookings/:id/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bookingServiceMock.confirmBooking.mockResolvedValue({ id: 'b-1', status: 'CONFIRMED', adultGuests: 2, childGuests: 1, petGuests: 0 });
  });

  it.each(['STAFF', 'MANAGER', 'ADMIN'])('lets %s confirm', async (role) => {
    const res = await request(app).post('/bookings/b-1/confirm').set(as(role)).send({});

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'CONFIRMED', guests: { adults: 2, children: 1, pets: 0 } });
    expect(bookingServiceMock.confirmBooking).toHaveBeenCalledWith('b-1', { confirmedBy: 'u-1' });
  });

  it('does not let a customer confirm their own booking', async () => {
    const res = await request(app).post('/bookings/b-1/confirm').set(as('CUSTOMER')).send({});

    expect(res.status).toBe(403);
    expect(bookingServiceMock.confirmBooking).not.toHaveBeenCalled();
  });

  it('passes a payment method through and records who confirmed', async () => {
    await request(app).post('/bookings/b-1/confirm').set(as('STAFF')).send({ paymentMethod: 'CASH' });

    expect(bookingServiceMock.confirmBooking).toHaveBeenCalledWith('b-1', { paymentMethod: 'CASH', confirmedBy: 'u-1' });
  });

  it('rejects an unknown payment method and unexpected fields', async () => {
    const bad = await request(app).post('/bookings/b-1/confirm').set(as('STAFF')).send({ paymentMethod: 'BITCOIN' });
    const extra = await request(app).post('/bookings/b-1/confirm').set(as('STAFF')).send({ status: 'CHECKED_IN' });

    expect(bad.status).toBe(400);
    expect(extra.status).toBe(400);
    expect(bookingServiceMock.confirmBooking).not.toHaveBeenCalled();
  });

  it('surfaces the service conflict as 409', async () => {
    bookingServiceMock.confirmBooking.mockRejectedValue(new ApiError(409, 'Only pending bookings can be confirmed'));
    const res = await request(app).post('/bookings/b-1/confirm').set(as('STAFF')).send({});

    expect(res.status).toBe(409);
  });
});

describe('expiry job', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tells the staff room and the booking owner about each booking it cancels', async () => {
    const booking = {
      id: 'b-9', userId: 'u-9', siteId: 's-9', status: 'CANCELLED', bookingNumber: 'BK-9',
      checkInDate: new Date('2033-01-01'), checkOutDate: new Date('2033-01-03'),
    };
    bookingServiceMock.expireUnpaidBookings.mockResolvedValue([booking]);

    expect(await expireUnpaidBookingsNow()).toBe(1);
    expect(socketMock.emitToRooms).toHaveBeenCalledWith(
      ['staff', 'user:u-9'],
      'booking:cancelled',
      expect.objectContaining({ id: 'b-9', status: 'CANCELLED' })
    );
  });

  it('emits nothing when nothing expired', async () => {
    bookingServiceMock.expireUnpaidBookings.mockResolvedValue([]);

    expect(await expireUnpaidBookingsNow()).toBe(0);
    expect(socketMock.emitToRooms).not.toHaveBeenCalled();
  });
});

describe('check-in and check-out events', () => {
  const stay = (status: string) => ({
    id: 'b-5', userId: 'u-5', siteId: 's-5', status, bookingNumber: 'BK-5', adultGuests: 1, childGuests: 0, petGuests: 0,
    checkInDate: new Date('2034-01-01'), checkOutDate: new Date('2034-01-03'),
  });
  const ROOMS = ['staff', 'user:u-5'];

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.booking.update.mockImplementation(async ({ data }: { data: { status: string } }) => stay(data.status));
  });

  it('announces a check-in to staff and the owner', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(stay('CONFIRMED'));
    const res = await request(app).post('/bookings/b-5/check-in').set(as('STAFF')).send();

    expect(res.status).toBe(200);
    expect(socketMock.emitToRooms).toHaveBeenCalledTimes(1);
    expect(socketMock.emitToRooms).toHaveBeenCalledWith(ROOMS, 'booking:checked_in', expect.objectContaining({ id: 'b-5', status: 'CHECKED_IN' }));
  });

  it('announces a check-out to staff and the owner', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(stay('CHECKED_IN'));
    const res = await request(app).post('/bookings/b-5/check-out').set(as('STAFF')).send();

    expect(res.status).toBe(200);
    expect(socketMock.emitToRooms).toHaveBeenCalledWith(ROOMS, 'booking:checked_out', expect.objectContaining({ id: 'b-5', status: 'CHECKED_OUT' }));
  });

  it.each([
    ['check-in', 'PENDING'],
    ['check-in', 'CANCELLED'],
    ['check-out', 'CONFIRMED'],
  ])('announces nothing when %s is rejected for a %s booking', async (action, status) => {
    prismaMock.booking.findUnique.mockResolvedValue(stay(status));
    const res = await request(app).post(`/bookings/b-5/${action}`).set(as('STAFF')).send();

    expect(res.status).toBe(400);
    expect(socketMock.emitToRooms).not.toHaveBeenCalled();
  });

  it('announces nothing when a customer tries to check in', async () => {
    const res = await request(app).post('/bookings/b-5/check-in').set(as('CUSTOMER')).send();

    expect(res.status).toBe(403);
    expect(socketMock.emitToRooms).not.toHaveBeenCalled();
  });
});
