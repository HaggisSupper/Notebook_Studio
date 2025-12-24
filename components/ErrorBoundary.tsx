
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full bg-neutral-900 items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-neutral-800 border border-neutral-700 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                  System Error Detected
                </h1>
                <p className="text-sm text-neutral-400 font-mono mt-1">
                  ERROR_CODE_500: Application Failure
                </p>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                Error Details
              </p>
              <p className="text-sm text-neutral-300 font-mono break-words">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors uppercase tracking-wider">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-neutral-400 overflow-x-auto max-h-64 custom-scrollbar">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-white hover:bg-neutral-200 text-black font-black py-3 px-6 rounded-xl uppercase tracking-widest text-xs transition-colors"
              >
                Attempt Recovery
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-black py-3 px-6 rounded-xl uppercase tracking-widest text-xs transition-colors border border-neutral-600"
              >
                Force Reload
              </button>
            </div>

            <p className="text-xs text-neutral-500 text-center font-mono">
              If this error persists, try clearing your browser cache and reloading the application.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
