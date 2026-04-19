/**
 * Environment Configuration
 * Centralized access to environment variables with type safety
 */

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  wsUrl: string;

  // Application Configuration
  appName: string;
  appVersion: string;
  environment: string;

  // Third-party Services
  stripePublicKey: string;
  googleMapsApiKey?: string;
  sentryDsn?: string;

  // Feature Flags
  enablePWA: boolean;
  enableAnalytics: boolean;
  useMockPayments: boolean;

  // Development
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

const getEnvVar = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getBooleanEnvVar = (key: string, defaultValue = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * When the app is served over HTTPS, upgrade insecure absolute URLs.
 * Skips relative URLs (e.g. `/api/v1`) and skips upgrades when the page is still HTTP
 * (common for Docker + nginx on localhost).
 */
const ensureSecureUrl = (url: string, isProduction: boolean): string => {
  if (!isProduction) {
    return url;
  }

  const pageIsHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (!pageIsHttps) {
    return url;
  }

  if (url.startsWith('http://')) {
    console.warn(`[Env] Converting HTTP to HTTPS for production: ${url}`);
    return url.replace('http://', 'https://');
  }

  if (url.startsWith('ws://')) {
    console.warn(`[Env] Converting WS to WSS for production: ${url}`);
    return url.replace('ws://', 'wss://');
  }

  return url;
};

/** WebSocket origin for same-host deployments (e.g. nginx proxies `/socket.io` to the API). */
const sameOriginWsUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'ws://localhost:5000';
  }
  return window.location.protocol === 'https:'
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;
};

// Get raw environment values
const isTest = import.meta.env.MODE === 'test';
const isProduction = import.meta.env.PROD;

// Check if running on localhost (for local preview builds that need proxy)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// API base:
// - Tests: fixed URL for MSW
// - Browser on localhost: Vite dev proxy or nginx on :80 both expose `/api/v1` on the same host
// - Otherwise: prefer `VITE_API_URL` at build time; default `/api/v1` for reverse-proxy prod (Docker + nginx)
const rawApiUrl = isTest
  ? 'http://localhost:5000/api/v1'
  : isLocalhost
    ? '/api/v1'
    : getEnvVar('VITE_API_URL', '/api/v1');

// WebSocket: default to same page host:port so nginx can proxy `/socket.io` (avoid hard-coding :5000).
const rawWsUrl = isTest
  ? 'ws://localhost:5000'
  : getEnvVar('VITE_WS_URL') || sameOriginWsUrl();

export const env: EnvConfig = {
  // API Configuration - enforce HTTPS in production
  apiUrl: ensureSecureUrl(rawApiUrl, isProduction),
  wsUrl: ensureSecureUrl(rawWsUrl, isProduction),

  // Application Configuration
  appName: getEnvVar('VITE_APP_NAME', 'Campsite Management System'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  environment: getEnvVar('VITE_ENV', 'development'),

  // Third-party Services
  stripePublicKey: getEnvVar('VITE_STRIPE_PUBLIC_KEY'),
  googleMapsApiKey: getEnvVar('VITE_GOOGLE_MAPS_API_KEY'),
  sentryDsn: getEnvVar('VITE_SENTRY_DSN'),

  // Feature Flags
  enablePWA: getBooleanEnvVar('VITE_ENABLE_PWA', true),
  enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', false),
  useMockPayments: getBooleanEnvVar('VITE_USE_MOCK_PAYMENTS', false),

  // Development
  isDevelopment: import.meta.env.DEV,
  isProduction: isProduction,
  isTest: import.meta.env.MODE === 'test',
};

// Validate required environment variables
const validateEnv = () => {
  const requiredVars = [
    { key: 'apiUrl', value: env.apiUrl },
    { key: 'appName', value: env.appName },
  ];

  const missing = requiredVars.filter(({ value }) => !value);

  if (missing.length > 0) {
    console.error(
      'Missing required environment variables:',
      missing.map(({ key }) => key).join(', ')
    );
  }

  // Absolute HTTP API in a production build is usually misconfiguration (except local tooling).
  if (env.isProduction && env.apiUrl.startsWith('http://')) {
    console.error('[Env] WARNING: API URL is using HTTP in production!', env.apiUrl);
  }
};

// Run validation in development
if (env.isDevelopment) {
  validateEnv();
}

export default env;
