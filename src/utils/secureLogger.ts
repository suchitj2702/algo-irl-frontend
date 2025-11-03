/**
 * Secure Logger - Environment-aware logging with automatic PII sanitization
 *
 * Routes logs appropriately:
 * - DEV: console.log for debugging
 * - PROD: Vercel logs + Sentry for errors
 *
 * Usage:
 *   secureLog.dev('Context', 'Debug message', data)     // Dev only
 *   secureLog.info('Context', 'Info message')            // Production safe
 *   secureLog.warn('Context', 'Warning message')         // Production safe
 *   secureLog.error('Context', error, extras)            // Vercel + Sentry
 *   secureLog.fatal('Context', error, extras)            // Vercel + Sentry + Alert
 */

import * as Sentry from '@sentry/react';
import { sanitizeResponse, sanitizeError, containsSensitiveData } from './responseSanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  [key: string]: any;
}

/**
 * Format log message with context
 */
function formatLogMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

/**
 * Check if sensitive data should be blocked from logging
 */
function shouldBlock(data: any): boolean {
  if (!data) return false;

  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  return containsSensitiveData(stringified);
}

/**
 * Development-only logging (only shows in browser console during dev)
 */
function dev(context: string, message: string, data?: any): void {
  if (!import.meta.env.DEV) return;

  // Warn if attempting to log sensitive data even in dev
  if (shouldBlock(data)) {
    console.warn(`[secureLogger] Blocked potentially sensitive data in dev log:`, context);
    return;
  }

  if (data !== undefined) {
    console.log(`[${context}]`, message, data);
  } else {
    console.log(`[${context}]`, message);
  }
}

/**
 * Info-level logging (production safe, Vercel logs only)
 */
function info(context: string, message: string, data?: LogContext): void {
  const formattedMessage = formatLogMessage('info', context, message);

  // In production, use console.info which gets captured by Vercel
  if (import.meta.env.PROD) {
    const sanitizedData = data ? sanitizeResponse(data) : undefined;
    if (sanitizedData) {
      console.info(formattedMessage, sanitizedData);
    } else {
      console.info(formattedMessage);
    }
  } else {
    // In dev, regular console.log
    if (data) {
      console.log(`[${context}]`, message, data);
    } else {
      console.log(`[${context}]`, message);
    }
  }
}

/**
 * Warning-level logging (production safe, Vercel logs only)
 */
function warn(context: string, message: string, data?: LogContext): void {
  const formattedMessage = formatLogMessage('warn', context, message);

  const sanitizedData = data ? sanitizeResponse(data) : undefined;

  if (sanitizedData) {
    console.warn(formattedMessage, sanitizedData);
  } else {
    console.warn(formattedMessage);
  }
}

/**
 * Error-level logging (Vercel logs + Sentry)
 * 30% sampling for Sentry free tier quota management
 */
function error(context: string, error: Error | string, extras?: LogContext): void {
  const formattedMessage = formatLogMessage('error', context,
    typeof error === 'string' ? error : error.message
  );

  // Always log to Vercel
  const sanitizedError = typeof error === 'string'
    ? error
    : sanitizeError(error);

  const sanitizedExtras = extras ? sanitizeResponse(extras) : undefined;

  console.error(formattedMessage, sanitizedError, sanitizedExtras);

  // Send to Sentry in production (with sampling handled by Sentry config)
  if (import.meta.env.PROD && typeof error !== 'string') {
    Sentry.captureException(error, {
      tags: {
        context,
        logLevel: 'error',
      },
      extra: sanitizedExtras,
    });
  }
}

/**
 * Fatal-level logging (Vercel logs + Sentry with 100% sampling + Alert)
 * Use for critical errors that need immediate attention
 */
function fatal(context: string, error: Error | string, extras?: LogContext): void {
  const formattedMessage = formatLogMessage('fatal', context,
    typeof error === 'string' ? error : error.message
  );

  // Always log to Vercel
  const sanitizedError = typeof error === 'string'
    ? error
    : sanitizeError(error);

  const sanitizedExtras = extras ? sanitizeResponse(extras) : undefined;

  console.error(`🚨 ${formattedMessage}`, sanitizedError, sanitizedExtras);

  // Always send to Sentry (bypasses sampling)
  if (import.meta.env.PROD) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    Sentry.captureException(errorObj, {
      level: 'fatal' as Sentry.SeverityLevel,
      tags: {
        context,
        logLevel: 'fatal',
        critical: 'true',
      },
      extra: sanitizedExtras,
    });
  }
}

/**
 * Payment-specific error logging (extra sanitization)
 */
function paymentError(context: string, error: Error | string, paymentContext?: any): void {
  // Never log full payment context - only safe metadata
  const safeContext = paymentContext ? {
    hasRazorpayOrderId: !!paymentContext.razorpayOrderId,
    hasPlanId: !!paymentContext.planId,
    timestamp: new Date().toISOString(),
  } : undefined;

  error(context, error, safeContext);
}

/**
 * Performance logging (for slow operations)
 */
function performance(context: string, operation: string, duration: number, threshold: number = 1000): void {
  if (duration > threshold) {
    warn(context, `Slow operation: ${operation} took ${duration}ms`, {
      operation,
      duration,
      threshold,
    });

    // Send to Sentry for performance monitoring
    if (import.meta.env.PROD) {
      Sentry.captureMessage(`Slow operation: ${operation}`, {
        level: 'warning' as Sentry.SeverityLevel,
        tags: {
          context,
          operation,
          performance: 'slow',
        },
        extra: {
          duration,
          threshold,
        },
      });
    }
  }
}

/**
 * Generate stable anonymous user ID for tracking before authentication
 * Uses browser fingerprint + persistent localStorage ID
 */
function getAnonymousUserId(): string {
  const ANON_ID_KEY = 'algoirl_anon_id';

  // Check if we already have an anonymous ID
  let anonId: string | null = null;
  try {
    anonId = localStorage.getItem(ANON_ID_KEY);
  } catch {
    // localStorage not available (SSR, private mode, etc.)
  }

  if (!anonId) {
    // Generate stable ID from browser fingerprint + timestamp
    const browserFingerprint = [
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      typeof window !== 'undefined' ? new Date().getTimezoneOffset() : 0,
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
    ].join('|');

    // Create hash-like ID
    try {
      anonId = `anon_${btoa(browserFingerprint).substring(0, 16)}_${Date.now()}`;
      localStorage.setItem(ANON_ID_KEY, anonId);
    } catch {
      // Fallback if btoa or localStorage fails
      anonId = `anon_temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  return anonId;
}

/**
 * Set user context for Sentry (non-PII only)
 * Supports both authenticated and anonymous users
 */
function setUserContext(userId: string, metadata?: { isPremium?: boolean; signupDate?: string; isAnonymous?: boolean }): void {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: userId,
      ...(metadata?.isPremium !== undefined && { isPremium: metadata.isPremium }),
      ...(metadata?.signupDate && { signupDate: metadata.signupDate }),
      ...(metadata?.isAnonymous !== undefined && { isAnonymous: metadata.isAnonymous }),
    });
  }
}

/**
 * Clear user context (on logout)
 */
function clearUserContext(): void {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging context
 */
function addBreadcrumb(category: string, message: string, data?: any): void {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      category,
      message,
      level: 'info' as Sentry.SeverityLevel,
      data: data ? sanitizeResponse(data) : undefined,
    });
  }
}

export const secureLog = {
  dev,
  info,
  warn,
  error,
  fatal,
  paymentError,
  performance,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  getAnonymousUserId,
};
