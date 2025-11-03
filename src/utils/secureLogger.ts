import * as Sentry from '@sentry/react';
import { sanitizeResponse, sanitizeError, containsSensitiveData } from './responseSanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type LogContext = Record<string, unknown>;

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error';

const rawConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const IS_PROD = import.meta.env.PROD;
const SENTRY_ENABLED = IS_PROD && Boolean(import.meta.env.VITE_SENTRY_DSN);

let currentUserId: string | null = null;

function formatLogMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
}

function shouldBlock(data: unknown): boolean {
  if (!data) return false;

  try {
    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    return containsSensitiveData(stringified);
  } catch {
    return true;
  }
}

function appendUserContext(extras?: LogContext): LogContext | undefined {
  const base = extras ? { ...extras } : {};

  if (currentUserId) {
    base.logUserId = currentUserId;
  }

  const keys = Object.keys(base);
  return keys.length > 0 ? base : undefined;
}

function buildExtras(extras?: LogContext): { raw?: LogContext; sanitized?: LogContext } {
  const extended = appendUserContext(extras);

  if (!extended) {
    return { raw: undefined, sanitized: undefined };
  }

  return {
    raw: extended,
    sanitized: sanitizeResponse(extended),
  };
}

function sendMessageToSentry(level: Sentry.SeverityLevel, context: string, message: string, extras?: LogContext): void {
  if (!SENTRY_ENABLED) return;

  Sentry.withScope(scope => {
    scope.setLevel(level);
    scope.setTag('loggerContext', context);

    if (extras) {
      scope.setExtra('data', extras);
    }

    Sentry.captureMessage(message);
  });
}

function dev(context: string, message: string, data?: unknown): void {
  if (!import.meta.env.DEV) return;

  if (shouldBlock(data)) {
    rawConsole.warn('[secureLogger] Blocked potentially sensitive data in dev log:', context);
    return;
  }

  if (data !== undefined) {
    if (currentUserId) {
      rawConsole.log(`[${context}]`, message, data, { logUserId: currentUserId });
    } else {
      rawConsole.log(`[${context}]`, message, data);
    }
  } else if (currentUserId) {
    rawConsole.log(`[${context}]`, message, { logUserId: currentUserId });
  } else {
    rawConsole.log(`[${context}]`, message);
  }
}

function info(context: string, message: string, data?: LogContext): void {
  const formattedMessage = formatLogMessage('info', context, message);
  const { raw, sanitized } = buildExtras(data);
  const consolePayload = IS_PROD ? sanitized : raw;

  if (consolePayload) {
    rawConsole.info(formattedMessage, consolePayload);
  } else {
    rawConsole.info(formattedMessage);
  }

  sendMessageToSentry('info', context, message, sanitized);
}

function warn(context: string, message: string, data?: LogContext): void {
  const formattedMessage = formatLogMessage('warn', context, message);
  const { raw, sanitized } = buildExtras(data);
  const consolePayload = IS_PROD ? sanitized : raw;

  if (consolePayload) {
    rawConsole.warn(formattedMessage, consolePayload);
  } else {
    rawConsole.warn(formattedMessage);
  }

  sendMessageToSentry('warning', context, message, sanitized);
}

function error(context: string, err: Error | string, extras?: LogContext): void {
  const message = typeof err === 'string' ? err : err.message;
  const formattedMessage = formatLogMessage('error', context, message);
  const { raw, sanitized } = buildExtras(extras);
  const consolePayload = IS_PROD ? sanitized : raw;
  const sanitizedError = typeof err === 'string' ? err : sanitizeError(err);

  if (consolePayload) {
    rawConsole.error(formattedMessage, sanitizedError, consolePayload);
  } else {
    rawConsole.error(formattedMessage, sanitizedError);
  }

  if (!SENTRY_ENABLED) return;

  if (err instanceof Error) {
    Sentry.captureException(err, {
      tags: {
        context,
        logLevel: 'error',
      },
      extra: sanitized,
    });
  } else {
    sendMessageToSentry('error', context, message, sanitized);
  }
}

function fatal(context: string, err: Error | string, extras?: LogContext): void {
  const message = typeof err === 'string' ? err : err.message;
  const formattedMessage = formatLogMessage('fatal', context, message);
  const { raw, sanitized } = buildExtras(extras);
  const consolePayload = IS_PROD ? sanitized : raw;
  const sanitizedError = typeof err === 'string' ? err : sanitizeError(err);

  if (consolePayload) {
    rawConsole.error(`🚨 ${formattedMessage}`, sanitizedError, consolePayload);
  } else {
    rawConsole.error(`🚨 ${formattedMessage}`, sanitizedError);
  }

  if (!SENTRY_ENABLED) return;

  const errorObj = err instanceof Error ? err : new Error(err);

  Sentry.captureException(errorObj, {
    level: 'fatal',
    tags: {
      context,
      logLevel: 'fatal',
      critical: 'true',
    },
    extra: sanitized,
  });
}

