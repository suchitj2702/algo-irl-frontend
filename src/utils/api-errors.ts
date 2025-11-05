/**
 * API Error Classes
 * Custom error types for API request handling
 */

/**
 * Authentication error class for API requests
 */
export class APIAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIAuthenticationError';
  }
}

/**
 * Rate limit exceeded error class for API requests
 */
export class APIRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIRateLimitError';
  }
}
