# User Management Guide

This guide covers how to manage users in the Campsite Management System, including creating accounts, managing roles, tracking activity, and handling user permissions.

## Overview

The User Management feature allows administrators to:
- Create and manage user accounts
- Assign and modify user roles
- Activate or deactivate accounts
- Reset passwords
- Track user activity and login history
- Manage user profiles and avatars

## User Roles

The system supports four user roles, each with different permissions:

### Admin
- Full system access
- User management (create, edit, delete users)
- Role assignment
- System configuration
- All manager and staff permissions

### Manager
- Campsite operations management
- Booking management
- Reporting and analytics
- Staff oversight
- All staff permissions

### Staff
- Day-to-day operations
- Check-in/check-out
- Customer service
- Booking assistance
- Equipment management

### Customer
- Self-service booking portal
- Account management
- Booking history
- Payment management
- Equipment rentals

## Accessing User Management

**Navigation**: Admin Menu → User Management

**Requirements**: Admin role required

**URL**: `/admin/users`

## User List

The user list displays all users in the system with the following information:

### Displayed Information
- **Avatar**: User profile picture
- **Name**: First and last name
- **Email**: User email address
- **Role**: User role badge (color-coded)
- **Status**: Active/Inactive indicator
- **Email Verified**: Verification status
- **Phone**: Contact number
- **Last Login**: Most recent login timestamp

### Filtering Users

Use the filter controls to narrow down the user list:

#### Search
- Search by name or email
- Real-time search as you type
- Case-insensitive matching

#### Role Filter
- All Roles (default)
- Admin
- Manager
- Staff
- Customer

#### Status Filter
- All Status (default)
- Active
- Inactive

#### Email Verification Filter
- All (default)
- Verified
- Unverified

#### Reset Filters
Click "Reset Filters" to clear all active filters and return to the full user list.

## Creating a New User

### Steps to Create a User

1. Click the **"Add User"** button in the top-right corner
2. Fill in the user creation form:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email** (required, must be unique)
   - **Phone** (optional, format: +1234567890)
   - **Role** (required, select from dropdown)
   - **Password** (required, minimum 8 characters)
   - **Active Status** (checkbox, checked by default)
3. Click **"Create User"** to save

### Password Requirements
- Minimum 8 characters
- Should include a mix of letters, numbers, and special characters
- User will be required to change password on first login (if configured)

### Email Validation
- Must be a valid email format
- Must be unique in the system
- Cannot be changed after account creation

### Success
- User account is created immediately
- User receives a welcome email (if configured)
- User appears in the user list
- Success notification is displayed

## Editing a User

### Steps to Edit a User

1. Locate the user in the user list
2. Click the **three-dot menu** (⋮) in the Actions column
3. Select **"Edit"** from the dropdown menu
4. Modify the user information:
   - First Name
   - Last Name
   - Phone
   - Role
   - Active Status
5. Click **"Update User"** to save changes

### Notes
- Email address cannot be changed after account creation
- Role changes take effect immediately
- Status changes affect login ability immediately

## Managing User Status

### Activating/Deactivating Users

#### To Deactivate a User
1. Click the three-dot menu (⋮) for the user
2. Select **"Deactivate"**
3. Confirm the action in the dialog
4. User is immediately logged out of all sessions
5. User cannot log in until reactivated

#### To Activate a User
1. Click the three-dot menu (⋮) for the user
2. Select **"Activate"**
3. User can immediately log in again

### When to Deactivate
- Employee termination
- Temporary suspension
- Security concerns
- Account compromise

### Effects of Deactivation
- User cannot log in
- All active sessions are terminated
- User data is preserved
- Bookings and history remain intact
- Can be reactivated at any time

## Password Management

### Resetting User Passwords

#### Admin Password Reset
1. Click the three-dot menu (⋮) for the user
2. Select **"Reset Password"**
3. Confirm the action
4. System sends a password reset email to the user
5. User receives a secure link to set a new password

