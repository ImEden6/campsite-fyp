/**
 * UserManagementPage
 * Admin page for managing users
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  sendPasswordResetEmail,
} from '@/services/api/users';
import { CreateUserData, UpdateUserData } from '@/types';
import { UserTable, UserForm, UserFilters, UserFormData, UserFilterValues } from '@/features/users/components';
import { useToast } from '@/hooks/useToast';
import { Plus, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [filters, setFilters] = useState<UserFilterValues>({
    searchTerm: '',
    role: 'ALL',
    isActive: 'ALL',
    isEmailVerified: 'ALL',
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User created successfully', 'success');
      setShowForm(false);
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to create user', 'error');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User updated successfully', 'success');
      setShowForm(false);
      setSelectedUser(undefined);
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update user', 'error');
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast(
        `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to update user status', 'error');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to delete user', 'error');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => sendPasswordResetEmail(userId),
    onSuccess: () => {
      showToast('Password reset email sent successfully', 'success');
    },
    onError: (error: unknown) => {
      showToast(error instanceof Error ? error.message : 'Failed to send password reset email', 'error');
    },
  });

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.role !== 'ALL' && user.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.isActive !== 'ALL') {
        const isActive = filters.isActive === 'true';
        if (user.isActive !== isActive) return false;
      }

      // Email verification filter
      if (filters.isEmailVerified !== 'ALL') {
        const isVerified = filters.isEmailVerified === 'true';
        if (user.isEmailVerified !== isVerified) return false;
      }

      return true;
    });
  }, [users, filters]);

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleStatus = (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
    }
  };

  const handleResetPassword = (user: User) => {
    if (window.confirm(`Send password reset email to ${user.email}?`)) {
      resetPasswordMutation.mutate(user.id);
    }
  };

  const handleFormSubmit = (formData: UserFormData) => {
    if (selectedUser) {
      // Update existing user
      const updateData: UpdateUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
      };
      updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
    } else {
      // Create new user
      const createData: CreateUserData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        password: formData.password!,
      };
      createUserMutation.mutate(createData);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedUser(undefined);
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </div>
          <Button onClick={handleCreateUser} className="shadow-lg shadow-primary-600/20">
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </div>

        <GlassCard className="p-4" intensity="medium">
          <UserFilters filters={filters} onFilterChange={setFilters} />
        </GlassCard>

        <GlassCard className="overflow-hidden" intensity="strong">
          <div className="px-6 py-4 border-b border-secondary-200 dark:border-gray-700">
            <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
              Users ({filteredUsers.length})
            </h2>
          </div>
          <UserTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            loading={isLoading}
          />
        </GlassCard>

        {showForm && (
          <UserForm
            user={selectedUser}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={createUserMutation.isPending || updateUserMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};
