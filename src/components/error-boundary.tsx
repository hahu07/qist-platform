"use client";

import { Component, ReactNode } from "react";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    logger.error("Error Boundary caught an error:", error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // TODO: Send error to monitoring service (Sentry, LogRocket, etc.) in production
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border-[3px] border-black dark:border-neutral-600 shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_#7888FF] p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-danger-600 dark:text-danger-400"
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

              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-2">
                Something went wrong
              </h2>

              <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>

              {this.state.error && process.env.NODE_ENV === "development" && (
                <div className="mb-6 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-700">
                  <p className="text-xs font-mono text-danger-600 dark:text-danger-400 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl border-[3px] border-black dark:border-neutral-600 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#7888FF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Refresh Page
                </button>

                <button
                  onClick={() => (window.location.href = "/")}
                  className="flex-1 px-6 py-3 bg-white dark:bg-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-bold rounded-xl border-[3px] border-black dark:border-neutral-600 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_#7888FF] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Go Home
                </button>
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
 * Simple Error Fallback Component
 * For use in smaller sections where full-screen fallback is too much
 */
export function ErrorFallback({ error, resetError }: { error: Error; resetError?: () => void }) {
  return (
    <div className="p-6 bg-danger-50 dark:bg-danger-900/20 border-2 border-danger-200 dark:border-danger-800 rounded-xl">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-bold text-danger-900 dark:text-danger-300 mb-1">Error Loading Content</h3>
          <p className="text-sm text-danger-700 dark:text-danger-400 mb-3">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred. Please try again."}
          </p>
          {resetError && (
            <button
              onClick={resetError}
              className="text-sm font-medium text-danger-700 dark:text-danger-400 hover:text-danger-900 dark:hover:text-danger-200 underline"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
