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
