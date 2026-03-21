# AGENTS.md - Campsite Management System

## Project Overview

TypeScript monorepo with three workspaces: **frontend** (React 18 + Vite), **backend** (Express + Prisma), and **shared** (Zod schemas + types). Node.js >= 22.0.0 required.

---

## Build Commands

### Root Workspace
```bash
npm run build                    # Build all workspaces
npm run dev                      # Start frontend dev server
npm run lint                     # Lint all workspaces
npm run type-check               # Type-check all workspaces
npm run test                     # Run all tests
```

### Backend
```bash
npm run dev                      # Start with nodemon (ts-node)
npm run build                    # TypeScript compile + tsc-alias
npm run start                    # Production server

# Testing (CRITICAL - use single test commands below)
npm run test                    # Run all backend tests
npm run test:unit                # Only unit tests (*.unit.test.ts)
npm run test:int                # Only integration tests (*.int.test.ts)
npm run test:watch              # Watch mode
npm run test:coverage            # With coverage report
npm run test:ci                  # CI mode with JUnit output

# Database
npm run db:generate             # Prisma generate
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed database
npm run db:setup                # generate + migrate + seed
npm run db:studio               # Open Prisma Studio
```

### Frontend
```bash
npm run dev                      # Vite dev server
npm run build                    # Production build
npm run build:check              # Type-check + build
npm run lint                     # ESLint with 0 warnings
npm run type-check               # TypeScript check

# Testing
npm run test                     # Vitest unit tests
npm run test:coverage            # With coverage
npm run test:e2e                 # Playwright e2e tests
npm run test:e2e:chromium        # Specific browser
npm run test:e2e:ui              # Playwright UI mode

# Docker
npm run preview:local           # Mock payments/auth for local preview
```

### Running Single Tests
```bash
# Backend (from backend/ directory)
npx vitest run tests/services/booking.test.ts
npx vitest run --reporter=verbose --testNamePattern="getAvailableEquipment"

# Frontend (from frontend/ directory)
npx vitest run src/components/ui/Button.test.tsx
npx vitest run src/hooks/useAuth.test.ts
```

---

## Code Style Guidelines

### TypeScript Configuration
- **Frontend**: `tsconfig.json` with `"module": "ESNext"`, strict mode enabled
- **Backend**: Path aliases via `tsconfig-paths` (`@/` maps to `src/`), `tsc-alias` for build
- Use `import type` for type-only imports when possible

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `booking-card.tsx`, `api-client.ts` |
| Components | PascalCase | `BookingCard`, `DatePicker` |
| Functions/variables | camelCase | `getBookingById`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `BookingProps`, `UserResponse` |
| Enums | PascalCase with PascalCase values | `enum BookingStatus { CONFIRMED = 'CONFIRMED' }` |
| Database columns | snake_case | `booking_number`, `check_in_date` |

### Import Order (Frontend)
```typescript
// 1. React/core
import { useState, useEffect } from 'react';
import React from 'react';

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// 3. Internal packages
import { Button } from '@/components/ui/Button';

// 4. Internal modules (relative)
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types';
```

### Import Order (Backend)
```typescript
// 1. Node built-ins
import { Request, Response } from 'express';
import path from 'path';

// 2. Third-party
import jwt from 'jsonwebtoken';

// 3. Internal packages (@campsite-management/*)
import { BookingSchema } from '@campsite-management/shared';

// 4. Internal modules (path aliases)
import { ApiError } from '@/utils/errors';
import { config } from '@/config';
```

### Error Handling
- **Backend**: Use `ApiError` class from `@/utils/errors` with HTTP status codes
  ```typescript
  throw new ApiError(400, 'Invalid date range');
  throw new ApiError(404, 'Booking not found');
  throw new ApiError(500, 'Database error', error);
  ```
- **Frontend**: Handle API errors in services, return typed results
  ```typescript
  // In API service
  const result = await api.get('/bookings').catch(handleApiError);
  
  // handleApiError shows toast/notification and returns fallback
  ```
