// Error helpers

import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { ApiError, ValidationError, getErrorMessage, hasPrismaCode, formatErrorResponse, handleMulterError, handleStripeError } from '@/utils/errors';

const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError('boom', { code, clientVersion: 'test' });

describe('getErrorMessage', () => {
  it('reads the message of an Error', () => {
    expect(getErrorMessage(new Error('disk full'))).toBe('disk full');
    expect(getErrorMessage(new ApiError(404, 'not found'))).toBe('not found');
  });

  it('accepts a thrown string', () => {
    expect(getErrorMessage('plain text')).toBe('plain text');
  });

  it.each([undefined, null, 42, { message: 'looks like one but is not an Error' }])('never throws on %j', (thrown) => {
    expect(getErrorMessage(thrown)).toBe('Unknown error');
  });
});

describe('hasPrismaCode', () => {
  it('matches the code of a Prisma error', () => {
    expect(hasPrismaCode(prismaError('P2002'), 'P2002')).toBe(true);
    expect(hasPrismaCode(prismaError('P2025'), 'P2002')).toBe(false);
  });

  it.each([new Error('P2002'), { code: 'P2002' }, 'P2002', null, undefined])('does not trust something that only looks like one (%j)', (thrown) => {
    expect(hasPrismaCode(thrown, 'P2002')).toBe(false);
  });
});

describe('formatErrorResponse', () => {
  it('shapes an error for the client', () => {
    const body = formatErrorResponse(new ApiError(409, 'Conflict', 'CONFLICT'));

    expect(body).toMatchObject({ success: false, error: { message: 'Conflict', code: 'CONFLICT', statusCode: 409 } });
    expect(typeof body.timestamp).toBe('string');
  });

  it('includes validation errors and details when present', () => {
    const validation = formatErrorResponse(new ValidationError([{ field: 'email', message: 'Invalid', code: 'BAD' }]));
    const detailed = formatErrorResponse(new ApiError(400, 'Bad', 'BAD', { hint: 'try again' }));

    expect(validation.error.validationErrors).toEqual([{ field: 'email', message: 'Invalid', code: 'BAD' }]);
    expect(detailed.error.details).toEqual({ hint: 'try again' });
  });
});

describe('upload and payment error mapping', () => {
  it.each([
    ['LIMIT_FILE_SIZE', 'FILE_TOO_LARGE'],
    ['LIMIT_FILE_COUNT', 'TOO_MANY_FILES'],
    ['LIMIT_UNEXPECTED_FILE', 'UNEXPECTED_FILE'],
    ['SOMETHING_ELSE', 'UPLOAD_ERROR'],
  ])('maps the upload error %s to %s', (code, mapped) => {
    const error = handleMulterError(Object.assign(new Error('x'), { code })) as ValidationError;

    expect(error.statusCode).toBe(400);
    expect(error.validationErrors[0]!.code).toBe(mapped);
  });

  it.each([
    ['StripeCardError', 'Card was declined'],
    ['StripeAPIError', 'Payment service unavailable'],
    ['StripeConnectionError', 'Payment service connection failed'],
    ['SomethingNew', 'Payment processing failed'],
  ])('maps the Stripe error %s to a safe message', (type, message) => {
    expect(handleStripeError(Object.assign(new Error('raw stripe text with details'), { type })).message).toBe(message);
  });
});
