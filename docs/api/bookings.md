# Bookings API Documentation

## Overview

The Bookings API provides comprehensive endpoints for managing campsite reservations, including creation, modification, cancellation, check-in/check-out, and payment processing.

**Base URL**: `/api/bookings`

**Authentication**: Required for all endpoints (JWT token)

**Rate Limiting**: 100 requests per minute per user

## Table of Contents

- [Data Models](#data-models)
- [Endpoints](#endpoints)
  - [List Bookings](#list-bookings)
  - [Get Booking Details](#get-booking-details)
  - [Create Booking](#create-booking)
  - [Update Booking](#update-booking)
  - [Cancel Booking](#cancel-booking)
  - [Calculate Booking Price](#calculate-booking-price)
  - [Calculate Cancellation Refund](#calculate-cancellation-refund)
  - [Check-In](#check-in)
  - [Check-Out](#check-out)
  - [Get QR Code](#get-qr-code)
- [Error Handling](#error-handling)
- [WebSocket Events](#websocket-events)

## Data Models

### Booking

```typescript
interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  siteId: string;
  checkInDate: string; // ISO 8601 date
  checkOutDate: string; // ISO 8601 date
  status: BookingStatus;
  adults: number;
  children: number;
  pets: number;
  vehicles: Vehicle[];
  equipmentRentals: EquipmentRental[];
  totalAmount: number;
  paidAmount: number;
  depositAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated relations
  user?: User;
  site?: Site;
  payments?: Payment[];
}
```

### BookingStatus

```typescript
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}
```

### PaymentStatus

```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED'
}
```

### Vehicle

```typescript
interface Vehicle {
  type: 'CAR' | 'RV' | 'MOTORCYCLE' | 'TRAILER';
  make?: string;
  model?: string;
  licensePlate: string;
  state?: string;
}
```

### EquipmentRental

```typescript
interface EquipmentRental {
  id: string;
  equipmentId: string;
  quantity: number;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalCost: number;
  status: 'RESERVED' | 'CHECKED_OUT' | 'CHECKED_IN' | 'CANCELLED';
  
  // Populated
  equipment?: Equipment;
}
```

## Endpoints

### List Bookings

Retrieve a paginated list of bookings with filtering options.

**Endpoint**: `GET /api/bookings`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |
| status | BookingStatus | No | Filter by booking status |
| paymentStatus | PaymentStatus | No | Filter by payment status |
| siteId | string | No | Filter by site ID |
| userId | string | No | Filter by user ID (admin/staff only) |
| startDate | string | No | Filter bookings starting after this date |
| endDate | string | No | Filter bookings ending before this date |
| search | string | No | Search by booking number, user name, or email |
| sortBy | string | No | Sort field (default: 'checkInDate') |
| sortOrder | 'asc' \| 'desc' | No | Sort order (default: 'desc') |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "booking_123",
        "bookingNumber": "BK-2025-001234",
        "userId": "user_456",
        "siteId": "site_789",
        "checkInDate": "2025-10-20T14:00:00Z",
        "checkOutDate": "2025-10-23T11:00:00Z",
        "status": "CONFIRMED",
        "adults": 2,
        "children": 1,
        "pets": 0,
        "vehicles": [
          {
            "type": "CAR",
            "make": "Toyota",
            "model": "Camry",
            "licensePlate": "ABC123",
            "state": "CA"
          }
        ],
        "equipmentRentals": [],
        "totalAmount": 450.00,
        "paidAmount": 450.00,
        "depositAmount": 100.00,
        "balanceAmount": 0.00,
        "paymentStatus": "PAID",
        "specialRequests": "Late check-in requested",
        "createdAt": "2025-10-01T10:30:00Z",
        "updatedAt": "2025-10-01T10:35:00Z",
        "site": {
          "id": "site_789",
          "name": "Lakeside Site A1",
          "siteNumber": "A1",
          "category": "TENT"
        },
        "user": {
          "id": "user_456",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Permissions**:
- Customers: Can only view their own bookings
- Staff/Manager/Admin: Can view all bookings

---

### Get Booking Details

Retrieve detailed information about a specific booking.

**Endpoint**: `GET /api/bookings/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "bookingNumber": "BK-2025-001234",
    "userId": "user_456",
    "siteId": "site_789",
    "checkInDate": "2025-10-20T14:00:00Z",
    "checkOutDate": "2025-10-23T11:00:00Z",
    "status": "CONFIRMED",
    "adults": 2,
    "children": 1,
    "pets": 0,
    "vehicles": [
      {
        "type": "CAR",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123",
        "state": "CA"
      }
    ],
    "equipmentRentals": [
      {
        "id": "rental_001",
        "equipmentId": "equip_123",
        "quantity": 1,
        "startDate": "2025-10-20T14:00:00Z",
        "endDate": "2025-10-23T11:00:00Z",
        "dailyRate": 25.00,
        "totalCost": 75.00,
        "status": "RESERVED",
        "equipment": {
          "id": "equip_123",
          "name": "Camping Tent (4-person)",
          "category": "TENTS"
        }
      }
    ],
    "totalAmount": 525.00,
    "paidAmount": 525.00,
    "depositAmount": 100.00,
    "balanceAmount": 0.00,
    "paymentStatus": "PAID",
    "specialRequests": "Late check-in requested",
    "notes": "Customer called to confirm arrival time",
    "qrCode": "data:image/png;base64,...",
    "createdAt": "2025-10-01T10:30:00Z",
    "updatedAt": "2025-10-01T10:35:00Z",
    "site": {
      "id": "site_789",
      "name": "Lakeside Site A1",
      "siteNumber": "A1",
      "category": "TENT",
      "amenities": ["WATER", "ELECTRIC", "FIRE_PIT"],
      "maxOccupancy": 6,
      "pricePerNight": 150.00
    },
    "user": {
      "id": "user_456",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123"
    },
    "payments": [
      {
        "id": "payment_001",
        "amount": 525.00,
        "status": "COMPLETED",
        "method": "CREDIT_CARD",
        "transactionId": "ch_abc123",
        "createdAt": "2025-10-01T10:35:00Z"
      }
    ]
  }
}
```

**Permissions**:
- Customers: Can only view their own bookings
- Staff/Manager/Admin: Can view all bookings

---

### Create Booking

Create a new booking reservation.

**Endpoint**: `POST /api/bookings`

**Request Body**:

```json
{
  "siteId": "site_789",
  "checkInDate": "2025-10-20",
  "checkOutDate": "2025-10-23",
  "adults": 2,
  "children": 1,
  "pets": 0,
  "vehicles": [
    {
      "type": "CAR",
      "make": "Toyota",
      "model": "Camry",
      "licensePlate": "ABC123",
      "state": "CA"
    }
  ],
  "equipmentRentals": [
    {
      "equipmentId": "equip_123",
      "quantity": 1,
      "startDate": "2025-10-20",
      "endDate": "2025-10-23"
    }
  ],
  "specialRequests": "Late check-in requested",
  "paymentMethodId": "pm_abc123"
}
```

**Validation Rules**:
- `checkInDate` must be in the future
- `checkOutDate` must be after `checkInDate`
- `adults` must be at least 1
- Total occupancy (adults + children) must not exceed site capacity
- Site must be available for selected dates
- Equipment must be available for selected dates and quantities

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "bookingNumber": "BK-2025-001234",
    "status": "CONFIRMED",
    "totalAmount": 525.00,
    "depositAmount": 100.00,
    "balanceAmount": 425.00,
    "paymentStatus": "PARTIAL",
    "qrCode": "data:image/png;base64,...",
    "checkInDate": "2025-10-20T14:00:00Z",
    "checkOutDate": "2025-10-23T11:00:00Z"
  },
  "message": "Booking created successfully. Confirmation email sent."
}
```

**Permissions**: All authenticated users

---

### Update Booking

Modify an existing booking (dates, guests, equipment, etc.).

**Endpoint**: `PUT /api/bookings/:id`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Request Body**:

```json
{
  "checkInDate": "2025-10-21",
  "checkOutDate": "2025-10-24",
  "adults": 3,
  "children": 2,
  "pets": 1,
  "vehicles": [
    {
      "type": "RV",
      "make": "Winnebago",
      "model": "Vista",
      "licensePlate": "XYZ789",
      "state": "CA"
    }
  ],
  "equipmentRentals": [
    {
      "equipmentId": "equip_456",
      "quantity": 2,
      "startDate": "2025-10-21",
      "endDate": "2025-10-24"
    }
  ],
  "specialRequests": "Updated: Need early check-in"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "bookingNumber": "BK-2025-001234",
    "status": "CONFIRMED",
    "totalAmount": 675.00,
    "paidAmount": 525.00,
    "balanceAmount": 150.00,
    "priceDifference": 150.00,
    "paymentRequired": true,
    "updatedAt": "2025-10-02T14:20:00Z"
  },
  "message": "Booking updated successfully. Additional payment of $150.00 required."
}
```

**Modification Restrictions**:
- Cannot modify bookings within 48 hours of check-in (configurable)
- Cannot modify completed or cancelled bookings
- Cannot modify checked-in bookings (must check out first)
- Site must be available for new dates
- Equipment must be available for new dates

**Permissions**:
- Customers: Can only modify their own bookings
- Staff/Manager/Admin: Can modify any booking

---

### Cancel Booking

Cancel a booking and process refund if applicable.

**Endpoint**: `POST /api/bookings/:id/cancel`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Request Body**:

```json
{
  "reason": "Change of plans",
  "notes": "Customer requested cancellation due to family emergency"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "CANCELLED",
    "refundAmount": 262.50,
    "refundPercentage": 50,
    "cancellationFee": 262.50,
    "refundStatus": "PROCESSING",
    "estimatedRefundDate": "2025-10-12T00:00:00Z",
    "cancelledAt": "2025-10-02T15:30:00Z"
  },
  "message": "Booking cancelled successfully. Refund of $262.50 will be processed within 5-10 business days."
}
```

**Refund Policy** (default):
- 30+ days before check-in: 100% refund (minus processing fee)
- 14-29 days before: 50% refund
- 7-13 days before: 25% refund
- Less than 7 days: No refund
- No-show: No refund

**Permissions**:
- Customers: Can only cancel their own bookings
- Staff/Manager/Admin: Can cancel any booking

---

### Calculate Booking Price

Calculate the total price for a booking based on dates, site, and equipment.

**Endpoint**: `POST /api/bookings/calculate-price`

**Request Body**:

```json
{
  "siteId": "site_789",
  "checkInDate": "2025-10-20",
  "checkOutDate": "2025-10-23",
  "adults": 2,
  "children": 1,
  "equipmentRentals": [
    {
      "equipmentId": "equip_123",
      "quantity": 1,
      "startDate": "2025-10-20",
      "endDate": "2025-10-23"
    }
  ],
  "promoCode": "SUMMER2025"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "breakdown": {
      "siteRate": 150.00,
      "nights": 3,
      "siteSubtotal": 450.00,
      "equipmentRentals": [
        {
          "equipmentId": "equip_123",
          "name": "Camping Tent (4-person)",
          "quantity": 1,
          "days": 3,
          "dailyRate": 25.00,
          "subtotal": 75.00
        }
      ],
      "equipmentSubtotal": 75.00,
      "subtotal": 525.00,
      "discount": 52.50,
      "discountPercentage": 10,
      "promoCode": "SUMMER2025",
      "tax": 47.25,
      "taxRate": 0.10,
      "total": 519.75,
      "depositRequired": 100.00,
      "balanceDue": 419.75
    }
  }
}
```

**Permissions**: All authenticated users

---

### Calculate Cancellation Refund

Calculate the refund amount for cancelling a booking.

**Endpoint**: `GET /api/bookings/:id/calculate-refund`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_123",
    "totalPaid": 525.00,
    "refundAmount": 262.50,
    "refundPercentage": 50,
    "cancellationFee": 262.50,
    "daysUntilCheckIn": 20,
    "refundPolicy": "50% refund (14-29 days before check-in)",
    "breakdown": {
      "siteRefund": 225.00,
      "equipmentRefund": 37.50,
      "processingFee": 0.00
    }
  }
}
```

**Permissions**:
- Customers: Can only calculate for their own bookings
- Staff/Manager/Admin: Can calculate for any booking

---

### Check-In

Process check-in for a booking.

**Endpoint**: `POST /api/bookings/:id/check-in`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Request Body**:

```json
{
  "actualCheckInTime": "2025-10-20T15:30:00Z",
  "notes": "Customer arrived early, site was ready",
  "vehicleInspection": true,
  "equipmentIssued": ["equip_123"],
  "staffId": "staff_001"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "CHECKED_IN",
    "actualCheckInTime": "2025-10-20T15:30:00Z",
    "checkedInBy": "staff_001",
    "siteAssignment": {
      "siteId": "site_789",
      "siteNumber": "A1",
      "accessCode": "1234"
    }
  },
  "message": "Check-in completed successfully. Welcome packet sent to customer."
}
```

**Permissions**: Staff, Manager, Admin only

---

### Check-Out

Process check-out for a booking.

**Endpoint**: `POST /api/bookings/:id/check-out`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Request Body**:

```json
{
  "actualCheckOutTime": "2025-10-23T10:45:00Z",
  "notes": "Site left in good condition",
  "equipmentReturned": ["equip_123"],
  "equipmentCondition": "GOOD",
  "additionalCharges": [
    {
      "description": "Late checkout fee",
      "amount": 25.00
    }
  ],
  "staffId": "staff_001"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "status": "CHECKED_OUT",
    "actualCheckOutTime": "2025-10-23T10:45:00Z",
    "checkedOutBy": "staff_001",
    "finalCharges": {
      "originalTotal": 525.00,
      "additionalCharges": 25.00,
      "finalTotal": 550.00,
      "balanceDue": 25.00
    }
  },
  "message": "Check-out completed successfully. Final receipt sent to customer."
}
```

**Permissions**: Staff, Manager, Admin only

---

### Get QR Code

Retrieve the QR code for a booking (used for check-in).

**Endpoint**: `GET /api/bookings/:id/qr-code`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Booking ID |

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| format | 'png' \| 'svg' | No | QR code format (default: 'png') |
| size | number | No | QR code size in pixels (default: 300) |

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "bookingNumber": "BK-2025-001234",
    "format": "png",
    "size": 300,
    "expiresAt": "2025-10-23T11:00:00Z"
  }
}
```

**Permissions**:
- Customers: Can only get QR code for their own bookings
- Staff/Manager/Admin: Can get QR code for any booking

---

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid booking data",
    "details": [
      {
        "field": "checkInDate",
        "message": "Check-in date must be in the future"
      },
      {
        "field": "adults",
        "message": "At least one adult is required"
      }
    ]
  }
}
```

#### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking with ID 'booking_123' not found"
  }
}
```

#### 409 Conflict

```json
{
  "success": false,
  "error": {
    "code": "SITE_NOT_AVAILABLE",
    "message": "Site is not available for the selected dates",
    "details": {
      "siteId": "site_789",
      "requestedDates": {
        "checkIn": "2025-10-20",
        "checkOut": "2025-10-23"
      },
      "conflictingBookings": ["booking_456"]
    }
  }
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "MODIFICATION_NOT_ALLOWED",
    "message": "Cannot modify booking within 48 hours of check-in",
    "details": {
      "checkInDate": "2025-10-20T14:00:00Z",
      "hoursUntilCheckIn": 36
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid request data |
| BOOKING_NOT_FOUND | Booking does not exist |
| SITE_NOT_AVAILABLE | Site is not available for selected dates |
| EQUIPMENT_NOT_AVAILABLE | Equipment is not available |
| MODIFICATION_NOT_ALLOWED | Booking cannot be modified |
| CANCELLATION_NOT_ALLOWED | Booking cannot be cancelled |
| PAYMENT_REQUIRED | Payment is required to complete action |
| INSUFFICIENT_CAPACITY | Site capacity exceeded |
| INVALID_DATE_RANGE | Invalid check-in/check-out dates |
| UNAUTHORIZED | User not authorized for this action |

## WebSocket Events

The Bookings API emits real-time events via WebSocket for live updates.

### Events Emitted

#### booking:created

Emitted when a new booking is created.

```json
{
  "event": "booking:created",
  "data": {
    "bookingId": "booking_123",
    "bookingNumber": "BK-2025-001234",
    "siteId": "site_789",
    "userId": "user_456",
    "checkInDate": "2025-10-20T14:00:00Z",
    "checkOutDate": "2025-10-23T11:00:00Z",
    "status": "CONFIRMED"
  }
}
```

#### booking:updated

Emitted when a booking is modified.

```json
{
  "event": "booking:updated",
  "data": {
    "bookingId": "booking_123",
    "changes": {
      "checkInDate": "2025-10-21T14:00:00Z",
      "adults": 3
    },
    "priceDifference": 150.00
  }
}
```

#### booking:cancelled

Emitted when a booking is cancelled.

```json
{
  "event": "booking:cancelled",
  "data": {
    "bookingId": "booking_123",
    "refundAmount": 262.50,
    "cancelledAt": "2025-10-02T15:30:00Z"
  }
}
```

#### booking:checked-in

Emitted when a booking is checked in.

```json
{
  "event": "booking:checked-in",
  "data": {
    "bookingId": "booking_123",
    "actualCheckInTime": "2025-10-20T15:30:00Z",
    "siteNumber": "A1"
  }
}
```

#### booking:checked-out

Emitted when a booking is checked out.

```json
{
  "event": "booking:checked-out",
  "data": {
    "bookingId": "booking_123",
    "actualCheckOutTime": "2025-10-23T10:45:00Z",
    "finalCharges": 550.00
  }
}
```

### Subscribing to Events

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function BookingComponent() {
  const { subscribe } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe('booking:updated', (data) => {
      console.log('Booking updated:', data);
      // Update UI accordingly
    });
    
    return unsubscribe;
  }, [subscribe]);
}
```

## Related Documentation

- [Sites API](./sites.md) - Site availability and management
- [Equipment API](./equipment.md) - Equipment rental management
- [Payments API](./payments.md) - Payment processing
- [WebSocket Events](./websocket.md) - Real-time event system
- [Booking Management Guide](../user-guide/booking-management.md) - User guide for staff
- [Customer Portal Guide](../user-guide/customer-portal.md) - User guide for customers

---

*Last updated: 2025-10-14*
