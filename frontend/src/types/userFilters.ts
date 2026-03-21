import type { UserRole } from '@shared/types';

export interface UserFilters {
    role?: UserRole[] | undefined;
    isActive?: boolean | undefined;
    searchTerm?: string | undefined;
    isEmailVerified?: boolean | undefined;
}

export interface CreateUserData {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    role: UserRole;
    password: string;
}

export interface UpdateUserData {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    role?: UserRole | undefined;
    isActive?: boolean | undefined;
}

export interface UpdateUserPasswordData {
    currentPassword?: string | undefined;
    newPassword: string;
    confirmPassword: string;
}
