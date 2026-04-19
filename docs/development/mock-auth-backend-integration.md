# Future Considerations: Mock Auth Backend Integration

## Date: April 2026

## The Problem

When `VITE_USE_MOCK_AUTH=true` is enabled in the frontend, users can log in but authenticated API requests to the backend fail with 401 Unauthorized.

### Root Cause

The mock authentication service generates tokens in this format:
```
mock-access-token-{timestamp}
```

Example: `mock-access-token-1745123456789`

When these tokens are sent to the backend API:
1. The backend's `authenticate` middleware receives the token
2. It attempts to verify it with `jwt.verify(token, secret)`
3. Since the mock token is not a valid JWT, verification fails
4. The backend returns 401 Unauthorized

This affects any authenticated API endpoint, including:
- `/api/v1/maps/:id` (Map Editor)
- Any other protected endpoints

## What Was Done

### 1. Backend Fix (`backend/src/middleware/auth.ts`)

Added mock token bypass in the authenticate middleware:

```typescript
// Token format: mock-access-token-{role}-{userId}
if (token.startsWith('mock-access-token-')) {
  const tokenParts = token.replace('mock-access-token-', '').split('-');
  const role = tokenParts[0]?.toUpperCase();
  const userId = tokenParts[1] || '1';
  
  // Parse role and create appropriate mock user
  // ...
}
```

### 2. Frontend Fix (`frontend/src/services/api/mock-auth.ts`)

Updated token generation to include role info:

```typescript
accessToken: `mock-access-token-${userRecord.user.role.toLowerCase()}-${userRecord.user.id}`
```

Now generates tokens like:
- `mock-access-token-admin-1` (Admin)
- `mock-access-token-staff-3` (Staff)
- `mock-access-token-manager-4` (Manager)
- `mock-access-token-customer-2` (Customer)

## Token Mapping

| Email | Role | Token Format |
|-------|------|--------------|
| admin@campsite.com | ADMIN | `mock-access-token-admin-1` |
| manager@campsite.com | MANAGER | `mock-access-token-manager-4` |
| staff@campsite.com | STAFF | `mock-access-token-staff-3` |
| user@campsite.com | CUSTOMER | `mock-access-token-customer-2` |

## Future Considerations

### Long-term Solution Options

1. **Option A: Real JWT in Mock Auth**
   - Generate actual JWTs in the frontend mock auth
   - Requires sharing JWT secret between frontend and mock auth
   - More realistic but increases complexity

2. **Option B: API Key for Mock Mode**
   - Add a special API key for mock authentication
   - Backend validates this key and bypasses JWT verification
   - Cleaner separation of concerns

3. **Option C: Environment-based Auth Bypass**
   - Add `config.development.skipAuth` flag
   - Completely bypass authentication in development mode
   - Simple but less realistic for demo scenarios

4. **Current Solution (Option D): Token Parsing**
   - Parse role from mock token format
   - Create mock user context in backend
   - Works for demos but requires token format coordination

### Recommended

For production, implement **Option B** (API Key) or **Option A** (Real JWT). The current solution works for demos but relies on a specific token format that could change.

## Related Files

- `frontend/src/services/api/mock-auth.ts` - Mock auth implementation
- `backend/src/middleware/auth.ts` - Authentication middleware
- `docs/development/mock-auth.md` - Original mock auth documentation