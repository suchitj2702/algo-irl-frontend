import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './components/AppRouter';
import PaymentSuccessHandler from './components/PaymentSuccessHandler';
import { initializeEnvironment } from './utils/config';
import { AuthDialogProvider } from './contexts/AuthDialogContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeErrorTracking } from './utils/sentryInit';

// Initialize Sentry error tracking (production only)
initializeErrorTracking();

export function App() {
 // initializeEnvironment must run before hooks that depend on feature flags
 initializeEnvironment();

 return (
  <ErrorBoundary>
   <AuthDialogProvider>
    <AppRouter />
    <PaymentSuccessHandler />
    <Analytics />
    <SpeedInsights />
    <Toaster
     position="top-center"
     toastOptions={{
      duration: 4000,
      style: {
       background: '#363636',
       color: '#fff',
      },
      success: {
       duration: 3000,
       iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
       },
      },
      error: {
       duration: 4000,
       iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
       },
      },
     }}
    />
   </AuthDialogProvider>
  </ErrorBoundary>
 );
}
