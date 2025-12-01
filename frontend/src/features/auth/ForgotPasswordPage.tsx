import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { post } from '@/services/api/client';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEmail = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear errors when user types
    if (validationError) {
      setValidationError(null);
    }
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Check your email
          </h2>
          
          <p className="mb-6 text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          
          <p className="mb-8 text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Try another email
            </Button>
            
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 rounded-md bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Error</p>
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
            value={email}
            onChange={handleChange}
            error={validationError || undefined}
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
            autoFocus
            required
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          {/* Back to login link */}
          <Link to="/login">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
