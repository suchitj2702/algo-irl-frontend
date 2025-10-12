import { Analytics } from '@vercel/analytics/react';
import { AppRouter } from './components/AppRouter';
import { initializeEnvironment } from './utils/config';

export function App() {
 // Initialize and validate environment configuration
 initializeEnvironment();
 
 return (
  <>
   <AppRouter />
   <Analytics />
  </>
 );
}