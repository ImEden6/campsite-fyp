# Booking Management Guide

This guide covers how to manage bookings in the Campsite Management System, including creating bookings, managing reservations, check-in/check-out processes, and handling cancellations.

## Overview

The Booking Management feature provides comprehensive tools for:
- Viewing and managing all bookings
- Creating manual bookings (staff/manager)
- Browsing available sites (customers)
- Processing check-ins and check-outs
- Handling modifications and cancellations
- Real-time availability updates

## User Roles and Access

### Customer
- Browse available sites (`/browse-sites`)
- Create new bookings (`/book`)
- View personal bookings (`/my-bookings`)
- Modify and cancel own bookings
- View booking details and receipts

### Staff & Manager
- View all bookings (`/manage/bookings`)
- Create manual bookings for customers
- Process check-ins (`/manage/check-in`)
- Process check-outs (`/manage/check-out`)
- Modify any booking
- Handle cancellations and refunds

### Admin
- All staff/manager permissions
- Access to booking analytics
- System-wide booking configuration

## Browsing Available Sites (Customer)

### Accessing Site Browser

**Navigation**: Main Menu → Browse Sites

**URL**: `/browse-sites`

### Site Search and Filtering

Filter available sites by:
- **Date Range**: Check-in and check-out dates
- **Site Type**: Tent, RV, Cabin, etc.
- **Amenities**: Water, electric, sewer, WiFi, etc.
- **Capacity**: Number of guests
- **Price Range**: Minimum and maximum price

### Site Information

Each site card displays:
- Site name and number
- Site type and category
- Available amenities (icons)
- Nightly rate
- Maximum capacity
- Photo gallery
- Availability status

### Viewing Site Details

Click on any site card to view:
- Full description
- Complete amenity list
- Location on campground map
- Pricing details (daily, weekly, monthly)
- Reviews and ratings
- Availability calendar

## Creating a Booking (Customer)

### Booking Flow

1. **Select Site and Dates**
   - Choose check-in and check-out dates
   - Select desired site from available options
   - Click "Book Now"

2. **Enter Guest Information**
   - Number of adults and children
   - Vehicle information (if applicable)
   - Special requests or notes

3. **Add Equipment Rentals** (Optional)
   - Browse available equipment
   - Select items and quantities
   - View rental pricing

4. **Review and Confirm**
   - Review booking summary
   - View total cost breakdown
   - Review cancellation policy
   - Accept terms and conditions

5. **Process Payment**
   - Enter payment information
   - Complete Stripe payment
   - Receive booking confirmation

### Booking Confirmation

After successful booking:
- Confirmation email sent
- Booking appears in "My Bookings"
- QR code generated for check-in
- Receipt available for download

## Managing Bookings (Staff/Manager)

### Accessing Booking Management

**Navigation**: Manage Menu → Bookings

**URL**: `/manage/bookings`

### Booking Calendar View

The calendar displays:
- **Month View**: Overview of all bookings
- **Week View**: Detailed weekly schedule
- **Day View**: Hourly breakdown

**Color Coding**:
- 🟢 Green: Confirmed bookings
- 🟡 Yellow: Pending bookings
- 🔵 Blue: Checked-in guests
- 🟠 Orange: Checking out today
- 🔴 Red: Cancelled bookings

### Booking List View

Filter bookings by:
- Status (confirmed, pending, checked-in, checked-out, cancelled)
- Date range
- Site type
- Customer name or email
- Booking ID

### Creating Manual Bookings

Staff and managers can create bookings on behalf of customers:

1. Click **"Create Booking"** button
2. Search for existing customer or create new
3. Select site and dates
4. Enter guest details
5. Add equipment rentals (optional)
6. Choose payment method:
   - Pay now (process payment immediately)
   - Pay at check-in
   - Invoice customer
7. Add internal notes
8. Confirm booking

### Modifying Bookings

To modify an existing booking:

1. Locate booking in list or calendar
2. Click on booking to view details
3. Click **"Edit Booking"**
4. Modify:
   - Dates (subject to availability)
   - Site (if available)
   - Guest count
   - Equipment rentals
   - Special requests
5. Save changes
6. System calculates price adjustment
7. Process additional payment or refund if needed

### Viewing Booking Details

Click any booking to view:
- Customer information
- Site details
- Check-in/check-out dates
- Guest count and vehicle info
- Equipment rentals
- Payment history
- Special requests
- Internal notes
- Activity log

## Check-In Process

### Accessing Check-In

**Navigation**: Manage Menu → Check-In

**URL**: `/manage/check-in`

### Check-In Steps

1. **Locate Booking**
   - Search by booking ID, customer name, or email
   - Scan QR code from customer's confirmation
   - View today's arrivals list

2. **Verify Information**
   - Confirm customer identity
   - Verify guest count
   - Check vehicle information
   - Review special requests

3. **Collect Payment**
   - Process any outstanding balance
   - Collect security deposit (if required)
   - Issue receipt

4. **Provide Information**
   - Assign site location
   - Provide campground map
   - Explain amenities and rules
   - Provide WiFi password
   - Give emergency contact information

5. **Complete Check-In**
   - Mark booking as "Checked In"
   - Generate site access code (if applicable)
   - Print welcome packet
   - Update site status to "Occupied"

### QR Code Check-In

Customers can use QR codes for self-service check-in:
- Scan QR code from confirmation email
- System verifies booking
- Displays site information
- Provides digital welcome packet

## Check-Out Process

### Accessing Check-Out

