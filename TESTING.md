# Testing Guide

This document explains the testing infrastructure, conventions, and best practices for the campsite management system.

## Test Types

| Type | File Pattern | Timeout | Description |
|------|-------------|---------|-------------|
| **Unit** | `*.unit.test.ts` | 5s | Isolated tests with mocked dependencies |
| **Integration** | `*.int.test.ts` | 30s | Tests with real database connections |
| **E2E** | `*.e2e.spec.ts` | 60s | Full browser-based tests via Playwright |

## Naming Conventions

```
backend/
  tests/
    services/
      booking.unit.test.ts     # Unit tests for booking service
      booking.int.test.ts      # Integration tests with real DB
    routes/
      booking.unit.test.ts     # Route handler unit tests
      booking.int.test.ts      # API integration tests
    utils/                     # Test utilities (not test files)
```

## Running Tests

```bash
# from project
npm run test                    # All tests
npm run test:backend            # Backend tests only
npm run test:backend:unit       # Backend unit tests only
npm run test:backend:int        # Backend integration tests only
npm run test:frontend           # Frontend tests only
npm run test:e2e                # E2E tests (Playwright)
npm run test:coverage           # With coverage report

# from backend
cd backend
npm run test                    # All backend tests
npm run test:unit               # Unit tests only
npm run test:int                # Integration tests only
npm run test:ci                 # CI mode with JUnit output
```

## Mocking Rules

### Unit Tests

**Mock outbound boundaries only:**
- Database (Prisma)
- Cache (Redis)
- External APIs (Stripe, SendGrid, etc.)
- File system operations

```typescript
// Example: Unit test with mocked Prisma
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockPrismaClient, createUser } from '@tests/utils';

describe('UserService.unit', () => {
  const prisma = createMockPrismaClient();
  
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(createUser());
  });
  
  it('should return user by id', async () => {
    // Test implementation
  });
});
```

### Integration Tests

**Mock nothing except third-party APIs:**
- Use real database (test container or local)
- Use real Redis (or test instance)
- Mock only external services (Stripe, email, SMS)

```typescript
// Example: Integration test with real database
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

describe('BookingService.int', () => {
  const prisma = new PrismaClient();
  
  beforeAll(async () => {
    // Setup test data
  });
  
  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
  });
});
```

### E2E Tests

**Mock nothing:**
- Full stack testing
- Real browser interactions
- Backend should be running

## Test Patterns

### Factories (Unit Tests)

Pure data builders with no side effects:

```typescript
import { createUser, createBooking, createSite } from '@tests/utils';

// Basic usage
const user = createUser();

// With overrides
const admin = createUser({ role: 'ADMIN', isEmailVerified: true });

// Convenience factories
const admin = createAdmin();
const confirmedBooking = createConfirmedBooking();
```

### Fixtures (Integration Tests)

Explicit lifecycle for database state:

```typescript
describe('Booking API', () => {
  let testUser: User;
  let testSite: Site;
  
  beforeAll(async () => {
    testUser = await prisma.user.create({ data: createUser() });
    testSite = await prisma.site.create({ data: createSite() });
  });
  
  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { userId: testUser.id } });
    await prisma.site.delete({ where: { id: testSite.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });
});
```

### API Tests

Black-box style, no reaching into services:

```typescript
import request from 'supertest';
import { createAdminToken, API_PATHS } from '@tests/utils';

describe('POST /api/v1/bookings', () => {
  it('should create booking', async () => {
    const token = createAdminToken();
    
    const response = await request(app)
      .post(API_PATHS.BOOKINGS)
      .set('Authorization', `Bearer ${token}`)
      .send({ siteId: '...', checkInDate: '...' });
    
    // Assert status
    expect(response.status).toBe(201);
    
    // Assert payload
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookingNumber).toBeDefined();
    
    // Assert side effects (optional)
    const booking = await prisma.booking.findUnique({
      where: { id: response.body.data.id }
    });
    expect(booking).not.toBeNull();
  });
});
```

## Adding a New Test

### 1. Unit Test

```typescript
// backend/tests/services/my-feature.unit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockPrismaClient, getMockRedisClient } from '@tests/utils';

// Guard: Ensure not running in integration
import { assertNotIntegrationTest } from '@tests/utils';
assertNotIntegrationTest();

describe('MyFeature.unit', () => {
  const prisma = createMockPrismaClient();
  const redis = getMockRedisClient();
  
  beforeEach(() => {
    // Configure mocks for this test
  });
  
  it('should do something', () => {
    // Test
  });
});
```

### 2. Integration Test

```typescript
// backend/tests/services/my-feature.int.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createUser, createSite } from '@tests/utils/factories';

describe('MyFeature.int', () => {
  const prisma = new PrismaClient();
  const testIds: string[] = [];
  
  beforeAll(async () => {
    // Create real test data
  });
  
  afterAll(async () => {
    // Clean up in reverse order
    await prisma.$disconnect();
  });
  
  it('should work with real database', async () => {
    // Test
  });
});
```

## Test Utilities Reference

| Utility | Location | Purpose |
|---------|----------|---------|
| `createMockPrismaClient()` | `prisma-mock.ts` | Typed Prisma mock |
| `getMockRedisClient()` | `redis-mock.ts` | In-memory Redis mock |
| `createUser()`, `createBooking()` | `factories.ts` | Data builders |
| `createAdminToken()` | `auth.ts` | JWT token generators |
| `createRequestBuilder()` | `http.ts` | Supertest wrapper |
| `assertSuccess()`, `assertError()` | `http.ts` | Response assertions |

## Environment Guards

The test setup automatically:
- Fails if production DATABASE_URL detected in unit tests
- Normalizes test environment variables
- Resets all mocks after each test
- Suppresses console output (set `DEBUG=1` to enable)

## CI Configuration

Tests run via GitHub Actions with:
- Unit tests: Always run, fast feedback
- Integration tests: Run with test database container
- E2E tests: Run after build, with browser automation
