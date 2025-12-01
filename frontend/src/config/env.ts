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
 * Ensure URL uses HTTPS in production
 * Automatically converts http:// to https:// and ws:// to wss:// in production
 */
const ensureSecureUrl = (url: string, isProduction: boolean): string => {
  if (!isProduction) {
    // Allow HTTP/WS in development
    return url;
  }
  
  // In production, enforce HTTPS/WSS
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

// Get raw environment values
const rawApiUrl = getEnvVar('VITE_API_URL', 'http://localhost:5000/api/v1');
const rawWsUrl = getEnvVar('VITE_WS_URL', 'ws://localhost:5000');
const isProduction = import.meta.env.PROD;

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
  
  // Warn if using HTTP in production (shouldn't happen with ensureSecureUrl, but just in case)
  if (env.isProduction) {
    if (env.apiUrl.startsWith('http://')) {
      console.error('[Env] WARNING: API URL is using HTTP in production!', env.apiUrl);
    }
    if (env.wsUrl.startsWith('ws://')) {
      console.error('[Env] WARNING: WebSocket URL is using WS in production!', env.wsUrl);
    }
  }
};

// Run validation in development
if (env.isDevelopment) {
  validateEnv();
}

export default env;
