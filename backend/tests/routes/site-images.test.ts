import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

import siteRoutes from '@/routes/site.routes';
import { errorHandler } from '@/utils/errors';
import { config } from '@/config';
import prisma from '@/database';

const app = express();
app.use(express.json());
app.use('/api/v1/campsites', siteRoutes);
app.use(errorHandler);

describe('Site image routes', () => {
  let adminToken: string;
  let adminUserId: string;
  let siteId: string;

  beforeEach(async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: `site-img-admin-${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'User',
        password: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    adminUserId = adminUser.id;
    adminToken = jwt.sign(
      { userId: adminUserId, email: adminUser.email, role: 'ADMIN' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    const site = await prisma.site.create({
      data: {
        name: `Img Test Site ${Date.now()}`,
        type: 'TENT',
        status: 'AVAILABLE',
        capacity: 4,
        basePrice: 40,
        maxVehicles: 1,
        maxTents: 1,
        sizeLength: 20,
        sizeWidth: 15,
        sizeUnit: 'feet',
        latitude: 0,
        longitude: 0,
        mapPositionX: 0,
        mapPositionY: 0,
        images: [],
      },
    });
    siteId = site.id;
  });

  afterEach(async () => {
    await prisma.site.deleteMany({ where: { id: siteId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: adminUserId } }).catch(() => {});
  });

  it('POST /campsites/:id/images appends URLs', async () => {
    const buf = await sharp({
      create: { width: 20, height: 20, channels: 3, background: { r: 10, g: 20, b: 200 } },
    })
      .png()
      .toBuffer();

    const res = await request(app)
      .post(`/api/v1/campsites/${siteId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('images', buf, 'px.png');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toContain('/uploads/site_');

    const row = await prisma.site.findUnique({ where: { id: siteId } });
    expect(row?.images?.length).toBe(1);
    expect(row?.images?.[0]).toBe(res.body.data[0]);
  });

  it('DELETE /campsites/:id/images removes a stored URL', async () => {
    const buf = await sharp({
      create: { width: 16, height: 16, channels: 3, background: { r: 200, g: 10, b: 10 } },
    })
      .jpeg()
      .toBuffer();

    const postRes = await request(app)
      .post(`/api/v1/campsites/${siteId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('images', buf, 'a.jpg');

    const url = postRes.body.data[0] as string;
    expect(url).toBeTruthy();

    const delRes = await request(app)
      .delete(`/api/v1/campsites/${siteId}/images`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ imageUrl: url });

    expect(delRes.status).toBe(200);
    const row = await prisma.site.findUnique({ where: { id: siteId } });
    expect(row?.images?.length).toBe(0);
  });
});
