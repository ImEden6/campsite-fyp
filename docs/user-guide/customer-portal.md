# Customer Portal Guide

This guide covers the customer self-service portal features, including the dashboard, booking management, profile settings, and notifications.

## Overview

The Customer Portal provides a personalized experience for campsite guests to:
- View upcoming and past bookings
- Manage reservations
- Process payments and view receipts
- Update profile information
- Receive notifications
- Access QR codes for check-in

## Accessing the Customer Portal

### Login

**URL**: `/login`

1. Enter your email address
2. Enter your password
3. Click **"Sign In"**

### Registration

**URL**: `/register`

New customers can create an account:

1. Click **"Create Account"** on login page
2. Fill in registration form:
   - First Name
   - Last Name
   - Email Address
   - Phone Number
   - Password (minimum 8 characters)
   - Confirm Password
3. Accept terms and conditions
4. Click **"Register"**
5. Verify email address (check inbox)
6. Log in with new credentials

### Password Reset

Forgot your password?

1. Click **"Forgot Password"** on login page
2. Enter your email address
3. Click **"Send Reset Link"**
4. Check email for reset instructions
5. Click link in email
6. Enter new password
7. Confirm new password
8. Log in with new password

## Customer Dashboard

### Accessing Dashboard

**Navigation**: Automatically shown after login

**URL**: `/dashboard`

### Dashboard Overview

The dashboard displays:

#### Upcoming Bookings
- Next 3 upcoming reservations
- Check-in and check-out dates
- Site information
- Days until arrival
- Quick actions (view details, modify, cancel)

#### Quick Stats
- Total bookings (lifetime)
- Active reservations
- Loyalty points (if applicable)
- Upcoming check-ins

#### Quick Actions
- **Book Now**: Start new booking
- **Browse Sites**: View available sites
- **My Bookings**: View all reservations
- **Profile**: Update account information

#### Recent Activity
- Recent bookings
- Payment history
- Profile updates
- Notifications

## My Bookings

### Accessing Bookings

**Navigation**: Dashboard → My Bookings

**URL**: `/my-bookings`

### Booking List

View all your bookings:

#### Filters
- **Status**: All, Upcoming, Past, Cancelled
- **Date Range**: Custom date range
- **Site Type**: Filter by site category

#### Booking Cards

Each booking displays:
- Site name and number
- Check-in and check-out dates
- Number of nights
- Guest count
- Total cost
- Booking status badge
- Quick actions menu

### Booking Status

- 🟢 **Confirmed**: Booking confirmed, payment received
- 🟡 **Pending**: Awaiting payment or confirmation
- 🔵 **Checked In**: Currently staying
- ✅ **Completed**: Stay completed
- 🔴 **Cancelled**: Booking cancelled

### Viewing Booking Details

Click any booking to view:

#### Booking Information
- Booking ID and confirmation number
- Check-in and check-out dates
- Site details and location
- Guest information
- Vehicle details
- Special requests

#### Equipment Rentals
- Rented equipment list
- Quantities and rental periods
- Rental costs
- Equipment status

#### Payment Information
- Total cost breakdown
- Payment method
- Payment status
- Transaction history
- Download receipt

#### QR Code
- Check-in QR code
- Instructions for use
- Save to mobile wallet

## Modifying Bookings

### Changing Dates

To modify booking dates:

1. Open booking details
2. Click **"Modify Booking"**
3. Select new check-in date
4. Select new check-out date
5. System checks availability
6. Review price difference
7. Process additional payment or receive refund
8. Confirm changes

### Changing Site

To change to a different site:

1. Open booking details
2. Click **"Change Site"**
3. View available alternative sites
4. Select new site
5. Review price difference
6. Process payment adjustment
7. Confirm change

### Adding Equipment

To add equipment rentals:

1. Open booking details
2. Click **"Add Equipment"**
3. Browse available equipment
4. Select items and quantities
5. Choose rental period
6. Review additional cost
7. Process payment
8. Confirm addition

### Modification Restrictions

Note: Modifications may not be available:
- Within 48 hours of check-in
- For completed bookings
- For cancelled bookings
- If no alternative sites available

