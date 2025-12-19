# Campsite Management System Documentation

Welcome to the comprehensive documentation for the Campsite Management System. This documentation covers everything from setup and development to deployment and API usage.

> 💡 **Quick Start**: New to the system? Check out the [Quick Reference Guide](./QUICK_REFERENCE.md) to find exactly what you need.

## 📚 Documentation Structure

### [API Documentation](./api/)
- Complete API reference
- Users API for user management and authentication
- Maps API for interactive map editor
- Equipment API for inventory and rental management
- Analytics API for business intelligence and reporting
- WebSocket real-time events
- Authentication and authorization
- Request/response examples
- Error handling

### [User Guide](./user-guide/)
- [Getting Started Guide](./user-guide/getting-started.md) - Initial setup and overview
- [User Management](./user-guide/user-management.md) - Managing users, roles, and permissions (admin)
- [Site Management](./user-guide/site-management.md) - Creating and managing campsites (admin)
- [Map Editor](./user-guide/map-editor.md) - Interactive campground map editor (admin)
- [Equipment Management](./user-guide/equipment-management.md) - Inventory and rental management
- [Analytics and Reporting](./user-guide/analytics-and-reporting.md) - Business intelligence and reports
- [Booking Management](./user-guide/booking-management.md) - Managing reservations and check-in/out (staff)
- [Customer Portal](./user-guide/customer-portal.md) - Self-service portal for guests
- Feature overview and common workflows

### [Development Guide](./development/)
- [Development Setup](./development/setup.md) - Setup and configuration
- [Mock Authentication](./development/mock-auth.md) - Frontend development without backend
- Environment variables and type-safe configuration
- Architecture overview
- [Routing System](./development/routing.md) - Routing and role-based access control
- [UI Components](./development/ui-components.md) - Component library
- [Responsive Design](./development/responsive-design.md) - Mobile optimization
- Coding standards
- Testing guidelines

### [Deployment Guide](./deployment/)
- Docker deployment
- Production setup
- Environment configuration
- Scaling considerations

### [Database Guide](./database/)
- Schema documentation
- Connection management and pooling
- Migration guides
- Backup and restore
- Performance optimization

## 🚀 Quick Start

1. **Installation**
   ```bash
   npm install
   npm run setup:env
   npm run setup:db
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Production**
   ```bash
   npm run build
   npm run deploy
   ```

## 📖 Key Features

- **Multi-role Authentication**: Admin, Manager, Staff, Customer
- **Real-time Updates**: WebSocket-powered live updates for bookings, payments, notifications, and analytics
- **Real-time Booking System**: Live availability updates with instant notifications
- **Payment Integration**: Stripe payment processing with real-time status updates
- **Interactive Map Editor**: Drag-and-drop campsite management
- **Equipment Rental System**: Inventory management with availability tracking and pricing
- **Comprehensive Reporting**: Analytics and insights with live dashboard updates
- **Mobile Responsive**: PWA with offline capabilities

## 🔗 Quick Links

### API Documentation
- [API Reference](./api/README.md) - Complete API overview
- [Bookings API](./api/bookings.md) - Booking management and operations
- [Users API](./api/users.md) - User management and authentication
- [Maps API](./api/maps.md) - Interactive map editor
- [Equipment API](./api/equipment.md) - Equipment and rentals
- [Analytics API](./api/analytics.md) - Business intelligence
- [WebSocket Events](./api/websocket.md) - Real-time updates

### User Guides
- [Getting Started](./user-guide/getting-started.md) - Quick start guide
- [User Management](./user-guide/user-management.md) - Managing users (admin)
- [Site Management](./user-guide/site-management.md) - Managing sites (admin)
- [Map Editor](./user-guide/map-editor.md) - Interactive map (admin)
- [Equipment Management](./user-guide/equipment-management.md) - Inventory and rentals
- [Analytics and Reporting](./user-guide/analytics-and-reporting.md) - Reports and insights
- [Booking Management](./user-guide/booking-management.md) - Reservations (staff)
- [Customer Portal](./user-guide/customer-portal.md) - Guest self-service

### Development Guides
- [Development Setup](./development/setup.md) - Environment setup
- [Mock Authentication](./development/mock-auth.md) - Frontend development without backend
- [Routing System](./development/routing.md) - Navigation and routes
- [UI Components](./development/ui-components.md) - Component library
- [Responsive Design](./development/responsive-design.md) - Mobile optimization
- [Frontend Configuration](../frontend/CONFIG.md) - Frontend config

## 🆘 Support

- **Issues**: Report bugs and request features
- **Documentation**: Contribute to documentation
- **Community**: Join our community discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🎉 Project Status

**Frontend Implementation: Complete** ✅

All 20 major frontend implementation tasks have been completed, including:
- Core infrastructure and service layer
- Complete UI component library
- All user-facing features (booking, payments, equipment, analytics)
- Responsive design and mobile optimization
- Accessibility features (WCAG 2.1 AA compliant)
- Progressive Web App capabilities
- Error handling and monitoring
- Comprehensive testing and security audit

The system is production-ready with full feature parity across all user roles (Admin, Manager, Staff, Customer).

---

*Last updated: 2025-10-14*
