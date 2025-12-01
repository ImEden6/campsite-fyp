import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import Button from './Button';

interface ErrorPageProps {
  title?: string;
  message?: string;
  statusCode?: number;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again later.',
  statusCode,
  showBackButton = true,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center">
          {statusCode && (
            <p className="text-6xl font-bold text-gray-300 mb-4">
              {statusCode}
            </p>
          )}
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Specific error page components
export const NotFoundPage: React.FC = () => (
  <ErrorPage
    statusCode={404}
    title="Page Not Found"
    message="The page you're looking for doesn't exist or has been moved."
  />
);

export const UnauthorizedPage: React.FC = () => (
  <ErrorPage
    statusCode={403}
    title="Access Denied"
    message="You don't have permission to access this page."
    showBackButton={false}
  />
);

export const ServerErrorPage: React.FC = () => (
  <ErrorPage
    statusCode={500}
    title="Server Error"
    message="Our servers encountered an error. Please try again later."
  />
);

export default ErrorPage;