**Navigation**: Manage Menu → Check-Out

**URL**: `/manage/check-out`

### Check-Out Steps

1. **Locate Active Booking**
   - Search by site number or customer name
   - View today's departures list

2. **Inspect Site**
   - Verify site condition
   - Check for damages
   - Confirm equipment returns
   - Note any issues

3. **Calculate Final Charges**
   - Review base booking cost
   - Add any additional charges:
     - Late checkout fees
     - Damage fees
     - Extra equipment rentals
     - Additional guests
   - Apply any credits or refunds

4. **Process Payment**
   - Collect any outstanding balance
   - Refund security deposit (if applicable)
   - Issue final receipt

5. **Complete Check-Out**
   - Mark booking as "Checked Out"
   - Update site status to "Available"
   - Request review/feedback
   - Thank customer

### Early Check-Out

For early departures:
- Calculate refund based on cancellation policy
- Process refund if applicable
- Update booking dates
- Free up site for new bookings

### Late Check-Out

For late departures:
- Check availability for extended stay
- Calculate additional charges
- Process payment
- Update booking end date

## Cancellations and Refunds

### Customer-Initiated Cancellation

Customers can cancel bookings from "My Bookings":

1. Select booking to cancel
2. Click **"Cancel Booking"**
3. Review cancellation policy
4. View refund amount
5. Confirm cancellation
6. Receive cancellation confirmation

### Cancellation Policy

Standard policy (configurable by admin):
- **30+ days before**: Full refund minus processing fee
- **14-29 days before**: 50% refund
- **7-13 days before**: 25% refund
- **Less than 7 days**: No refund
- **No-show**: No refund

### Staff-Initiated Cancellation

Staff can cancel bookings with custom refund amounts:

1. Open booking details
2. Click **"Cancel Booking"**
3. Select cancellation reason
4. Choose refund option:
   - Full refund
   - Partial refund (enter amount)
   - No refund
5. Add internal notes
6. Confirm cancellation
7. Process refund if applicable

### Refund Processing

Refunds are processed:
- Automatically to original payment method
- Within 5-10 business days
- Customer receives refund confirmation email
- Refund appears in payment history

## Real-Time Updates

The booking system uses WebSocket connections for live updates:

### Automatic Updates
- Availability changes instantly across all devices
- New bookings appear immediately
- Status changes reflect in real-time
- Calendar updates automatically

### Notifications
- New booking alerts
- Check-in reminders
- Check-out notifications
- Payment confirmations
- Cancellation alerts

## Equipment Rentals

### Adding Equipment to Booking

During booking creation or modification:

1. Click **"Add Equipment"**
2. Browse available equipment
3. Select items and quantities
4. Choose rental period
5. View pricing
6. Add to booking

### Equipment Check-Out

At check-in:
- Verify equipment availability
- Inspect equipment condition
- Document any existing damage
- Provide usage instructions
- Customer signs equipment agreement

### Equipment Check-In

At check-out:
- Inspect returned equipment
- Verify all items returned
- Document any damage
- Calculate damage fees if needed
- Update equipment inventory

For detailed equipment management, see [Equipment Management Guide](./equipment-management.md).

## Booking Reports

### Available Reports

- **Occupancy Report**: Site utilization over time
- **Revenue Report**: Booking revenue by period
- **Arrival/Departure Report**: Daily check-ins and check-outs
- **Cancellation Report**: Cancellation trends and reasons
- **Equipment Rental Report**: Equipment usage and revenue

### Generating Reports

1. Navigate to Reports section
2. Select report type
3. Choose date range
4. Apply filters (site type, status, etc.)
5. Generate report
6. Export to CSV, PDF, or Excel

## Best Practices

### For Staff
- Confirm bookings promptly
- Keep internal notes updated
- Verify customer information at check-in
- Inspect sites thoroughly at check-out
- Process refunds quickly
- Respond to customer inquiries within 24 hours

### For Managers
- Monitor occupancy rates daily
- Review cancellation trends
- Adjust pricing based on demand
- Train staff on booking procedures
- Handle escalated customer issues
- Review booking reports weekly

### For Customers
- Book early for peak seasons
- Review cancellation policy before booking
- Arrive during check-in hours
- Report issues immediately
- Respect check-out times
- Leave sites clean

## Troubleshooting

### Booking Not Showing
- Refresh the page
- Check filters and date range
- Verify booking status
- Search by booking ID

### Payment Failed
- Verify payment information
- Check card balance
- Try alternative payment method
- Contact support if issue persists

### Site Not Available
- Check date range
- Verify site type filters
- Consider alternative dates
- Contact staff for assistance

### QR Code Not Working
- Ensure good lighting
- Clean camera lens
- Try manual booking ID entry
- Contact staff for assistance

## Keyboard Shortcuts

- **Ctrl/Cmd + N**: Create new booking
- **Ctrl/Cmd + F**: Focus search
- **Ctrl/Cmd + K**: Quick booking lookup
- **Esc**: Close modal/dialog
- **Tab**: Navigate form fields
- **Enter**: Submit form

## Related Documentation

- [Equipment Management Guide](./equipment-management.md)
- [Payment Processing](./payment-processing.md)
- [Site Management](./site-management.md)
- [Analytics and Reporting](./analytics-and-reporting.md)

## Support

For booking assistance:
- Check the FAQ
- Contact support: support@campsite.com
- Call: 1-800-CAMPSITE
- Live chat available 24/7

---

*Last updated: 2025-10-14*
