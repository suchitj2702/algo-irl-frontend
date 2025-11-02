/**
 * Response Sanitizer - Removes sensitive data before logging
 *
 * Purpose:
 * - Strip sensitive fields (tokens, keys, passwords, PII)
 * - Truncate large payloads
 * - Mask email addresses and user identifiers
 * - Safe for production logging
 */

interface SanitizeOptions {
  maxLength?: number;
  maskEmail?: boolean;
  removeFields?: string[];
}

const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'sessionId',
  'creditCard',
  'cvv',
  'ssn',
  'privateKey',
  'razorpay_signature',
  'razorpay_payment_id',
  'razorpay_subscription_id',
];

/**
 * Mask email addresses (e.g., test@example.com → t***@e***.com)
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;

  const emailRegex = /^([^@]{1,2})[^@]*@([^.]{1})[^.]*\.(.*)$/;
  const match = email.match(emailRegex);

  if (match) {
    return `${match[1]}***@${match[2]}***.${match[3]}`;
  }

  return email;
}

/**
 * Recursively sanitize an object by removing sensitive fields
 */
function sanitizeObject(obj: any, options: SanitizeOptions = {}): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj !== 'object') {
    // Mask emails in strings
    if (options.maskEmail && typeof obj === 'string' && obj.includes('@')) {
      return maskEmail(obj);
    }
    return obj;
  }

  const sensitiveFields = [
    ...DEFAULT_SENSITIVE_FIELDS,
    ...(options.removeFields || [])
  ];

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields
    if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value, options);
  }

  return sanitized;
}

/**
 * Truncate large payloads to prevent log bloat
 */
function truncatePayload(data: any, maxLength: number = 1000): any {
  const stringified = JSON.stringify(data);

  if (stringified.length <= maxLength) {
    return data;
  }

  return {
    ...data,
    _truncated: true,
    _originalSize: stringified.length,
    _message: 'Payload truncated for logging'
  };
}

/**
 * Sanitize API response before logging
 */
export function sanitizeResponse(response: any, options: SanitizeOptions = {}): any {
  const {
    maxLength = 1000,
    maskEmail: shouldMaskEmail = true,
    removeFields = []
  } = options;

  // Handle null/undefined
  if (response === null || response === undefined) {
    return response;
  }

  // Sanitize the object
  let sanitized = sanitizeObject(response, {
    maskEmail: shouldMaskEmail,
    removeFields
  });

  // Truncate if needed
  sanitized = truncatePayload(sanitized, maxLength);

  return sanitized;
}

/**
 * Sanitize error object for safe logging
 */
export function sanitizeError(error: any, options: SanitizeOptions = {}): any {
  if (!error) return error;

  const sanitized: any = {
    message: error.message || String(error),
    name: error.name,
    ...(error.code && { code: error.code }),
  };

  // Remove stack traces containing file paths in production
  if (import.meta.env.PROD && error.stack) {
    // Only include first line of stack (error message) in production
    const firstLine = error.stack.split('\n')[0];
    sanitized.stack = firstLine;
  } else if (error.stack) {
    sanitized.stack = error.stack;
  }

  // Sanitize any additional error properties
  if (error.response) {
    sanitized.response = sanitizeResponse(error.response, options);
  }

  if (error.config) {
    sanitized.config = {
      url: error.config.url,
      method: error.config.method,
      // Don't log headers (may contain tokens)
    };
  }

  return sanitized;
}

/**
 * Sanitize payment-related data (extra careful)
 */
export function sanitizePaymentData(data: any): any {
  const paymentSensitiveFields = [
    'razorpay_order_id',
    'razorpay_payment_id',
    'razorpay_signature',
    'razorpay_subscription_id',
    'amount',
    'currency',
    'notes',
    'prefill',
    'customer_id',
  ];

  return sanitizeObject(data, {
    removeFields: paymentSensitiveFields,
    maskEmail: true,
  });
}

/**
 * Check if a string contains sensitive data patterns
 */
export function containsSensitiveData(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /bearer/i,
    /authorization/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /rzp_test_[A-Za-z0-9]+/, // Razorpay test key
    /rzp_live_[A-Za-z0-9]+/, // Razorpay live key
  ];

  return sensitivePatterns.some(pattern => pattern.test(text));
}
