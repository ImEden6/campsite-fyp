// Payment routes + service unit tests (Stripe, Prisma and cache are mocked)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const BOOKING_ID = 'cjld2cjxh0000qzrmn831i7rn';
const PAYMENT_ID = 'cjld2cjxh0001qzrmn831i7rn';
const IDEM_KEY = '3f2b8c1e-9a4d-4c6e-8b1a-2d5f7e9a0b3c';

const { prismaMock, stripeMock, cacheMock } = vi.hoisted(() => {
  const model = () => ({
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  });
  const prismaMock: Record<string, any> = { booking: model(), payment: model() };
  prismaMock.$transaction = vi.fn((fn: (tx: unknown) => unknown) => fn(prismaMock));

  return {
    prismaMock,
    stripeMock: {
      paymentIntents: { create: vi.fn(), retrieve: vi.fn() },
      refunds: { create: vi.fn() },
      webhooks: { constructEvent: vi.fn() },
    },
    cacheMock: { safeGet: vi.fn(), safeSet: vi.fn() },
  };
});

vi.mock('stripe', () => ({ default: vi.fn(() => stripeMock) }));
vi.mock('@/database', () => ({ default: prismaMock, getPrismaClient: () => prismaMock }));
vi.mock('@/services/cache.service', () => ({ default: cacheMock }));
vi.mock('@/middleware/security', () => ({
  paymentRateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
// Auth: identity comes from test headers so each test picks its own user/role
vi.mock('@/middleware/auth', () => ({
  authenticate: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: req.headers['x-user-id'], role: req.headers['x-user-role'] };
    next();
  },
  authorize: (...roles: string[]) => (req: any, res: any, next: () => void) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ success: false }),
}));

process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

import paymentRoutes from '@/routes/payment.routes';
import { errorHandler } from '@/utils/errors';
import { config } from '@/config';

const app = express();
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use('/payments', paymentRoutes);
app.use(errorHandler);

const as = (userId: string, role = 'CUSTOMER') => ({ 'x-user-id': userId, 'x-user-role': role });

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: BOOKING_ID,
  userId: 'user-1',
  bookingNumber: 'BK-1',
  status: 'PENDING',
  totalAmount: 200,
  paidAmount: 50,
  ...overrides,
});

describe('POST /payments/intent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheMock.safeGet.mockResolvedValue(null);
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: 'pi_1',
      client_secret: 'secret_1',
      amount: 15000,
      currency: 'myr',
    });
    prismaMock.booking.findUnique.mockResolvedValue(booking());
  });

  it('charges the outstanding balance when no amount is sent', async () => {
    const res = await request(app).post('/payments/intent').set(as('user-1')).send({ bookingId: BOOKING_ID });

    expect(res.status).toBe(200);
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 15000, currency: 'myr' })
    );
    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 150, userId: 'user-1' }) })
    );
  });

  it('rejects an amount above the outstanding balance', async () => {
    const res = await request(app)
      .post('/payments/intent')
      .set(as('user-1'))
      .send({ bookingId: BOOKING_ID, amount: 15000 }); // cents sent by mistake

    expect(res.status).toBe(400);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('allows a partial payment up to the outstanding balance', async () => {
    const res = await request(app)
      .post('/payments/intent')
      .set(as('user-1'))
      .send({ bookingId: BOOKING_ID, amount: 40 });

    expect(res.status).toBe(200);
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 4000 }));
  });

  it('returns 404 for another customer\'s booking', async () => {
    const res = await request(app).post('/payments/intent').set(as('user-2')).send({ bookingId: BOOKING_ID });

    expect(res.status).toBe(404);
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });

  it('rejects a fully paid booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(booking({ paidAmount: 200 }));
    const res = await request(app).post('/payments/intent').set(as('user-1')).send({ bookingId: BOOKING_ID });

    expect(res.status).toBe(409);
  });

  it('rejects a cancelled booking', async () => {
    prismaMock.booking.findUnique.mockResolvedValue(booking({ status: 'CANCELLED' }));
    const res = await request(app).post('/payments/intent').set(as('user-1')).send({ bookingId: BOOKING_ID });

    expect(res.status).toBe(409);
  });

  it('scopes the idempotency cache key to the user and booking', async () => {
    await request(app)
      .post('/payments/intent')
      .set(as('user-1'))
      .send({ bookingId: BOOKING_ID, idempotencyKey: IDEM_KEY });

    const expectedKey = `payment:idempotency:user-1:${BOOKING_ID}:${IDEM_KEY}`;
    expect(cacheMock.safeGet).toHaveBeenCalledWith(expectedKey);
    expect(cacheMock.safeSet).toHaveBeenCalledWith(expectedKey, expect.anything(), expect.any(Number));
  });

  it('returns the cached intent on a repeated idempotency key', async () => {
    cacheMock.safeGet.mockResolvedValue({ id: 'pi_cached' });
    const res = await request(app)
      .post('/payments/intent')
      .set(as('user-1'))
      .send({ bookingId: BOOKING_ID, idempotencyKey: IDEM_KEY });

    expect(res.body).toMatchObject({ idempotent: true, data: { id: 'pi_cached' } });
    expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
  });
});

