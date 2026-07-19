# Campsite Management System

A full-stack campsite management platform for booking, site management, equipment rentals, and operations.

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all services (handles build & run via Nginx proxy on port 80)
npm run docker:up

# OR start in background using docker compose directly
docker compose up -d

# Initialize database (Required for first run)
docker compose exec backend npm run db:setup

# View logs
docker compose logs -f

# Stop services
npm run docker:down
# OR
docker compose down
```

### Option 2: Local Development

```bash
# Install dependencies (automatically handles all monorepo workspaces)
npm install

# Start development servers
npm run dev             # Start frontend dev server
# In another terminal:
cd backend && npm run dev  # Start backend dev server
```

###  Quick Reference: Access & Commands

**Development Environment**
Run local development with hot-reloading:
```bash
# Docker (Recommended)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# OR Local NPM
npm install
npm run dev                # Starts frontend (Vite)
# (In backend directory)
npm run dev                # Starts backend (Nodemon)
```

| Service | Access URL | Port | Description |
| :--- | :--- | :--- | :--- |
| **App (via Proxy)** | [http://localhost](http://localhost) | `80` | Production-like unified entry (recommended) |
| **Frontend (Direct)** | [http://localhost:5173](http://localhost:5173) | `5173` | React/Vite development server |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | `5000` | Express API directly |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | `5555` | Database browser GUI |

<br />

**Production Environment**
Run the optimized production build:
```bash
# Using root npm script
npm run docker:up

# OR using docker compose directly
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

| Service | Access URL | Port | Description |
| :--- | :--- | :--- | :--- |
| **App (via Proxy)** | [http://localhost](http://localhost) | `80` | Production same-origin access URL |
| **Frontend (Direct)** | [http://localhost:5137](http://localhost:5137) | `5137` | Frontend production container |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | `5000` | Express API directly |
| **Prisma Studio** | [http://localhost:5555](http://localhost:5555) | `5555` | Database browser GUI |

---

## Documentation

- [User Guides](docs/user-guide/getting-started.md)
- [API Documentation](docs/api/README.md)
- [Development Guide](docs/development/setup.md)
  - [Testing](docs/development/testing.md)
  - [Database Setup](docs/development/database-setup.md)
  - [Mock Data](docs/development/mock-data.md)
  - [Error Handling](docs/development/error-handling.md)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Auth** | JWT, bcrypt |
| **Payments** | Stripe |

---

## Project Structure

```
campsite-fyp/
├── frontend/          # React application
│   ├── src/
│   │   ├── features/  # Feature modules (auth, bookings, sites, etc.)
│   │   ├── pages/     # Route pages
│   │   ├── components/# Shared UI components
│   │   └── stores/    # Global state (Zustand)
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── middleware/# Auth, validation, rate limiting
│   │   └── jobs/      # Scheduled tasks
│   └── prisma/        # Database schema & migrations
├── shared/            # Shared types & schemas
└── docker/            # Docker configuration
```

---

## Features

### For Staff/Admin
- Dashboard with analytics
- Booking management & calendar
- Site management with interactive map editor
- Equipment inventory & rentals
- User administration (roles: Admin, Manager, Staff, Customer)
- Check-in/check-out workflows

### For Customers
- Browse and book campsites
- View booking history
- Make payments
- Manage profile

### For Guests (No Account)
- Public booking flow
- Booking lookup by reference
- Option to create account during checkout

---

## Environment Setup

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_USE_MOCK_AUTH=false
VITE_USE_MOCK_PAYMENTS=false
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/campsite_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxxxx
```

See `.env.example` files for full configuration options.

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@campsite.com | Admin123! |
| Manager | manager@campsite.com | Manager123! |
| Staff | staff@campsite.com | Staff123! |
| Customer | customer@campsite.com | Customer123! |

---

## Database Commands

```bash
cd backend

npx prisma migrate dev      # Run migrations
npx prisma db seed          # Seed test data
npx prisma studio           # Open database GUI
npx prisma generate         # Regenerate client
```

> **Note:** Prisma Studio is accessible in the Production build stack (`docker compose` with `docker-compose.prod.yml`) on port 5555 for **demonstration and evaluation purposes only**. In a true production environment, this service would be removed and database access restricted.

---

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | User login |
| `POST /api/v1/auth/register` | User registration |
| `GET /api/v1/campsites` | List all sites |
| `GET /api/v1/bookings` | List bookings (filtered by role) |
| `POST /api/v1/bookings` | Create booking |
| `POST /api/v1/payments/intent` | Create payment intent |

Rate limits: 100 req/15min (global), 5 req/15min (auth), 20 req/min (bookings)

---

## Payments

### Mock Mode (Development)
```env
VITE_USE_MOCK_PAYMENTS=true
```
Simulates payments with test card `4242 4242 4242 4242`.

### Stripe Integration (Production)
1. Get API keys from [Stripe Dashboard](https://stripe.com)
2. Configure `VITE_STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`
3. Set `VITE_USE_MOCK_PAYMENTS=false`

---



## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run type-check` | TypeScript check |

---

## ⚠️ IMPORTANT: React 19 Upgrade Warning

This project currently imposes strict overrides to force **React 18** types (`@types/react@^18.3.0` and `@types/react-dom@^18.3.0`) in the root `package.json`.

**When upgrading to React 19:**
You **MUST** remove the `overrides` section from the root `package.json`. Failure to do so will result in type conflicts where React 19 is installed but forced to use React 18 types.

---

## License

MIT