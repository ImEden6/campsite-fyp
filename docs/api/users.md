# Users API Documentation

This document describes the Users API service for the frontend application. The service provides comprehensive user management functionality including CRUD operations, role management, activity tracking, and authentication features.

## Overview

The Users API service (`frontend/src/services/api/users.ts`) handles all user management operations for the Campsite Management System. It provides type-safe methods for:

- User CRUD operations
- Role and status management
- Password management and resets
- Activity and login history tracking
- Avatar upload and management
- Email verification

## API Methods

### User Retrieval

#### `getUsers(filters?: UserFilters): Promise<User[]>`

Get all users with optional filtering.

**Parameters:**
- `filters` (optional): Filter criteria
  - `role?: UserRole[]` - Filter by user roles
  - `isActive?: boolean` - Filter by active status
  - `searchTerm?: string` - Search by name or email
  - `isEmailVerified?: boolean` - Filter by email verification status

**Returns:** Array of users matching the filters

**Example:**
```typescript
import { getUsers } from '@/services/api/users';

// Get all active admins
const admins = await getUsers({
  role: ['ADMIN'],
  isActive: true
});

// Search for users
const results = await getUsers({
  searchTerm: 'john'
});
```

#### `getUsersPaginated(page?: number, limit?: number, filters?: UserFilters): Promise<PaginatedResponse<User>>`

Get paginated list of users with optional filtering.

**Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 10): Items per page
- `filters` (optional): Same as `getUsers`

**Returns:** Paginated response with users and metadata

**Example:**
```typescript
const response = await getUsersPaginated(1, 20, {
  role: ['STAFF', 'MANAGER'],
  isActive: true
});

console.log(response.data); // User[]
console.log(response.pagination); // { page, limit, total, totalPages }
```

#### `getUserById(id: string): Promise<User>`

Get a specific user by ID.

**Parameters:**
- `id`: User ID

**Returns:** User object

**Example:**
```typescript
const user = await getUserById('user-123');
```

#### `getCurrentUser(): Promise<User>`

Get the currently authenticated user's profile.

**Returns:** Current user object

**Example:**
```typescript
const currentUser = await getCurrentUser();
```

### User Creation and Updates

#### `createUser(userData: CreateUserData): Promise<User>`

Create a new user (Admin only).

**Parameters:**
- `userData`: User creation data
  - `email: string` - User email (unique)
  - `firstName: string` - First name
  - `lastName: string` - Last name
  - `phone?: string` - Phone number (optional)
  - `role: UserRole` - User role (ADMIN, MANAGER, STAFF, CUSTOMER)
  - `password: string` - Initial password

**Returns:** Created user object

**Example:**
```typescript
const newUser = await createUser({
  email: 'staff@campsite.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'STAFF',
  password: 'SecurePassword123!'
});
```

#### `updateUser(id: string, userData: UpdateUserData): Promise<User>`

Update user information.

**Parameters:**
- `id`: User ID
- `userData`: Fields to update
  - `firstName?: string`
  - `lastName?: string`
  - `phone?: string`
  - `role?: UserRole`
  - `isActive?: boolean`

**Returns:** Updated user object

**Example:**
```typescript
const updated = await updateUser('user-123', {
  firstName: 'Jane',
  phone: '+1987654321'
});
```

#### `updateUserStatus(id: string, isActive: boolean): Promise<User>`

Activate or deactivate a user account.

**Parameters:**
- `id`: User ID
- `isActive`: Active status (true = active, false = deactivated)

**Returns:** Updated user object

**Example:**
```typescript
// Deactivate user
await updateUserStatus('user-123', false);

// Reactivate user
await updateUserStatus('user-123', true);
```

#### `updateUserRole(id: string, role: UserRole): Promise<User>`

Update a user's role (Admin only).

**Parameters:**
- `id`: User ID
- `role`: New role (ADMIN, MANAGER, STAFF, CUSTOMER)

**Returns:** Updated user object

**Example:**
```typescript
// Promote staff to manager
await updateUserRole('user-123', 'MANAGER');
```

### Password Management

#### `updateUserPassword(id: string, passwordData: UpdateUserPasswordData): Promise<void>`

Update a user's password.

**Parameters:**
- `id`: User ID
- `passwordData`:
  - `currentPassword?: string` - Current password (required for self-update)
  - `newPassword: string` - New password

