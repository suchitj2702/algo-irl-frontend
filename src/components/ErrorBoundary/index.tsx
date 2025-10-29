import React, { Component, ErrorInfo, ReactNode } from 'react';

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
  // Only log errors in development to avoid exposing sensitive information
  if (import.meta.env.DEV) {
   console.error('Uncaught error:', error, errorInfo);
  }
 }

 public render() {
  if (this.state.hasError) {
   return (
    <div className="min-h-screen flex items-center justify-center p-4">
     <div className="text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4 font-playfair">Something went wrong</h2>
      <p className="text-content-muted mb-4">{this.state.error?.message}</p>
      <button
       onClick={() => window.location.href = '/'}
       className="px-4 py-2 bg-button-600 hover:bg-button-500 text-button-foreground rounded border border-button-700 transition-colors duration-150"
      >
       Go Home
      </button>
     </div>
    </div>
   );
  }

  return this.props.children;
 }
} 