describe('POST /payments/confirm/:id', () => {
  const payment = { id: PAYMENT_ID, userId: 'user-1', bookingId: BOOKING_ID, amount: 150, status: 'PENDING' };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.payment.findFirst.mockResolvedValue(payment);
    prismaMock.payment.findUniqueOrThrow.mockResolvedValue({ ...payment, status: 'PAID' });
    prismaMock.payment.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.booking.update.mockResolvedValue({ status: 'PENDING', totalAmount: 200, paidAmount: 200 });
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded', amount_received: 15000 });
  });

  it('does not let another customer confirm someone else\'s payment', async () => {
    const res = await request(app).post('/payments/confirm/pi_1').set(as('user-2'));

    expect(res.status).toBe(404);
    expect(stripeMock.paymentIntents.retrieve).not.toHaveBeenCalled();
  });

  it('confirms for the payer, credits the booking once and confirms the booking when fully paid', async () => {
    const res = await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    expect(res.status).toBe(200);
    expect(prismaMock.booking.update).toHaveBeenNthCalledWith(1, {
      where: { id: BOOKING_ID },
      data: { paidAmount: { increment: 150 } },
    });
    expect(prismaMock.booking.update).toHaveBeenNthCalledWith(2, {
      where: { id: BOOKING_ID },
      data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
    });
  });

  it('marks the booking PARTIAL and leaves it PENDING while a balance remains', async () => {
    prismaMock.booking.update.mockResolvedValueOnce({ status: 'PENDING', totalAmount: 200, paidAmount: 150 });
    await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    expect(prismaMock.booking.update).toHaveBeenNthCalledWith(2, {
      where: { id: BOOKING_ID },
      data: { paymentStatus: 'PARTIAL' },
    });
  });

  it.each(['CONFIRMED', 'CHECKED_IN', 'CANCELLED'])(
    'does not change the status of a %s booking when it becomes fully paid',
    async (status) => {
      prismaMock.booking.update.mockResolvedValueOnce({ status, totalAmount: 200, paidAmount: 200 });
      await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

      expect(prismaMock.booking.update).toHaveBeenNthCalledWith(2, {
        where: { id: BOOKING_ID },
        data: { paymentStatus: 'PAID' },
      });
    }
  );

  it('does not double-count when the payment was already confirmed', async () => {
    prismaMock.payment.updateMany.mockResolvedValue({ count: 0 }); // someone else claimed it first
    const res = await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    expect(res.status).toBe(200);
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });

  it('rejects when Stripe received a different amount than recorded', async () => {
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_1', status: 'succeeded', amount_received: 100 });
    const res = await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    expect(res.status).toBe(409);
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
  });

  it('returns 404 while Stripe has not succeeded', async () => {
    stripeMock.paymentIntents.retrieve.mockResolvedValue({ id: 'pi_1', status: 'requires_payment_method' });
    const res = await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    expect(res.status).toBe(404);
  });

  it('never selects the user password hash', async () => {
    await request(app).post('/payments/confirm/pi_1').set(as('user-1'));

    const include = prismaMock.payment.findUniqueOrThrow.mock.calls[0][0].include;
    expect(include.user).toEqual({ select: expect.not.objectContaining({ password: true }) });
  });
});

describe('POST /payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (config.stripe as { webhookSecret?: string }).webhookSecret = 'whsec_test';
  });

  it('requires no login but rejects a bad signature', async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const res = await request(app).post('/payments/webhook').set('stripe-signature', 'bad').send({ any: 'thing' });

    expect(res.status).toBe(400);
    expect(prismaMock.payment.updateMany).not.toHaveBeenCalled();
  });

  it('rejects requests without a signature header', async () => {
    const res = await request(app).post('/payments/webhook').send({});

    expect(res.status).toBe(400);
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it('verifies against the raw body and the configured secret', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({ type: 'ignored.event', data: { object: {} } });
    const res = await request(app).post('/payments/webhook').set('stripe-signature', 'sig').send({ a: 1 });

    expect(res.status).toBe(200);
    const [payload, signature, secret] = stripeMock.webhooks.constructEvent.mock.calls[0];
    expect(Buffer.isBuffer(payload)).toBe(true);
    expect(signature).toBe('sig');
    expect(secret).toBe('whsec_test');
  });

  it('refuses to run when no webhook secret is configured', async () => {
    (config.stripe as { webhookSecret?: string }).webhookSecret = undefined;
    const res = await request(app).post('/payments/webhook').set('stripe-signature', 'sig').send({});

    expect(res.status).toBe(503);
    expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it('only fails PENDING payments on payment_failed', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_1' } },
    });
    await request(app).post('/payments/webhook').set('stripe-signature', 'sig').send({});

    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith({
      where: { stripePaymentId: 'pi_1', status: 'PENDING' },
      data: { status: 'FAILED' },
    });
  });
});

describe('POST /payments/:id/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.payment.findUnique.mockResolvedValue({ id: PAYMENT_ID, stripePaymentId: 'pi_1', amount: 100, status: 'PAID' });
  });

  it('rejects a refund larger than the payment with 400 (not 500)', async () => {
    const res = await request(app)
      .post(`/payments/${PAYMENT_ID}/refund`)
      .set(as('admin-1', 'ADMIN'))
      .send({ amount: 500 });

    expect(res.status).toBe(400);
    expect(stripeMock.refunds.create).not.toHaveBeenCalled();
  });
});
