import { Analytics } from '@vercel/analytics/react';
import { AppRouter } from './components/AppRouter';
import { initializeEnvironment } from './utils/config';
import { AuthDialogProvider } from './contexts/AuthDialogContext';

export function App() {
 // initializeEnvironment must run before hooks that depend on feature flags
 initializeEnvironment();
 
 return (
  <AuthDialogProvider>
   <AppRouter />
   <Analytics />
  </AuthDialogProvider>
 );
}
