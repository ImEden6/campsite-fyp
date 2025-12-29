# Environment Variables Guide

This guide documents all environment variables used in the Campsite Management System.

## Frontend ([frontend/.env](file:///d:/campsite-fyp/frontend/.env))
These variables are prefixed with `VITE_` and are exposed to the browser.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| **API Connection** | | |
| `VITE_API_URL` | Full URL to the backend API v1 endpoints | `http://localhost:5000/api/v1` |
| `VITE_API_BASE_URL` | Base URL for the backend (used for avatars/images) | `http://localhost:5000` |
| `VITE_WS_URL` | WebSocket connection URL | `ws://localhost:5000` |
| **Application** | | |
| `VITE_APP_NAME` | Display name of the application | `Campsite Management System` |
| `VITE_APP_VERSION` | Application version for Sentry releases | `1.0.0` |
| `VITE_ENV` | Environment name for Sentry (dev/prod/staging) | `development` |
| **Feature Flags** | | |
| `VITE_USE_MOCK_AUTH` | Enable mock authentication (no backend required) | `false` |
| `VITE_USE_MOCK_PAYMENTS`| Enable mock payments | `false` |
| `VITE_ENABLE_PWA` | Enable Progressive Web App features | `true` |
| `VITE_ENABLE_ANALYTICS` | Enable user tracking/analytics | `false` |
| **Integrations** | | |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe Public Key for client-side processing | `pk_test_...` |
| `VITE_SENTRY_DSN` | Sentry Error Tracking DSN | N/A |
| `VITE_GOOGLE_MAPS_API_KEY`| API Key for Google Maps (if used) | |

---

## Backend ([backend/.env](file:///d:/campsite-fyp/backend/.env))
These variables contain secrets and server configuration. **Never commit this file.**

### Core Configuration
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` |
| `API_BASE_URL` | Public URL for API | `http://localhost:5000` |
| `FRONTEND_URL` | Public URL of frontend (CORS/Emails) | `http://localhost:3000` |
| `MAINTENANCE_MODE` | Set to `true` to block all API requests | `false` |

### Database & Cache
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `DB_MAX_CONNECTIONS` | Max database connections | `10` |
| `DB_CONNECTION_TIMEOUT` | Connection timeout in ms | `60000` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis password (optional) | |
| `REDIS_MAX_RETRIES` | Max retries per request | `3` |
| `REDIS_RETRY_DELAY` | Retry delay on failover in ms | `100` |

### Authentication & Session
| Variable | Description | Notes |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret for Access Tokens | **Critical Security** |
| `JWT_EXPIRES_IN` | Access token expiry | `24h` |
| `JWT_REFRESH_SECRET` | Secret for Refresh Tokens | **Critical Security** |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | |

### Third-Party Services

#### Stripe
| Variable | Description |
| :--- | :--- |
| `STRIPE_SECRET_KEY` | Server-side secret key |
| `STRIPE_PUBLISHABLE_KEY` | Public key to send to frontend |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature secret |

#### Email
| Variable | Description | Default |
| :--- | :--- | :--- |
| `EMAIL_PROVIDER` | Provider type: `sendgrid`, `smtp`, or `mock` | `mock` (dev) / `smtp` (prod) |
| `EMAIL_SERVICE` | SMTP service name | `gmail` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_SECURE` | Use TLS | `false` |
| `EMAIL_USER` | SMTP username | `noreply@campsite.com` |
| `EMAIL_PASSWORD` | SMTP password | |
| `EMAIL_FROM` | Default from address | `noreply@campsite.com` |
| `SENDGRID_API_KEY` | SendGrid API key (if using SendGrid) | |
| `SENDGRID_FROM_EMAIL` | SendGrid from address | |

#### SMS (Twilio)
| Variable | Description |
| :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Phone Number |

#### Weather
| Variable | Description | Default |
| :--- | :--- | :--- |
| `WEATHER_API_KEY` | OpenWeatherMap API Key | |
| `WEATHER_API_URL` | API Base URL | `https://api.openweathermap.org/data/2.5` |
| `WEATHER_UPDATE_INTERVAL` | Update interval in ms | `600000` (10 min) |

### File Uploads
| Variable | Description | Default |
| :--- | :--- | :--- |
| `UPLOAD_PATH` | Local directory for uploads | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |
| `ALLOWED_FILE_TYPES` | Comma-separated file extensions | `jpg,jpeg,png,gif,webp,pdf` |