## Cancelling Bookings

### Cancellation Process

1. Open booking details
2. Click **"Cancel Booking"**
3. Review cancellation policy
4. View refund amount
5. Select cancellation reason (optional)
6. Confirm cancellation
7. Receive cancellation confirmation email

### Refund Policy

Standard refund schedule:
- **30+ days before check-in**: 100% refund (minus processing fee)
- **14-29 days before**: 50% refund
- **7-13 days before**: 25% refund
- **Less than 7 days**: No refund
- **No-show**: No refund

### Refund Processing

- Refunds processed to original payment method
- Allow 5-10 business days for refund
- Email confirmation sent
- View refund status in payment history

## Payment Management

### Payment Methods

Accepted payment methods:
- Credit cards (Visa, Mastercard, Amex, Discover)
- Debit cards
- Digital wallets (Apple Pay, Google Pay)

### Making Payments

For pending bookings:

1. Open booking details
2. Click **"Pay Now"**
3. Enter payment information
4. Review payment amount
5. Click **"Process Payment"**
6. Receive payment confirmation

### Payment History

View all transactions:

**Navigation**: Profile → Payment History

**URL**: `/payments`

#### Transaction List
- Date and time
- Booking reference
- Amount
- Payment method
- Status
- Receipt download

### Downloading Receipts

1. Navigate to Payment History
2. Locate transaction
3. Click **"Download Receipt"**
4. Receipt downloads as PDF

## Profile Management

### Accessing Profile

**Navigation**: User Menu → Profile

**URL**: `/profile`

### Personal Information

Update your details:
- First Name
- Last Name
- Email Address (requires verification)
- Phone Number
- Date of Birth
- Address

### Profile Photo

Upload or change profile picture:

1. Click on current avatar
2. Click **"Upload Photo"**
3. Select image file (JPG, PNG, max 5MB)
4. Crop and adjust
5. Save changes

### Password Change

Update your password:

1. Navigate to Profile → Security
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click **"Update Password"**

### Email Preferences

Manage email notifications:
- Booking confirmations
- Check-in reminders
- Special offers and promotions
- Newsletter
- System updates

### Account Deletion

To delete your account:

1. Navigate to Profile → Account
2. Click **"Delete Account"**
3. Review consequences
4. Enter password to confirm
5. Confirm deletion

**Warning**: This action cannot be undone. All data will be permanently deleted.

## Notifications

### Notification Center

**Navigation**: Bell icon in header

**URL**: `/notifications`

### Notification Types

- 🔔 **Booking Confirmations**: New booking created
- 📅 **Check-in Reminders**: Upcoming arrival
- 💳 **Payment Confirmations**: Payment processed
- ✏️ **Booking Updates**: Modifications confirmed
- ❌ **Cancellations**: Booking cancelled
- 🎁 **Promotions**: Special offers
- ⚠️ **Important Updates**: System announcements

### Managing Notifications

#### Mark as Read
- Click on notification to mark as read
- Click **"Mark All as Read"** for bulk action

#### Filter Notifications
- All notifications
- Unread only
- By type (bookings, payments, promotions)

#### Delete Notifications
- Swipe left on notification (mobile)
- Click trash icon (desktop)
- Click **"Clear All"** to remove all

### Notification Settings

Configure notification preferences:

1. Navigate to Profile → Notifications
2. Toggle notification types:
   - Email notifications
   - Push notifications (if PWA installed)
   - SMS notifications (if enabled)
3. Set quiet hours (no notifications)
4. Save preferences

## QR Code Check-In

### Accessing QR Code

1. Open booking details
2. Scroll to QR Code section
3. QR code displayed with booking info

### Using QR Code

At check-in:
1. Show QR code to staff
2. Staff scans code
3. Booking verified instantly
4. Receive site information

### Self-Service Check-In

If available:
1. Locate QR code scanner at entrance
2. Scan your QR code
3. System verifies booking
4. Receive digital welcome packet
5. Site access granted

### Saving QR Code

Save to mobile wallet:
- **iPhone**: Add to Apple Wallet
- **Android**: Add to Google Pay
- **Screenshot**: Save image to photos

