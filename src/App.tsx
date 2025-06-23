import { Analytics } from '@vercel/analytics/react';
import { AppRouter } from './components/AppRouter';

export function App() {
  return (
    <>
      <AppRouter />
      <Analytics />
    </>
  );
}