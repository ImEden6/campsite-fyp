# Campsite Management System - Project Overview

## Introduction
This project is a comprehensive **Campsite Management System** designed to handle various aspects of campsite operations for staff and administrators. It features booking management, site management, equipment rentals, and user administration with a modern frontend built with React and a shared library for types and schemas.

## Technology Stack

### Frontend (`/frontend`)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, clsx, tailwind-merge
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **UI Components**: Framer Motion (animations), Lucide React (icons)
- **Forms**: React Hook Form, Zod
- **Visualization**: Recharts (charts), Fabric.js (interactive maps/canvas)
- **Testing**: Vitest (unit), Playwright (E2E), React Testing Library
- **Utilities**: date-fns, axios, socket.io-client

### Shared (`/shared`)
- **Purpose**: Shared TypeScript types, Zod schemas, and utility functions used across the project.
- **Dependencies**: Zod

## Project Structure

- **`frontend/`**: Contains the React application.
  - **`src/features/`**: Modular feature-based architecture.
    - `analytics`: Reporting and data visualization.
    - `auth`: Authentication logic (Login, Register) for staff.
    - `bookings`: Booking management workflows, calendar, check-in/out.
    - `equipment`: Equipment inventory and rental management.
    - `payments`: Payment processing integration (for staff-initiated payments).
    - `sites`: Campsite management and browsing.
    - `users`: User profiles and management.
  - **`src/pages/`**: Application routes/pages (e.g., `AdminDashboardPage`, `MapEditor`, `BookingPage`).
  - **`src/components/`**: Reusable UI components.
  - **`src/stores/`**: Global state stores.

- **`shared/`**: Common code shared between frontend and potentially backend (if added later).

## Key Features

1.  **Dashboard & Portals**:
    - **Admin Dashboard**: Central hub for campsite management.
    - **Staff Interface**: Tools for managing bookings and operations.

2.  **Site Management**:
    - **Map Editor**: Interactive tool to design campsite layouts (uses Fabric.js).
    - **Site Browsing**: List and view available campsites.

3.  **Booking Management**:
    - Staff-managed booking workflows.
    - Calendar view.
    - Check-in and check-out processes.

4.  **Equipment Management**:
    - Catalog and rental system for equipment.

5.  **User Administration**:
    - User management, profiles, and settings.
    - Role-based access (Admin, Manager, Staff).

6.  **Analytics**:
    - Reports and visual data analysis.

## Getting Started

### Prerequisites
- Node.js
- npm

### Installation
Run the following command in the root directory to install dependencies for all workspaces:
```bash
npm run install:all
```

### Development
To start the frontend development server:
```bash
npm run dev
```
(This runs `cd frontend && npm run dev`)

### Building
To build the project:
```bash
npm run build
npm run preview
```

### Testing
- **Type Check**: `npm run type-check`
- **Lint**: `npm run lint`

## Test Login Credentials

The application uses mock authentication for development. The following test accounts are available:

### Admin Account
- **Email**: `admin@campsite.com`
- **Password**: `admin123`
- **Role**: Admin
- **Name**: Admin User

### Manager Account
- **Email**: `manager@campsite.com`
- **Password**: `manager123`
- **Role**: Manager
- **Name**: Mike Manager

### Staff Account
- **Email**: `staff@campsite.com`
- **Password**: `staff123`
- **Role**: Staff
- **Name**: Sarah Staff

**Note**: These credentials are for development/testing purposes only. 

### Enabling Mock Authentication

Mock authentication can be enabled in development, preview, and production builds by setting the `VITE_USE_MOCK_AUTH` environment variable to `true`.

**For Development:**
- Create a `.env` file in the `frontend/` directory with:
  ```
  VITE_USE_MOCK_AUTH=true
  ```

**For Preview/Production Builds:**
- Set the environment variable before building:
  ```bash
  # Windows (PowerShell)
  $env:VITE_USE_MOCK_AUTH="true"; npm run build
  
  # Windows (CMD)
  set VITE_USE_MOCK_AUTH=true && npm run build
  
  # Linux/Mac
  VITE_USE_MOCK_AUTH=true npm run build
  ```
- Then run preview:
  ```bash
  npm run preview
  ```

**Important**: Mock authentication is only for testing/demo purposes. In production, ensure you have a proper backend API configured.

## Payment System

The application includes a payment system for booking transactions. It supports both **mock payments** (for demos/development) and **real Stripe integration** (for production).

### Mock Payments (Demo Mode - $0 Cost)

Mock payments simulate the entire payment flow without any real transactions or Stripe account required. Perfect for demos and development.

**Enable mock payments:**
```bash
# Create frontend/.env or set environment variable
VITE_USE_MOCK_PAYMENTS=true
```

**Or use the convenience script:**
```bash
cd frontend
npm run preview:local  # Builds with mock payments and starts preview server
```

**What mock mode does:**
- Displays a simulated card form with pre-filled test card (4242 4242 4242 4242)
- Shows a clear "Mock Payment Mode" badge
- Simulates payment processing delay
- Creates mock payment records in the system
- No real money is ever charged

### Real Stripe Integration (Production)

When you're ready to accept real payments, you'll need to:

#### 1. Set up Stripe Account
- Create a [Stripe account](https://stripe.com)
- Get your API keys from the Stripe Dashboard

#### 2. Configure Environment Variables

**Frontend (`frontend/.env`):**
```env
VITE_USE_MOCK_PAYMENTS=false
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production
VITE_API_URL=https://your-backend.com/api/v1
```

**Backend (when you build it):**
```env
STRIPE_SECRET_KEY=sk_test_xxxxx  # or sk_live_xxxxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 3. Backend Implementation Required

The following API endpoints need to be implemented in your backend:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/intent` | POST | Create a Stripe PaymentIntent |
| `/payments/confirm/:id` | POST | Confirm payment after Stripe processes it |
| `/payments/:id` | GET | Get payment details |
| `/bookings/:id/payments` | GET | Get payments for a booking |
| `/payments/history` | GET | Get user's payment history |
| `/payments/:id/refund` | POST | Process a refund |

**Example backend payment intent creation (Node.js/Express):**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/v1/payments/intent', async (req, res) => {
  const { amount, currency, bookingId, description } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,           // Amount in cents (e.g., 5000 = $50.00)
    currency,         // 'usd', 'eur', etc.
    metadata: { bookingId },
    description,
  });
  
  res.json({
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  });
});
```

#### 4. Stripe Test Mode (Free Testing with Real Integration)

Stripe offers a **test mode** that works exactly like production but doesn't charge real money:

- Use `pk_test_` and `sk_test_` keys (not `pk_live_` / `sk_live_`)
- Test card numbers: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
- All test transactions are free
- Great for staging environments and demos with real Stripe UI

### CORS Configuration

When connecting to a real backend, ensure your backend allows requests from your frontend origin:

```javascript
// Express.js example
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',      // Local development
    'https://your-frontend.com',  // Production
  ],
  credentials: true,
}));
```

### Files to Review When Adding Backend

| File | Purpose |
|------|---------|
| `frontend/src/features/payments/services/payment.service.ts` | API calls to backend |
| `frontend/src/features/payments/components/PaymentModal.tsx` | Switches between mock/real mode |
| `frontend/src/features/payments/components/MockPaymentForm.tsx` | Mock payment UI |
| `frontend/src/features/payments/components/StripeProvider.tsx` | Real Stripe Elements wrapper |
| `frontend/src/features/payments/components/PaymentForm.tsx` | Real Stripe payment form |
| `frontend/src/config/env.ts` | Environment variable configuration |
| `frontend/src/config/stripe.ts` | Stripe SDK initialization |