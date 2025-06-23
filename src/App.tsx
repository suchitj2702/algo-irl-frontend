import { Analytics } from '@vercel/analytics/next';
import { AppRouter } from './components/AppRouter';

export function App() {
  return (
    <>
      <AppRouter />
      <Analytics />
    </>
  );
}