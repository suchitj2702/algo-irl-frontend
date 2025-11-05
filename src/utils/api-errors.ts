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
 * Rate limit error class for API requests
 */
export class APIRateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded. Please try again in a few moments.') {
    super(message);
    this.name = 'APIRateLimitError';
  }
}
