import { Analytics } from '@vercel/analytics/react';
import { AppRouter } from './components/AppRouter';
import { initializeEnvironment } from './utils/config';

export function App() {
 // initializeEnvironment must run before hooks that depend on feature flags
 initializeEnvironment();
 
 return (
  <>
   <AppRouter />
   <Analytics />
  </>
 );
}
