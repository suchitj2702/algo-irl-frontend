/**
 * Error Boundary - Catches React errors and reports to Sentry
 *
 * Wraps the entire app to catch unhandled React errors
 * Provides user-friendly fallback UI
 * Automatically reports to Sentry in production
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { secureLog } from '../utils/secureLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to our secure logger
    secureLog.fatal('ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
    });

    // Set state for UI
    this.setState({
      error,
      errorInfo,
    });

    // Report to Sentry (will be sampled based on config)
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        level: 'fatal' as Sentry.SeverityLevel,
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-background px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-panel-100 shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Something went wrong
                  </h3>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-muted mb-4">
                <p>We're sorry for the inconvenience. The error has been automatically reported to our team.</p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="mb-4">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-700 dark:text-muted font-medium mb-2">
                      Error Details (Dev Mode)
                    </summary>
                    <div className="bg-gray-100 dark:bg-panel-200 p-3 rounded overflow-auto max-h-40">
                      <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-gray-600 dark:text-content-muted mt-2 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-panel-200 dark:hover:bg-panel-300 text-gray-900 dark:text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Go Home
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-panel-200">
                <p className="text-xs text-gray-500 dark:text-content-muted text-center">
                  If the problem persists, please contact support
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