function paymentError(context: string, err: Error | string, paymentContext?: Record<string, unknown>): void {
  const safeContext = paymentContext
    ? {
        hasRazorpayOrderId: Boolean((paymentContext as Record<string, unknown>).razorpayOrderId),
        hasPlanId: Boolean((paymentContext as Record<string, unknown>).planId),
        timestamp: new Date().toISOString(),
      }
    : undefined;

  error(context, err, safeContext);
}

function performance(
  context: string,
  operation: string,
  duration: number,
  threshold: number = 1000,
): void {
  if (duration <= threshold) {
    return;
  }

  warn(context, `Slow operation: ${operation} took ${duration}ms`, {
    operation,
    duration,
    threshold,
  });
}

function getAnonymousUserId(): string {
  const ANON_ID_KEY = 'algoirl_anon_id';

  let anonId: string | null = null;
  try {
    anonId = localStorage.getItem(ANON_ID_KEY);
  } catch {
    // Ignore when localStorage is not available
  }

  if (!anonId) {
    const browserFingerprint = [
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      typeof window !== 'undefined' ? new Date().getTimezoneOffset() : 0,
      typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
    ].join('|');

    try {
      anonId = `anon_${btoa(browserFingerprint).substring(0, 16)}_${Date.now()}`;
      localStorage.setItem(ANON_ID_KEY, anonId);
    } catch {
      anonId = `anon_temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  return anonId;
}

function setUserContext(
  userId: string,
  metadata?: { isPremium?: boolean; signupDate?: string; isAnonymous?: boolean },
): void {
  currentUserId = userId;

  if (!SENTRY_ENABLED) {
    return;
  }

  Sentry.setUser({
    id: userId,
    ...(metadata?.isPremium !== undefined && { isPremium: metadata.isPremium }),
    ...(metadata?.signupDate && { signupDate: metadata.signupDate }),
    ...(metadata?.isAnonymous !== undefined && { isAnonymous: metadata.isAnonymous }),
  });
}

function clearUserContext(): void {
  currentUserId = null;

  if (SENTRY_ENABLED) {
    Sentry.setUser(null);
  }
}

function addBreadcrumb(category: string, message: string, data?: unknown): void {
  if (!SENTRY_ENABLED) return;

  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data: data ? sanitizeResponse(data) : undefined,
  });
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

interface NormalizedConsoleCall {
  context: string;
  message: string;
  error?: Error | string;
  extras?: LogContext;
}

function safeSerialize(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeConsoleArgs(args: unknown[]): NormalizedConsoleCall {
  if (!args.length) {
    return {
      context: 'Console',
      message: '(no arguments)',
    };
  }

  const [first, ...rest] = args;
  let context = 'Console';
  let message: string;
  let error: Error | undefined;

  if (first instanceof Error) {
    error = first;
    message = first.message;
  } else if (typeof first === 'string') {
    message = first.trim();
    const contextMatch = message.match(/\[(.*?)\]/);

    if (contextMatch && contextMatch[1]) {
      context = contextMatch[1];
    }
  } else {
    message = safeSerialize(first);
  }

  let extrasArgs = rest;

  if (!(first instanceof Error) && typeof first !== 'string') {
    extrasArgs = [first, ...rest];
  }

  if (!error) {
    const errorFromRest = extrasArgs.find(arg => arg instanceof Error) as Error | undefined;

    if (errorFromRest) {
      error = errorFromRest;
      extrasArgs = extrasArgs.filter(arg => arg !== errorFromRest);
    }
  }

  const extras = extrasArgs.length
    ? ({ arguments: extrasArgs } as LogContext)
    : undefined;

  return {
    context,
    message: message || '(empty message)',
    error,
    extras,
  };
}

function routeConsoleCall(method: ConsoleMethod, args: unknown[]): void {
  const normalized = normalizeConsoleArgs(args);

  if (method === 'error') {
    const err = normalized.error ?? normalized.message;
    secureLog.error(normalized.context, err, normalized.extras);
    return;
  }

  if (method === 'warn') {
    secureLog.warn(normalized.context, normalized.message, normalized.extras);
    return;
  }

  secureLog.info(normalized.context, normalized.message, normalized.extras);
}

function patchConsoleMethods(): void {
  if (typeof console === 'undefined') return;

  const flag = '__secureLogPatched';

  if ((console as Record<string, unknown>)[flag]) {
    return;
  }

  Object.defineProperty(console, flag, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  console.log = (...args: unknown[]): void => {
    routeConsoleCall('log', args);
  };

  console.info = (...args: unknown[]): void => {
    routeConsoleCall('info', args);
  };

  console.warn = (...args: unknown[]): void => {
    routeConsoleCall('warn', args);
  };

  console.error = (...args: unknown[]): void => {
    routeConsoleCall('error', args);
  };
}

patchConsoleMethods();
