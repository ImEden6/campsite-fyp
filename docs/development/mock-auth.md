# Mock Authentication Service

The mock authentication service provides a simulated backend authentication system for frontend development without requiring a running backend server.

## Overview

Located at `frontend/src/services/api/mock-auth.ts`, this service allows developers to:
- Develop and test UI components independently
- Prototype authentication flows
- Create demos without backend dependencies
- Speed up frontend development iteration

## Configuration

### Enable Mock Auth

Add to `frontend/.env`:
```env
VITE_USE_MOCK_AUTH=true
```

### Disable Mock Auth (Default)

```env
VITE_USE_MOCK_AUTH=false
```

Or simply remove the variable from your `.env` file.

## Mock Users

The service includes two predefined test accounts:

### Admin Account
- **Email**: `admin@campsite.com`
- **Password**: `admin123`
- **Role**: `ADMIN`
- **Permissions**: Full system access

### Customer Account
- **Email**: `user@campsite.com`
- **Password**: `user123`
- **Role**: `CUSTOMER`
- **Permissions**: Customer portal access

## Usage

### Automatic Integration

The mock auth service integrates automatically with the authentication store when enabled. No code changes are required in your components.

### Manual Usage

```typescript
import { mockLogin, shouldUseMockAuth } from '@/services/api/mock-auth';

// Check if mock auth is enabled
if (shouldUseMockAuth()) {
  try {
    const response = await mockLogin(email, password);
    console.log('User:', response.user);
    console.log('Tokens:', response.tokens);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}
```

### Response Structure

The mock login returns the same structure as the production API:

```typescript
interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

## Features

### Realistic Behavior

- **Network Delay**: 500ms simulated delay to mimic real API calls
- **Error Handling**: Proper error messages for invalid credentials
- **Type Safety**: Fully typed responses matching production API
- **Token Generation**: Mock tokens with timestamps for testing

### Security

- **Development Only**: Automatically disabled in production builds
- **No Real Authentication**: Does not connect to any backend
- **Local Only**: All data stored in memory, no persistence

## When to Use

### ✅ Good Use Cases

- Frontend component development
- UI/UX prototyping and testing
- Demo environments
- Offline development
- Component library development (Storybook, etc.)

### ❌ Not Suitable For

- Production environments
- Integration testing with real backend
- Security testing
- Performance testing
- End-to-end testing

## Limitations

1. **No Persistence**: User data is not saved between sessions
2. **Limited Users**: Only two predefined accounts available
3. **No Registration**: Cannot create new mock users at runtime
4. **No Token Refresh**: Mock tokens don't expire or refresh
5. **No Backend Validation**: All validation happens client-side

## Extending Mock Auth

To add more mock users, edit `frontend/src/services/api/mock-auth.ts`:

```typescript
const mockUsers: Record<string, { user: User; password: string }> = {
  'admin@campsite.com': { /* ... */ },
  'user@campsite.com': { /* ... */ },
  // Add your custom user here
  'manager@campsite.com': {
    password: 'manager123',
    user: {
      id: '3',
      email: 'manager@campsite.com',
      firstName: 'Jane',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};
```

## Troubleshooting

### Mock Auth Not Working

1. **Check Environment Variable**:
   ```bash
   # Verify in frontend/.env
   VITE_USE_MOCK_AUTH=true
   ```

2. **Restart Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check Console**:
   Look for any error messages in the browser console

### Still Connecting to Backend

If the app still tries to connect to the backend:
- Ensure `VITE_USE_MOCK_AUTH=true` (not `"true"` with quotes)
- Clear browser cache and reload
- Check that you're in development mode (`import.meta.env.DEV` is true)

### Invalid Credentials Error

Make sure you're using the exact credentials:
- Email: `admin@campsite.com` (not `admin@example.com`)
- Password: `admin123` (case-sensitive)

## Related Documentation

- [Development Setup Guide](./setup.md) - Complete development environment setup
- [API Documentation](../api/README.md) - Production API reference
- [Authentication Store](../../frontend/src/stores/authStore.ts) - Auth state management
