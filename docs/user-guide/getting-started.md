# Getting Started

Welcome to the Campsite Management System! This guide will help you get started with the system quickly and efficiently.

## Overview

The Campsite Management System is a comprehensive solution for managing campsite bookings, payments, and operations. It supports multiple user roles and provides real-time updates across all connected devices.

## User Roles

### Admin
- Full system access
- User management
- System configuration
- Financial reporting
- Campsite management (see [Site Management Guide](./site-management.md))
- Interactive map editor (`/admin/map-editor`)
- Access to all manager and staff features

### Manager
- Campsite operations
- Booking management (`/manage/bookings`)
- Staff supervision
- Operational reporting
- Check-in/check-out operations (`/manage/check-in`, `/manage/check-out`)
- Map viewing (`/maps/:id`)

### Staff
- Check-in/check-out (`/manage/check-in`, `/manage/check-out`)
- Booking management (`/manage/bookings`)
- Customer service
- Maintenance logging

### Customer
- Browse campsites (`/browse-sites`)
- Make bookings (`/book`)
- Manage reservations (`/my-bookings`)
- Payment processing
- Profile management (`/profile`)
- Notifications (`/notifications`)

## First Steps

### 1. Account Setup

If you're an admin or manager, you'll need to:
1. Log in with your credentials
2. Complete your profile
3. Configure system settings
4. Set up payment methods

### 2. Campsite Configuration

Before accepting bookings:
1. Add campsite categories (tent, RV, cabin, etc.)
2. Configure amenities
3. Set up individual campsites (see [Site Management Guide](./site-management.md))
4. Define pricing rules

For detailed instructions on creating and managing campsites, see the [Site Management Guide](./site-management.md).

### 3. Staff Training

Ensure your staff knows how to:
- Use the check-in/check-out system
- Handle customer inquiries
- Process payments
- Update booking information

## Key Features

### Real-time Booking Calendar
- View availability across all campsites
- Drag-and-drop booking management
- Instant availability updates
- Conflict resolution

### Payment Processing
- Secure Stripe integration
- Multiple payment methods
- Automatic receipts
- Refund processing

### Interactive Map
- Visual campsite layout
- Drag-and-drop positioning
- Amenity indicators
- Occupancy status

### Reporting Dashboard
- Revenue analytics
- Occupancy rates
- Customer insights
- Performance metrics

## Common Workflows

### Making a Booking (Customer)
1. Navigate to Browse Sites (`/browse-sites`)
2. Select dates and campsite type
3. Click "Book Now" to go to booking page (`/book`)
4. Add guest information
5. Process payment
6. View confirmation in My Bookings (`/my-bookings`)

### Check-in Process (Staff/Manager)
1. Navigate to Check-In page (`/manage/check-in`)
2. Locate booking in system
3. Verify guest identity
4. Collect any outstanding payments
5. Assign campsite keys/information
6. Complete check-in

### Check-out Process (Staff/Manager)
1. Navigate to Check-Out page (`/manage/check-out`)
2. Locate active booking
3. Inspect campsite condition
4. Process any additional charges
5. Complete check-out

### Managing Bookings (Manager/Staff)
1. Navigate to Booking Management (`/manage/bookings`)
2. View upcoming arrivals and current occupancy
3. Monitor occupancy levels
4. Handle cancellations/modifications
5. Generate reports
6. Manage staff assignments

## Theme Customization

The system supports both light and dark themes with intelligent defaults:

**Features:**
- Toggle between light and dark mode using the theme switcher in the header
- Your theme preference is automatically saved and persists across sessions
- Smooth transitions between themes (supported in Chrome 111+, Edge 111+, and other modern browsers)
- Automatic detection of your system's dark mode preference on first visit
- Zero flash of wrong theme when loading the page

**How It Works:**
- On your first visit, the system automatically detects if you're using dark mode on your device and applies it
- Once you manually switch themes, your preference is saved and will always be used
- The theme loads instantly before the page renders, preventing any visual flash
- Your preference syncs across all browser tabs

## Mobile Access

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Smartphones
- Progressive Web App (PWA) support

## Getting Help

### Support Resources
- User manual (this documentation)
- Video tutorials
- FAQ section
- Live chat support

### Contact Information
- Email: support@campsite-system.com
- Phone: 1-800-CAMPSITE
- Help desk: Available 24/7

## Best Practices

### For Administrators
- Regularly backup data
- Monitor system performance
- Update user permissions
- Review financial reports

### For Staff
- Keep customer information confidential
- Process payments promptly
- Maintain accurate records
- Report technical issues immediately

### For Customers
- Book in advance during peak seasons
- Provide accurate guest counts
- Review cancellation policies
- Contact support for assistance

## System Requirements

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Internet Connection
- Stable internet required
- Offline capabilities for basic operations
- Mobile data support

## Next Steps

1. Complete your profile setup
2. Explore the dashboard
3. Try making a test booking
4. Configure your preferences
5. Invite team members

For more detailed information, see the specific guides for your user role in the following sections.

## Related Documentation

### User Guides by Role

**For Administrators:**
- [User Management Guide](./user-management.md) - Managing users, roles, and permissions
- [Site Management Guide](./site-management.md) - Creating and managing campsites
- [Map Editor Guide](./map-editor.md) - Interactive campground map editor
- [Analytics and Reporting Guide](./analytics-and-reporting.md) - Business intelligence and insights

**For Managers and Staff:**
- [Booking Management Guide](./booking-management.md) - Managing reservations and check-in/out
- [Equipment Management Guide](./equipment-management.md) - Inventory and rental management

**For Customers:**
- [Customer Portal Guide](./customer-portal.md) - Self-service booking and account management

### Technical Documentation
- [API Reference](../api/README.md) - Complete API documentation
- [Development Setup](../development/setup.md) - Developer environment setup
- [WebSocket Events](../api/websocket.md) - Real-time update system
