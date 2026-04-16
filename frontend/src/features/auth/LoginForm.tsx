import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface LoginFormProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
  type?: 'customer' | 'admin';
  alternativeLoginLink?: {
    text: string;
    path: string;
  };
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  title = 'Staff/Customer Login',
  description = 'Sign in to access the campsite management system',
  type = 'customer',
  alternativeLoginLink
}) => {
  const navigate = useNavigate();
  const { login, logout, setError, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Get user from store to check role
      const user = useAuthStore.getState().user;

      if (!user) return;

      // Verify role matches the login portal type
      if (type === 'customer' && user.role !== UserRole.CUSTOMER) {
        logout();
        setError('Access restricted to customers. Staff members must use the Admin Portal.');
        return;
      }

      if (type === 'admin' && user.role === UserRole.CUSTOMER) {
        logout();
        setError('Access restricted to staff. Customers must use the Customer Portal.');
        return;
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Force redirect based on role
      if (user.role === UserRole.CUSTOMER) {
        navigate('/customer/dashboard', { replace: true });
      } else {
        // Staff/Admin/Manager
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err);
    }
  };

  const isAdmin = type === 'admin';

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        {isAdmin && (
          <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider">
            Admin Portal
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-primary-100">{title}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-secondary-400">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global error message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4 text-sm text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Login failed</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Email field */}
        <Input
          type="email"
          name="email"
          label="Email address"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={validationErrors.email}
          icon={<Mail className="h-5 w-5" />}
          autoComplete="email"
          required
        />

        {/* Password field */}
        <Input
          type="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={validationErrors.password}
          icon={<Lock className="h-5 w-5" />}
          autoComplete="current-password"
          required
        />

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 dark:border-secondary-600 bg-white dark:bg-night-surface text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-secondary-300">Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant={isAdmin ? 'primary' : 'primary'}
          size="lg"
          loading={isLoading}
          className={`w-full ${isAdmin ? 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600' : ''}`}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        {/* Alternative login link */}
        {alternativeLoginLink && (
          <div className="mt-6 text-center">
            <Link
              to={alternativeLoginLink.path}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              {alternativeLoginLink.text}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