**Example:**
```typescript
// User changing their own password
await updateUserPassword('user-123', {
  currentPassword: 'OldPassword123!',
  newPassword: 'NewPassword456!'
});

// Admin resetting password (no current password needed)
await updateUserPassword('user-123', {
  newPassword: 'AdminResetPassword789!'
});
```

#### `resetUserPassword(id: string): Promise<{ temporaryPassword: string }>`

Generate a temporary password for a user (Admin only).

**Parameters:**
- `id`: User ID

**Returns:** Object containing the temporary password

**Example:**
```typescript
const { temporaryPassword } = await resetUserPassword('user-123');
console.log(`Temporary password: ${temporaryPassword}`);
// Send this to the user via secure channel
```

#### `sendPasswordResetEmail(userId: string): Promise<void>`

Send a password reset email to a user.

**Parameters:**
- `userId`: User ID

**Example:**
```typescript
await sendPasswordResetEmail('user-123');
// User will receive email with reset link
```

### User Deletion

#### `deleteUser(id: string): Promise<void>`

Delete a user account (Admin only).

**Parameters:**
- `id`: User ID

**Example:**
```typescript
await deleteUser('user-123');
```

### Activity Tracking

#### `getUserActivityLog(userId: string, page?: number, limit?: number): Promise<PaginatedResponse<UserActivityLog>>`

Get a user's activity log.

**Parameters:**
- `userId`: User ID
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page

**Returns:** Paginated activity log entries

**Activity Log Entry:**
```typescript
interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

**Example:**
```typescript
const activityLog = await getUserActivityLog('user-123', 1, 50);

activityLog.data.forEach(entry => {
  console.log(`${entry.createdAt}: ${entry.action} - ${entry.description}`);
});
```

#### `getUserLoginHistory(userId: string, page?: number, limit?: number): Promise<PaginatedResponse<LoginHistoryEntry>>`

Get a user's login history.

**Parameters:**
- `userId`: User ID
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page

**Returns:** Paginated login history entries

**Login History Entry:**
```typescript
interface LoginHistoryEntry {
  id: string;
  userId: string;
  loginAt: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}
```

**Example:**
```typescript
const loginHistory = await getUserLoginHistory('user-123');

loginHistory.data.forEach(entry => {
  const status = entry.success ? '✓' : '✗';
  console.log(`${status} ${entry.loginAt} from ${entry.ipAddress}`);
});
```

### Email Verification

#### `verifyUserEmail(userId: string): Promise<User>`

Manually verify a user's email address (Admin only).

**Parameters:**
- `userId`: User ID

**Returns:** Updated user object with verified email

**Example:**
```typescript
const verifiedUser = await verifyUserEmail('user-123');
console.log(verifiedUser.isEmailVerified); // true
```

### Avatar Management

#### `uploadUserAvatar(userId: string, file: File): Promise<User>`

Upload a user avatar image.

**Parameters:**
- `userId`: User ID
- `file`: Image file (JPEG, PNG, etc.)

**Returns:** Updated user object with avatar URL

**Example:**
```typescript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const updatedUser = await uploadUserAvatar('user-123', file);
console.log(updatedUser.avatarUrl);
```

#### `deleteUserAvatar(userId: string): Promise<User>`

Delete a user's avatar image.

**Parameters:**
- `userId`: User ID

**Returns:** Updated user object with null avatar

**Example:**
```typescript
await deleteUserAvatar('user-123');
```

## React Query Integration

### Custom Hooks

Here are recommended custom hooks for using the Users API with React Query:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '@/services/api/users';

// Query keys factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: usersApi.UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
  activity: (id: string) => [...userKeys.detail(id), 'activity'] as const,
  loginHistory: (id: string) => [...userKeys.detail(id), 'login-history'] as const,
};

// Get all users
export const useUsers = (filters?: usersApi.UserFilters) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.getUsers(filters),
  });
};

// Get paginated users
export const useUsersPaginated = (
  page: number,
  limit: number,
  filters?: usersApi.UserFilters
) => {
  return useQuery({
    queryKey: [...userKeys.list(filters), 'paginated', page, limit],
    queryFn: () => usersApi.getUsersPaginated(page, limit, filters),
    keepPreviousData: true,
  });
};

// Get user by ID
export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: usersApi.getCurrentUser,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: usersApi.UpdateUserData }) =>
      usersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Update user status mutation
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateUserStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

// Get user activity log
export const useUserActivityLog = (userId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: [...userKeys.activity(userId), page, limit],
    queryFn: () => usersApi.getUserActivityLog(userId, page, limit),
    enabled: !!userId,
    keepPreviousData: true,
  });
};

// Get user login history
export const useUserLoginHistory = (userId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: [...userKeys.loginHistory(userId), page, limit],
    queryFn: () => usersApi.getUserLoginHistory(userId, page, limit),
    enabled: !!userId,
    keepPreviousData: true,
  });
};
```

