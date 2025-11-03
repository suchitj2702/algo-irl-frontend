/**
 * Sentry Configuration - Optimized for Free Tier
 *
 * Free Tier Limits:
 * - 5,000 errors/month
 * - 10,000 performance transactions/month
 *
 * Strategy:
 * - 30% error sampling = ~3,000-4,000 errors/month (leaves buffer)
 * - 5% performance sampling = stays well under limit
 * - Fatal errors always captured (bypasses sampling)
 * - All log levels routed to Sentry (info/warn/error/fatal)
 */

import * as Sentry from '@sentry/react';
import { sanitizeResponse } from '../utils/responseSanitizer';
import { secureLog } from '../utils/secureLogger';

/**
 * Initialize Sentry with free tier optimization
 */
export function initSentry(): void {
  // Only initialize in production
  if (!import.meta.env.PROD) {
    return;
  }

  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,

    // Environment tracking
    environment: import.meta.env.MODE,

    // Release tracking (for identifying which deploy caused errors)
    release: import.meta.env.VITE_APP_VERSION || '0.0.1',

    // FREE TIER QUOTA MANAGEMENT
    // 30% sampling = ~3-4K errors/month (safe buffer under 5K limit)
    sampleRate: 0.3,

    // 5% performance sampling = well under 10K transactions/month
    tracesSampleRate: 0.05,

    // Replay sampling (0 = disabled to save quota on free tier)
    replaysSessionSampleRate: 0,   // Never sample normal sessions
    replaysOnErrorSampleRate: 0.1, // Only 10% of error sessions

    beforeSend(event) {
      // Drop extremely low-value noise
      if (event.level === 'log' || event.level === 'debug') {
        return null;
      }

      // Sanitize all data before sending
      if (event.extra) {
        event.extra = sanitizeResponse(event.extra, { maxLength: 2000 });
      }

      if (event.contexts) {
        event.contexts = sanitizeResponse(event.contexts, { maxLength: 2000 });
      }

      // Remove full URLs from breadcrumbs (may contain tokens in query params)
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
          ...breadcrumb,
          data: breadcrumb.data ? sanitizeResponse(breadcrumb.data) : undefined,
        }));
      }

      return event;
    },

    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Only trace requests to our own API
        tracePropagationTargets: ['localhost', 'algoirl.ai', /^\//],

        // Disable automatic instrumentation for links/forms (saves quota)
        instrumentNavigation: false,
        instrumentPageLoad: true,
      }),

      // Session replay (DISABLED to save quota on free tier)
      // Note: Console warning "Replay is disabled..." is informational only
      Sentry.replayIntegration({
        maskAllText: true,           // Mask all text for privacy
        blockAllMedia: true,         // Block all media
        maskAllInputs: true,         // Mask all inputs
      }),

      // Feedback integration (DISABLED - not needed for MVP)
      // Sentry.feedbackIntegration(),
    ],

    // Ignore known non-critical errors
    ignoreErrors: [
      // Browser extension errors
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',

      // React DevTools
      'Cannot find module',

      // Network errors (user's connection, not our bug)
      'NetworkError',
      'Failed to fetch',
      'Load failed',

      // ResizeObserver errors (benign)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed',

      // Non-Error promise rejections
      'Non-Error promise rejection captured',
      'Non-Error exception captured',

      // Firebase auth errors (expected, not bugs)
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/network-request-failed',
    ],

    // Ignore errors from browser extensions
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,

      // Firefox extensions
      /^moz-extension:\/\//i,

      // Safari extensions
      /^safari-extension:\/\//i,
    ],

    // Attach stack traces to messages
    attachStacktrace: true,

    // Enable debug mode in development only
    debug: import.meta.env.DEV,

    // Maximum breadcrumbs (default 100, reduce to save data)
    maxBreadcrumbs: 50,

    // Transport options
    transportOptions: {
      // Limit request size
      maxBatchSize: 5,
    },
  });

  console.info('[Sentry] Initialized successfully');

  if (typeof window !== 'undefined') {
    const anonId = secureLog.getAnonymousUserId();
    secureLog.setUserContext(anonId, { isAnonymous: true });
  }
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN;
}

/**
 * Set custom tag (useful for filtering errors)
 */
export function setTag(key: string, value: string): void {
  if (isSentryEnabled()) {
    Sentry.setTag(key, value);
  }
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>): void {
  if (isSentryEnabled()) {
    Sentry.setContext(name, sanitizeResponse(context));
  }
}
