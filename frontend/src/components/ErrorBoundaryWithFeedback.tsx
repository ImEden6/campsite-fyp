import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException } from '@/config/sentry';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';
import { ErrorFeedback } from './ErrorFeedback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDialog?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  showFeedback: boolean;
}

/**
 * Enhanced error boundary with Sentry integration and user feedback
 */
export class ErrorBoundaryWithFeedback extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showFeedback: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Capture error with Sentry (lazy loaded)
    captureException(error, {
      componentStack: errorInfo.componentStack,
    }).then((eventId) => {
      if (eventId) {
        this.setState({ eventId, errorInfo });
      }
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showFeedback: false,
    });
  };

  handleShowFeedback = () => {
    this.setState({ showFeedback: true });
  };

  handleCloseFeedback = () => {
    this.setState({ showFeedback: false });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Oops! Something went wrong
              </h1>

              <p className="text-gray-600 text-center mb-6">
                We're sorry for the inconvenience. The error has been reported
                to our team.
              </p>

              {this.state.error && (
                <div className="bg-gray-50 rounded-md p-4 mb-6">
                  <p className="text-sm font-mono text-gray-700 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                {this.state.eventId && (
                  <button
                    onClick={this.handleShowFeedback}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Report Issue
                  </button>
                )}

                <button
                  onClick={() => (window.location.href = '/')}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Go to Home
                </button>
              </div>

              {this.state.eventId && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Error ID: {this.state.eventId}
                </p>
              )}
            </div>
          </div>

          {this.state.showFeedback && this.state.eventId && (
            <ErrorFeedback
              eventId={this.state.eventId}
              onClose={this.handleCloseFeedback}
            />
          )}
        </>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundaryWithFeedback fallback={fallback}>
      <Component {...props} />
    </ErrorBoundaryWithFeedback>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
};
