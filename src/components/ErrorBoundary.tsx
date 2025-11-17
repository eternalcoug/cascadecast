import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-600 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              The weather app encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-100 rounded text-xs sm:text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-1 sm:mb-2 touch-manipulation">
                  Error Details
                </summary>
                <code className="text-red-600 break-all">
                  {this.state.error.message}
                </code>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base touch-manipulation"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}