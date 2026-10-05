// Booking reference numbers, e.g. BK-7K2M9XQ4
//
// Random rather than clock-based: the old `BK-<timestamp>-<0..999>` collided whenever two
// bookings were created in the same millisecond and drew the same number, and it leaked
// how many bookings the site was getting.

import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';

// No 0/O or 1/I/L: references get read out over the phone and typed from printed receipts
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LENGTH = 8; // 31^8, about 8.5e11 combinations

export function generateBookingNumber(): string {
  let suffix = '';
  for (let i = 0; i < LENGTH; i++) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `BK-${suffix}`;
}

/** True when an insert failed because the booking number is already taken. */
export function isBookingNumberCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return false;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes('bookingNumber') : String(target ?? '').includes('bookingNumber');
}
