# Mock Data Setup Guide

This document outlines the additional mock data and setup needed for tests to pass.

## Current Issues and Required Mock Data

### 1. Authentication Flow Tests

**Problem**: Tests fail because:
- Tests use `test@example.com` but mock auth service expects `admin@campsite.com`, `staff@campsite.com`, etc.
- MSW handlers are set up but auth store might be using mock auth instead

**Solution**: 
- Option A: Disable mock auth in test environment
  ```typescript
  // In test setup or beforeEach
  vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
  ```

- Option B: Update mock auth to accept test credentials
  ```typescript
  // In mock-auth.ts, add test credentials
  'test@example.com': {
    password: 'password123',
    user: { ...mockUser }
  }
  ```

- Option C: Ensure MSW intercepts before mock auth
  - Verify MSW server is listening before component renders
  - Check that API calls go through MSW, not mock auth

**Required Mock Data**:
```typescript
// Add to mock-data.ts
export const mockTestUser = {
  ...mockUser,
  email: 'test@example.com',
  password: 'password123', // For mock auth service
};
```

### 2. Admin Dashboard Tests

**Problem**: Tests can't find formatted values like "$15,000" and "75%"

**Issues**:
- Data is returned from MSW but might not be formatted correctly
- Components might not be rendering the data
- Need to check if components are actually loading/displaying the data

**Required Mock Data**:
```typescript
// Already exists in mock-data.ts but verify format:
export const mockDashboardMetrics = {
  totalRevenue: 15000, // Should render as $15,000
  occupancyRate: 75,    // Should render as 75%
  activeBookings: 25,
  pendingPayments: 3,
  revenueChange: 12.5,
  occupancyChange: -2.3,
  bookingsChange: 8.1,
};
```

**Additional Setup Needed**:
- Verify components format numbers correctly (currency, percentage)
- Ensure React Query is properly configured in test providers
- Check if components wait for data to load before rendering

### 3. Payment Flow Tests

**Problem**: 
- Stripe `CardElement` not found (mock not working)
- Booking details not displaying

**Required Mock Setup**:
```typescript
// Payment flow test already has Stripe mock, but needs improvement:
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  useStripe: () => mockStripe,
  useElements: () => ({
    getElement: vi.fn(() => ({
      // Mock element with proper structure
    })),
  }),
  CardElement: () => <div data-testid="card-element">Card Element</div>,
  // Add PaymentElement if used
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
}));
```

**Required Mock Data**:
```typescript
// Ensure booking has all required fields for payment page
export const mockBookingForPayment = {
  ...mockBooking,
  bookingNumber: 'BK-001', // Add if missing
  site: {
    ...mockSite,
    name: 'Site A1', // Ensure site name is present
  },
  totalAmount: 70.00,
  // Add payment breakdown if needed
  breakdown: {
    subtotal: 70.00,
    tax: 5.00,
    discount: 0,
    total: 75.00,
  },
};
```

### 4. Staff Check-in Flow Tests

**Problem**: Can't find input with placeholder "booking id"

**Issue**: Component uses different label/placeholder text

**Required Setup**:
- Check actual component for input label/placeholder
- Update test to match actual component:
  ```typescript
  // Instead of:
  screen.getByPlaceholderText(/booking id/i)
  
  // Try:
  screen.getByLabelText(/booking/i)
  // or
  screen.getByRole('textbox', { name: /booking/i })
  ```

**Required Mock Data**:
```typescript
// Ensure booking has bookingNumber field
export const mockBookingForCheckIn = {
  ...mockBooking,
  bookingNumber: 'BK-001',
  id: '1', // Ensure ID is present
  status: 'CONFIRMED',
};
```

**Required MSW Handlers**:
```typescript
// Add search endpoint if component searches by booking number
http.get('http://localhost:5000/api/v1/bookings', ({ request }) => {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('searchTerm');
  
  if (searchTerm && mockBooking.bookingNumber?.includes(searchTerm)) {
    return HttpResponse.json([mockBooking]);
  }
  return HttpResponse.json([]);
}),
```

### 5. Booking Management Tests

**Problem**: Can't find booking numbers like "BK-001"

**Required Mock Data**:
```typescript
// Add to mock-data.ts or test file
export const mockBookingsList = [
  {
    ...mockBooking,
    id: '1',
    bookingNumber: 'BK-001',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    // Add all required fields
  },
  {
    ...mockBooking,
    id: '2',
    bookingNumber: 'BK-002',
    status: 'PENDING',
    paymentStatus: 'PENDING',
  },
];
```