- **Async operations**: Always use try/catch in service layer
- **Frontend error boundaries**: Wrap feature components in error boundaries

### React Patterns
- **Component structure**: Props interface → Component function → Helper functions
- **Use functional components** with hooks only
- **Props**: Define explicit interfaces, use `React.FC<Props>` or inline type
- **State**: Prefer `useState<T>()` with explicit generic for complex types
- **Effects**: Always include dependency array, use `useCallback`/`useMemo` appropriately
- **Forms**: Use `react-hook-form` with Zod resolver

### Backend Patterns
- **Route handlers**: Async functions with try/catch, return `res.json()` or `next(error)`
- **Services**: Class-based or functional, inject Prisma client via dependency injection
- **Middleware**: Export named functions, always call `next()` or throw error
- **Validation**: Use Zod schemas from `@campsite-management/shared`, validate in middleware

### Database (Prisma)
- Use TypeScript enums generated from Prisma schema
- Select only needed fields to avoid over-fetching
- Use transactions for multi-table operations
- Always handle `NotFoundError` from Prisma

---

## Testing Conventions

### Backend Test Files
- Location: `backend/tests/**/*.test.ts`
- Naming: `*.unit.test.ts` (unit), `*.int.test.ts` (integration)
- Timeouts: Unit=5s, Integration=30s
- Use `describe`, `it`, `expect`, `beforeEach`, `afterEach` from vitest
- Clean up test data in `afterEach`
- Use factories from `tests/utils/factories.ts` for test data

### Frontend Test Files
- Location: `frontend/src/**/__tests__/*.test.tsx`
- Use `@testing-library/react` with `userEvent`
- Mock external dependencies (API calls via MSW)
- Test behavior, not implementation details

### Test Utilities (Backend)
```typescript
// Import from test utils
import { createTestUser, createTestBooking } from '@tests/utils/factories';
import { authHeader } from '@tests/utils/auth';
import prismaMock from '@tests/utils/prisma-mock';
```

### Test Utilities (Frontend)
```typescript
import { renderWithProviders } from '@/tests/setup';
import { server } from '@/tests/msw-server';
import { mockAuth } from '@/tests/mocks/auth';
```

---

## Project Structure

```
/
├── frontend/src/
│   ├── components/       # Shared UI components (ui/, forms/, layout/)
│   ├── features/         # Feature modules (bookings/, auth/, sites/)
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route page components
│   ├── services/         # API clients (api/, websocket/)
│   ├── stores/           # Zustand stores
│   └── types/            # Frontend-specific types
├── backend/src/
│   ├── config/           # Environment config
│   ├── middleware/       # Auth, validation, security
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   ├── types/            # Type definitions
│   └── utils/            # Helpers (logger, errors)
├── shared/
│   ├── schemas/          # Zod validation schemas
│   └── types/            # Shared TypeScript types/enums
└── docs/                 # API and development documentation
```

---

## Key Libraries

| Category | Library |
|----------|---------|
| Frontend State | Zustand |
| Data Fetching | TanStack Query |
| Forms | react-hook-form + Zod |
| UI | Custom components + Tailwind CSS v4 |
| Backend | Express, Prisma, Redis (ioredis) |
| Validation | Zod (shared schemas) |
| Testing | Vitest, Playwright, MSW |

---

## Common Patterns

### API Response Shape
```typescript
// Success: { data: T, message?: string }
// Error: { error: string, details?: unknown }
```

### React Component Export
```typescript
// Default export for pages/routes
export default BookingPage;

// Named export for reusable components
export const BookingCard: React.FC<Props> = ({ ... }) => { ... };
```

### Environment Variables
- Backend: `.env` file (see `.env.example`)
- Frontend: Vite env vars prefixed with `VITE_`
- Access via `import.meta.env.VITE_VAR_NAME`