## Mobile App Features

### Progressive Web App (PWA)

Install the mobile app:

#### iPhone
1. Open site in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Tap "Add"

#### Android
1. Open site in Chrome
2. Tap menu (three dots)
3. Select "Add to Home Screen"
4. Tap "Add"

### Offline Access

With PWA installed:
- View booking details offline
- Access QR codes without internet
- View saved receipts
- Read notifications

### Push Notifications

Enable push notifications:
1. Install PWA
2. Allow notifications when prompted
3. Configure preferences in Profile

## Loyalty Program

### Earning Points

Earn points for:
- Completed bookings (1 point per $1 spent)
- Referrals (bonus points)
- Reviews and feedback
- Social media shares

### Redeeming Points

Use points for:
- Booking discounts
- Free equipment rentals
- Upgrade to premium sites
- Gift cards

### Viewing Points Balance

Check your points:
- Dashboard widget
- Profile → Loyalty Program
- Booking checkout (apply points)

## Special Offers

### Viewing Offers

**Navigation**: Dashboard → Special Offers

Available offers:
- Early bird discounts
- Last-minute deals
- Seasonal promotions
- Loyalty member exclusives
- Referral bonuses

### Applying Offers

At checkout:
1. Enter promo code
2. Click **"Apply"**
3. Discount applied to total
4. Complete booking

## Support and Help

### Help Center

**Navigation**: User Menu → Help

Access:
- FAQs
- Video tutorials
- User guides
- Contact information

### Contacting Support

#### Live Chat
- Click chat icon in bottom-right
- Available 24/7
- Average response time: 2 minutes

#### Email Support
- Email: support@campsite.com
- Response within 24 hours

#### Phone Support
- Call: 1-800-CAMPSITE
- Available 8 AM - 10 PM daily

### Feedback

Share your experience:
1. Navigate to Profile → Feedback
2. Rate your experience
3. Provide comments
4. Submit feedback

## Best Practices

### Booking Tips
- Book early for peak seasons
- Check cancellation policy before booking
- Add equipment rentals during booking (better rates)
- Save QR code to mobile wallet
- Set check-in reminders

### Account Security
- Use strong, unique password
- Enable two-factor authentication (if available)
- Don't share login credentials
- Log out on shared devices
- Review account activity regularly

### Communication
- Keep email address updated
- Enable important notifications
- Check notifications before arrival
- Respond to campground messages promptly
- Provide accurate contact information

## Troubleshooting

### Can't Log In

#### Common Login Issues

**"Cannot connect to server" error:**
- Check your internet connection
- Verify the backend server is running (for development environments)
- Try refreshing the page
- Contact support if issue persists

**"Invalid email or password" error:**
- Verify email and password are correct
- Check caps lock is off
- Ensure no extra spaces in email
- Try password reset if needed

**"Login endpoint not found" error:**
- This indicates a configuration issue
- Contact system administrator
- Verify backend API is properly configured

**"Invalid response from server" error:**
- Backend may be misconfigured
- Contact system administrator
- Try again in a few minutes

**General troubleshooting steps:**
- Clear browser cache and cookies
- Try a different browser
- Disable browser extensions temporarily
- Check if JavaScript is enabled
- Contact support with error message details

### Booking Not Showing
- Refresh the page
- Check email for confirmation
- Verify booking dates
- Contact support with booking ID

### Payment Failed
- Verify card information
- Check card balance
- Try different payment method
- Contact your bank
- Contact support

### QR Code Not Scanning
- Increase screen brightness
- Clean camera lens
- Try different angle
- Show booking ID to staff
- Request manual check-in

## Privacy and Security

### Data Protection
- All data encrypted in transit and at rest
- PCI DSS compliant payment processing
- Regular security audits
- GDPR compliant

### Your Rights
- Access your data
- Export your data
- Delete your account
- Opt out of marketing
- Update preferences anytime

## Related Documentation

- [Getting Started Guide](./getting-started.md)
- [Booking Management](./booking-management.md)
- [Equipment Management](./equipment-management.md)
- [Payment Processing](./payment-processing.md)

---

*Last updated: 2025-10-14*