#### Password Reset Email
The email contains:
- Secure reset link (expires in 24 hours)
- Instructions for setting a new password
- Security notice

### User Self-Service Password Reset
Users can reset their own passwords:
1. Click "Forgot Password" on login page
2. Enter email address
3. Receive reset email
4. Follow link to set new password

## Deleting a User

### Steps to Delete a User

1. Click the three-dot menu (⋮) for the user
2. Select **"Delete"**
3. Confirm the deletion in the dialog
4. User account is permanently removed

### Warning
- **This action cannot be undone**
- All user data is permanently deleted
- Associated bookings may be affected
- Consider deactivating instead of deleting

### When to Delete
- Duplicate accounts
- Test accounts
- Spam/fraudulent accounts
- User requests account deletion (GDPR compliance)

## User Activity Tracking

### Activity Log
Track all user actions in the system:
- Login/logout events
- Booking creation and modifications
- Payment transactions
- Profile updates
- Administrative actions

### Login History
View detailed login history:
- Login timestamp
- IP address
- User agent (browser/device)
- Success/failure status
- Geographic location (if available)

### Accessing Activity Data
Activity tracking is available through the Users API:
```typescript
// Get user activity log
const activityLog = await getUserActivityLog(userId, page, limit);

// Get login history
const loginHistory = await getUserLoginHistory(userId, page, limit);
```

## Email Verification

### Manual Verification
Admins can manually verify user emails:
1. Locate the user with unverified email
2. Click the three-dot menu (⋮)
3. Select **"Verify Email"**
4. Email is marked as verified

### Automatic Verification
Users receive verification emails:
1. User registers or email is changed
2. Verification email is sent
3. User clicks verification link
4. Email is automatically verified

### Verification Status
- **Verified**: Green checkmark icon
- **Unverified**: Red X icon
- Filter users by verification status

## Avatar Management

### Uploading Avatars
Users can upload profile pictures:
- Supported formats: JPEG, PNG, GIF
- Maximum file size: 5MB
- Recommended size: 200x200 pixels
- Automatically resized and optimized

### Deleting Avatars
- Users can remove their avatar
- Admins can remove any user's avatar
- Default avatar is displayed when none is set

## Best Practices

### User Creation
- Use strong passwords for initial setup
- Verify email addresses before granting access
- Assign the minimum required role
- Document the reason for account creation

### Role Assignment
- Follow the principle of least privilege
- Review roles regularly
- Document role changes
- Audit admin access quarterly

### Security
- Deactivate accounts immediately upon termination
- Monitor login history for suspicious activity
- Enforce password complexity requirements
- Enable two-factor authentication (if available)
- Review user activity logs regularly

### Data Privacy
- Only collect necessary user information
- Respect user privacy preferences
- Comply with GDPR and data protection laws
- Provide users with data export options
- Honor account deletion requests promptly

## Troubleshooting

### User Cannot Log In
1. Check if account is active
2. Verify email is correct
3. Check if email is verified (if required)
4. Review login history for failed attempts
5. Reset password if needed

### Email Not Received
1. Check spam/junk folder
2. Verify email address is correct
3. Check email server logs
4. Resend verification/reset email
5. Contact system administrator

### Role Changes Not Taking Effect
1. User must log out and log back in
2. Clear browser cache
3. Check for active sessions
4. Verify role was saved correctly

### Activity Log Not Showing
1. Check date range filters
2. Verify user has activity
3. Check pagination settings
4. Refresh the page

## Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus search box
- **Ctrl/Cmd + N**: Add new user
- **Esc**: Close modal/dialog
- **Tab**: Navigate form fields
- **Enter**: Submit form

## Related Documentation

- [Users API Documentation](../api/users.md) - Complete API reference
- [Getting Started Guide](./getting-started.md) - Initial setup
- [Development: Authentication](../development/authentication.md) - Technical details

## Support

For additional help with user management:
- Check the [API Documentation](../api/users.md)
- Review the [FAQ](./faq.md)
- Contact system administrator
- Submit a support ticket

---

*Last updated: 2025-10-14*
