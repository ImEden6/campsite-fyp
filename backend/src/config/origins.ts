// Browser origins allowed to call the API and open sockets.
// One source of truth, so the REST API and Socket.IO can never disagree.

const DEFAULT_ORIGIN = 'http://localhost:3000';

/**
 * CORS_ORIGIN is a comma-separated list; when it is not set, the single FRONTEND_URL is used.
 * Read at call time (not import time) so it always reflects the loaded environment.
 */
export function getAllowedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const configured = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : [env.FRONTEND_URL || DEFAULT_ORIGIN];
}
