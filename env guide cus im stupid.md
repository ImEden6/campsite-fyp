# Environment Variables Guide

This guide documents all environment variables used in the Campsite Management System.

## Frontend ([frontend/.env](file:///c:/Users/Mervyn/campsite-fyp/frontend/.env))
These variables are prefixed with `VITE_` and are exposed to the browser.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| **API Connection** | | |
| `VITE_API_URL` | Full URL to the backend API v1 endpoints | `http://localhost:5000/api/v1` |
| `VITE_API_BASE_URL` | Base URL for the backend (used for avatars/images) | `http://localhost:5000` |
| `VITE_WS_URL` | WebSocket connection URL | N/A (usually derived from window.location) |
| **Feature Flags** | | |
| `VITE_USE_MOCK_AUTH` | Enable mock authentication (no backend required) | `false` |
| `VITE_USE_MOCK_PAYMENTS`| Enable mock payments | `false` |
| **Integrations** | | |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe Public Key for client-side processing | `pk_test_...` |
| `VITE_SENTRY_DSN` | Sentry Error Tracking DSN | N/A |
| `VITE_ENV` | Environment name for Sentry (dev/prod/staging) | `development` |
| `VITE_APP_NAME` | Display name of the application | `Campsite Management System` |
| `VITE_GOOGLE_MAPS_API_KEY`| API Key for Google Maps (if used) | |
| `VITE_ENABLE_PWA` | Enable Progressive Web App features | `true` |
| `VITE_ENABLE_ANALYTICS` | Enable user tracking/analytics | `true` |

---

## Backend ([backend/.env](file:///c:/Users/Mervyn/campsite-fyp/backend/.env))
These variables contain secrets and server configuration. **Never commit this file.**

### Core Configuration
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development`, [production](file:///c:/Users/Mervyn/campsite-fyp/backend/.env.production)) | `development` |
| `API_BASE_URL` | Public URL for API | `http://localhost:5000` |
| `FRONTEND_URL` | Public URL of frontend (CORS/Emails) | `http://localhost:3000` |
| `MAINTENANCE_MODE` | Set to `true` to block all API requests | `false` |
| `LOG_LEVEL` | Logging verbosity ([info](file:///c:/Users/Mervyn/campsite-fyp/frontend/tsconfig.node.tsbuildinfo), `debug`, `error`) | [info](file:///c:/Users/Mervyn/campsite-fyp/frontend/tsconfig.node.tsbuildinfo) |

### Database & Cache
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `BULL_REDIS_URL` | Redis connection for Job Queues | `redis://localhost:6379` |

### Authentication & Session
| Variable | Description | Notes |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret for Access Tokens | **Critical Security** |
| `JWT_REFRESH_SECRET` | Secret for Refresh Tokens | **Critical Security** |
| `SESSION_SECRET` | Secret for Express Sessions | **Critical Security** |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | |

### Third-Party Services
| Variable | Description |
| :--- | :--- |
| **Stripe** | |
| `STRIPE_SECRET_KEY` | Server-side secret key |
| `STRIPE_PUBLISHABLE_KEY` | Public key to send to frontend |
| **Weather** | |
| `WEATHER_API_KEY` | OpenWeatherMap API Key |
| `WEATHER_API_URL` | API Base URL |

### Feature Flags
| Variable | Description | Default |
| :--- | :--- | :--- |
| `ENABLE_NOTIFICATIONS` | Enable email/SMS sending | `true` |
| `ENABLE_WEATHER` | Enable weather data fetching | `false` |
| `ENABLE_CALENDAR_SYNC` | Enable calendar integrations | `true` |
| `ENABLE_AUDIT_LOGGING` | Enable database audit logs | `true` |

### File Uploads
| Variable | Description | Default |
| :--- | :--- | :--- |
| `UPLOAD_PATH` | Local directory for uploads | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
