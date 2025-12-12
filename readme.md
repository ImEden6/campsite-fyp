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