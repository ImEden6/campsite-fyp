import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { post } from '@/services/api/client';
import { cn } from '@/utils/cn';

interface RegisterFormProps {
  onSuccess?: () => void;
  userType?: 'customer' | 'staff';
}

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
}

type Step = 1 | 2 | 3;

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  userType = 'staff'
}) => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [validationErrors, setValidationErrors] = useState<Partial<RegistrationData>>({});

  const validateStep = (step: Step): boolean => {
    const errors: Partial<RegistrationData> = {};

    if (step === 1) {
      // Email validation
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }

      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      // First name validation
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
      } else if (formData.firstName.length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
      }

      // Last name validation
      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
      } else if (formData.lastName.length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
      }

      // Phone validation
      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name as keyof RegistrationData]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear global error
    if (error) {
      setError(null);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: userType === 'staff' ? 'STAFF' : 'CUSTOMER',
      });

      setSuccess(true);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium',
              currentStep >= step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            )}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={cn(
                'mx-2 h-1 w-12',
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Registration successful!
        </h2>
        <p className="text-gray-600">
          Your account has been created. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Staff Account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Register a new staff member for the campsite management system
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global error message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Registration failed</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Account credentials */}
        {currentStep === 1 && (
          <div className="space-y-4">
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

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              error={validationErrors.password}
              icon={<Lock className="h-5 w-5" />}
              autoComplete="new-password"
              helperText="At least 8 characters with uppercase, lowercase, and number"
              required
            />

            <Input
              type="password"
              name="confirmPassword"
              label="Confirm password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={validationErrors.confirmPassword}
              icon={<Lock className="h-5 w-5" />}
              autoComplete="new-password"
              required
            />
          </div>
        )}

        {/* Step 2: Personal information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <Input
              type="text"
              name="firstName"
              label="First name"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              error={validationErrors.firstName}
              icon={<User className="h-5 w-5" />}
              autoComplete="given-name"
              required
            />

            <Input
              type="text"
              name="lastName"
              label="Last name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              error={validationErrors.lastName}
              icon={<User className="h-5 w-5" />}
              autoComplete="family-name"
              required
            />

            <Input
              type="tel"
              name="phone"
              label="Phone number"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              error={validationErrors.phone}
              icon={<Phone className="h-5 w-5" />}
              autoComplete="tel"
              required
            />
          </div>
        )}

        {/* Step 3: Review and confirm */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-medium text-gray-900">Review your information</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Email:</dt>
                  <dd className="font-medium text-gray-900">{formData.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Name:</dt>
                  <dd className="font-medium text-gray-900">
                    {formData.firstName} {formData.lastName}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Phone:</dt>
                  <dd className="font-medium text-gray-900">{formData.phone}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <p>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleNext}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          )}
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
