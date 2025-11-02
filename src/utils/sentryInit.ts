/**
 * Sentry Initialization - Lazy load and initialize Sentry
 *
 * Called early in app lifecycle to set up error tracking
 */

import { initSentry, setTag } from '../config/sentry';

/**
 * Initialize Sentry with app-specific configuration
 */
export function initializeErrorTracking(): void {
  try {
    // Initialize Sentry
    initSentry();

    // Set app-specific tags
    if (import.meta.env.PROD) {
      setTag('app_version', import.meta.env.VITE_APP_VERSION || '0.0.1');
      setTag('build_time', new Date().toISOString());

      // Browser detection
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Chrome')) {
        setTag('browser', 'chrome');
      } else if (userAgent.includes('Firefox')) {
        setTag('browser', 'firefox');
      } else if (userAgent.includes('Safari')) {
        setTag('browser', 'safari');
      } else {
        setTag('browser', 'other');
      }

      // Device type detection
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      setTag('device_type', isMobile ? 'mobile' : 'desktop');
    }
  } catch (error) {
    // Don't let Sentry initialization errors break the app
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Check if error tracking is available
 */
export function isErrorTrackingEnabled(): boolean {
  return import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN;
}
