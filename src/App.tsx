import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
   </AuthDialogProvider>
  </ErrorBoundary>
 );
}
