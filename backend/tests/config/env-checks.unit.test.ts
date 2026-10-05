// Production environment warnings

import { describe, it, expect } from 'vitest';
import { productionEnvWarnings } from '@/config/envChecks';

const complete = {
  REDIS_URL: 'redis://redis:6379',
  EMAIL_USER: 'mailer',
  EMAIL_PASSWORD: 'secret',
  STRIPE_SECRET_KEY: 'sk_live_x',
  STRIPE_WEBHOOK_SECRET: 'whsec_x',
  FRONTEND_URL: 'https://camp.example.com',
  CORS_ORIGIN: 'https://camp.example.com',
};

describe('productionEnvWarnings', () => {
  it('is quiet when everything is set', () => {
    expect(productionEnvWarnings(complete)).toEqual([]);
  });

  it('lists the missing recommended variables', () => {
    const { REDIS_URL, EMAIL_USER, ...env } = complete;
    void REDIS_URL;
    void EMAIL_USER;

    expect(productionEnvWarnings(env)).toEqual([expect.stringMatching(/REDIS_URL, EMAIL_USER/)]);
  });

  it('warns loudly when neither FRONTEND_URL nor CORS_ORIGIN is set', () => {
    const { FRONTEND_URL, CORS_ORIGIN, ...env } = complete;
    void FRONTEND_URL;
    void CORS_ORIGIN;

    expect(productionEnvWarnings(env)).toEqual([expect.stringMatching(/Neither FRONTEND_URL nor CORS_ORIGIN.*CORS.*localhost/)]);
  });

  it('warns about email links when only FRONTEND_URL is missing', () => {
    const { FRONTEND_URL, ...env } = complete;
    void FRONTEND_URL;

    expect(productionEnvWarnings(env)).toEqual([expect.stringMatching(/FRONTEND_URL is not set.*emails/)]);
  });

  it('does not need FRONTEND_URL warnings when CORS_ORIGIN is the only one missing', () => {
    const { CORS_ORIGIN, ...env } = complete;
    void CORS_ORIGIN;

    expect(productionEnvWarnings(env)).toEqual([]);
  });

  it('warns that payments will not be confirmed when Stripe has no webhook secret', () => {
    const { STRIPE_WEBHOOK_SECRET, ...env } = complete;
    void STRIPE_WEBHOOK_SECRET;

    expect(productionEnvWarnings(env)).toEqual([expect.stringMatching(/STRIPE_WEBHOOK_SECRET.*manual confirm/)]);
  });

  it('does not nag about the webhook secret when Stripe is not used at all', () => {
    const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ...env } = complete;
    void STRIPE_WEBHOOK_SECRET;
    void STRIPE_SECRET_KEY;

    expect(productionEnvWarnings(env).some((w) => w.includes('STRIPE_WEBHOOK_SECRET'))).toBe(false);
  });
});