**Required MSW Handlers**:
```typescript
http.get('http://localhost:5000/api/v1/bookings', ({ request }) => {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('searchTerm');
  const status = url.searchParams.get('status');
  
  let filtered = mockBookingsList;
  
  if (searchTerm) {
    filtered = filtered.filter(b => 
      b.bookingNumber?.includes(searchTerm) ||
      b.id.includes(searchTerm)
    );
  }
  
  if (status) {
    const statusArray = Array.isArray(status) ? status : [status];
    filtered = filtered.filter(b => statusArray.includes(b.status));
  }
  
  return HttpResponse.json(filtered);
}),
```

### 6. WebSocket Tests

**Problem**: Connection timeout and cleanup issues

**Required Setup**:
```typescript
// Mock WebSocket properly
global.WebSocket = class MockWebSocket {
  readyState = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(public url: string) {
    // Simulate connection after delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }
  
  send(data: string) {}
  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
} as any;
```

### 7. Security Tests

**Problem**: Edge cases in sanitization and validation

**Required Fixes**:
- Update sanitizeInput to handle `<` and `>` characters
- Fix validateFile to properly check file size limits

## General Mock Data Requirements

### Complete User Objects
```typescript
export const mockCompleteUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'STAFF' as const,
  phone: '555-0100',
  isActive: true,
  isEmailVerified: true,
  isPhoneVerified: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
```

### Complete Booking Objects
```typescript
export const mockCompleteBooking = {
  id: '1',
  bookingNumber: 'BK-001', // IMPORTANT: Add this field
  userId: '1',
  siteId: '1',
  checkInDate: new Date('2024-12-20'),
  checkOutDate: new Date('2024-12-22'),
  status: 'CONFIRMED' as const,
  paymentStatus: 'PAID' as const,
  totalAmount: 70.00,
  depositAmount: 35.00,
  paidAmount: 70.00,
  taxAmount: 5.00,
  discountAmount: 0,
  guests: {
    adults: 2,
    children: 1,
    pets: 0,
  },
  vehicles: [],
  equipmentRentals: [],
  specialRequests: 'Early check-in if possible',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockCompleteUser,
  site: mockSite,
};
```

### Complete Site Objects
```typescript
export const mockCompleteSite = {
  id: '1',
  name: 'Site A1', // Ensure name is present
  type: 'TENT' as const,
  status: 'AVAILABLE' as const,
  capacity: 4,
  pricePerNight: 35.00,
  description: 'Beautiful tent site with lake view',
  amenities: ['Water', 'Fire Pit', 'Picnic Table'],
  images: ['/images/site-a1.jpg'],
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
```

## Test Environment Setup

### Required Environment Variables
```typescript
// In test setup (setup.ts or vitest.config)
vi.stubEnv('VITE_API_URL', 'http://localhost:5000/api/v1');
vi.stubEnv('VITE_WS_URL', 'ws://localhost:5000');
vi.stubEnv('VITE_USE_MOCK_AUTH', 'false'); // Disable mock auth in tests
vi.stubEnv('VITE_STRIPE_PUBLIC_KEY', 'pk_test_mock');
```

### Required Provider Setup
```typescript
// Ensure test providers include:
- QueryClientProvider (for React Query)
- Router (for navigation)
- ThemeProvider (if using theme)
- All context providers used by components
```

## MSW Handler Patterns

### Standard GET Handler
```typescript
http.get('http://localhost:5000/api/v1/resource', ({ request }) => {
  const url = new URL(request.url);
  // Handle query params
  const param = url.searchParams.get('param');
  
  // Return mock data
  return HttpResponse.json(mockData);
}),
```

### Standard POST Handler
```typescript
http.post('http://localhost:5000/api/v1/resource', async ({ request }) => {
  const body = await request.json();
  // Validate body if needed
  
  // Return response
  return HttpResponse.json({
    ...mockData,
    ...body, // Merge request body
  });
}),
```

### Handler with Error Response
```typescript
http.post('http://localhost:5000/api/v1/resource', () => {
  return HttpResponse.json(
    { message: 'Error message' },
    { status: 400 }
  );
}),
```

## Checklist for New Tests

- [ ] Mock data includes all required fields
- [ ] MSW handlers match actual API endpoints
- [ ] MSW handlers handle query parameters
- [ ] Mock auth is disabled or configured correctly
- [ ] React Query is properly configured
- [ ] All required providers are included
- [ ] Stripe/third-party services are mocked
- [ ] WebSocket is mocked if needed
- [ ] Component labels/placeholders match test queries
- [ ] Data formatting matches expected display format

