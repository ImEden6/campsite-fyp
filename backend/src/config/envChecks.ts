// Production environment checks
//
// None of these stop the server from starting (the app still runs), but each one, when missing,
// breaks something quietly: browsers are refused by CORS, emails link to localhost, Stripe
// payments are never confirmed. A loud warning at startup is cheaper than finding out later.

type Env = Record<string, string | undefined>;

const RECOMMENDED = ['REDIS_URL', 'EMAIL_USER', 'EMAIL_PASSWORD', 'STRIPE_SECRET_KEY'] as const;

/** Human-readable warnings about a production environment; empty when everything is set. */
export function productionEnvWarnings(env: Env = process.env): string[] {
  const warnings: string[] = [];

  const missing: string[] = RECOMMENDED.filter((name) => !env[name]);
  if (missing.length > 0) {
    warnings.push(`Missing recommended environment variables for production: ${missing.join(', ')}`);
  }

  if (!env.FRONTEND_URL && !env.CORS_ORIGIN) {
    warnings.push(
      'Neither FRONTEND_URL nor CORS_ORIGIN is set: browsers on your real site will be refused by CORS, ' +
        'and emailed links will point at http://localhost:3000'
    );
  } else if (!env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL is not set: links in emails (verify email, reset password) will point at http://localhost:3000');
  }

  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_WEBHOOK_SECRET is not set: Stripe webhooks will be rejected, so payments are only confirmed by the manual confirm call');
  }

  return warnings;
}