## Component Examples

### User List Component

```typescript
import { useUsersPaginated } from '@/hooks/useUsers';
import { UserFilters } from '@/services/api/users';

export const UserList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({});
  
  const { data, isLoading, error } = useUsersPaginated(page, 20, filters);
  
  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;
  
  return (
    <div>
      <UserFilters onChange={setFilters} />
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map(user => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              <td>
                <button onClick={() => handleEdit(user.id)}>Edit</button>
                <button onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination
        currentPage={page}
        totalPages={data?.pagination.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
};
```

### User Profile Component

```typescript
import { useCurrentUser, useUpdateUser, useUploadAvatar } from '@/hooks/useUsers';

export const UserProfile = () => {
  const { data: user, isLoading } = useCurrentUser();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  
  const handleSubmit = async (formData: UpdateUserData) => {
    await updateUser.mutateAsync({
      id: user!.id,
      data: formData
    });
  };
  
  const handleAvatarUpload = async (file: File) => {
    await uploadAvatar.mutateAsync({
      userId: user!.id,
      file
    });
  };
  
  if (isLoading) return <div>Loading profile...</div>;
  
  return (
    <div>
      <AvatarUpload
        currentAvatar={user?.avatarUrl}
        onUpload={handleAvatarUpload}
      />
      
      <UserForm
        initialData={user}
        onSubmit={handleSubmit}
        isLoading={updateUser.isLoading}
      />
    </div>
  );
};
```

### User Activity Log Component

```typescript
import { useUserActivityLog } from '@/hooks/useUsers';

export const UserActivityLog = ({ userId }: { userId: string }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUserActivityLog(userId, page, 50);
  
  if (isLoading) return <div>Loading activity...</div>;
  
  return (
    <div>
      <h3>Activity Log</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Action</th>
            <th>Description</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map(entry => (
            <tr key={entry.id}>
              <td>{new Date(entry.createdAt).toLocaleString()}</td>
              <td>{entry.action}</td>
              <td>{entry.description}</td>
              <td>{entry.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination
        currentPage={page}
        totalPages={data?.pagination.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
};
```

## Type Definitions

### User

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER';
```

### Request Types

```typescript
interface UserFilters {
  role?: UserRole[];
  isActive?: boolean;
  searchTerm?: string;
  isEmailVerified?: boolean;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  password: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface UpdateUserPasswordData {
  currentPassword?: string;
  newPassword: string;
}
```

## Error Handling

All API methods may throw errors that should be handled appropriately:

```typescript
try {
  const user = await createUser(userData);
  toast.success('User created successfully');
} catch (error) {
  if (error.response?.status === 409) {
    toast.error('Email already exists');
  } else if (error.response?.status === 403) {
    toast.error('Insufficient permissions');
  } else {
    toast.error('Failed to create user');
  }
}
```

Common error codes:
- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - User not found
- `409` - Conflict (email already exists)
- `500` - Server error

## Best Practices

1. **Use React Query hooks** for automatic caching and refetching
2. **Implement optimistic updates** for better UX on mutations
3. **Handle loading and error states** in all components
4. **Validate user input** before API calls
5. **Use proper TypeScript types** for type safety
6. **Implement proper error handling** with user-friendly messages
7. **Cache user data** appropriately to reduce API calls
8. **Invalidate queries** after mutations to keep data fresh
9. **Use pagination** for large user lists
10. **Implement proper access control** based on user roles

## Related Documentation

- [API Client Documentation](./README.md)
- [WebSocket Events](./websocket.md)
- [User Management Guide](../user-guide/user-management.md)
- [Authentication Documentation](../development/authentication.md)

---

*Last updated: 2025-10-14*
