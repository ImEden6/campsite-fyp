// Public stats: works, and never shows visitors internal error details

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const { prismaMock } = vi.hoisted(() => ({ prismaMock: { $queryRaw: vi.fn() } }));
vi.mock('@/database', () => ({ default: prismaMock, getPrismaClient: () => prismaMock }));

import publicRoutes from '@/routes/public.routes';
import { errorHandler } from '@/utils/errors';

const app = express();
app.use('/public', publicRoutes);
app.use(errorHandler);

describe('GET /public/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.USE_MOCK_DATA;
  });

  it('reports site, booking and customer counts', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ count: 10n }]) // total sites
      .mockResolvedValueOnce([{ type: 'CABIN', count: 2n }, { type: 'RV', count: 3n }, { type: 'TENT', count: 5n }]) // sites by type
      .mockResolvedValueOnce([{ count: 7n }]) // bookings this month
      .mockResolvedValueOnce([{ count: 40n }]); // customers

    const res = await request(app).get('/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ activeBookings: 7, totalCustomers: 40 });
    expect(res.body.data).toMatchObject({ siteCount: 10, sitesByType: { cabins: 2, rv: 3, tents: 5 } });
  });

  it('answers from fixed demo numbers in mock mode, without touching the database', async () => {
    process.env.USE_MOCK_DATA = 'true';

    const res = await request(app).get('/public/stats');

    expect(res.status).toBe(200);
    expect(res.body.data.siteCount).toBe(8);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('does not tell visitors why it failed', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connection to postgres://admin:hunter2@db.internal:5432 refused'));

    const res = await request(app).get('/public/stats');

    expect(res.status).toBe(500);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('hunter2');
    expect(body).not.toContain('db.internal');
    expect(body).not.toContain('refused');
    expect(res.body.error).toMatchObject({ message: 'Internal server error', statusCode: 500 });
  });
});
