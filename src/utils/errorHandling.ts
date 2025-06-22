/**
 * Centralized error handling utilities
 * Ensures sensitive information is not exposed in production logs
 */

/**
 * Safely logs errors only in development environment
 * @param context - Where the error occurred (e.g., 'API', 'Cache', 'CodeExecution')
 * @param error - The error object or message
 */
export const logError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, you could send to an error tracking service here
  // Example: Sentry.captureException(error, { tags: { context } });
};

/**
 * Sanitizes error messages to avoid exposing internal details
 * @param error - The raw error message
 * @param fallbackMessage - Message to use if sanitization is needed
 * @returns Sanitized error message safe for user display
 */
export const sanitizeErrorMessage = (
  error: string, 
  fallbackMessage: string = 'An error occurred. Please try again.'
): string => {
  // Remove potentially sensitive information
  if (
    error.length > 150 || 
    error.includes('http://') ||
    error.includes('https://') ||
    error.includes('localhost') ||
    error.includes('127.0.0.1') ||
    error.includes('stack') ||
    error.includes('at ') || // Stack trace indicator
    error.match(/\/[a-zA-Z0-9_\-/]+\.[tj]sx?/) // File paths
  ) {
    return fallbackMessage;
  }
  
  return error;
};

/**
 * Handles API errors safely
 * @param response - The fetch Response object
 * @param context - Context for the API call
 * @returns Sanitized error message
 */
export const handleApiError = async (
  response: Response, 
  context: string
): Promise<string> => {
  try {
    const errorText = await response.text();
    logError(`API Error - ${context}`, { 
      status: response.status, 
      statusText: response.statusText,
      errorText 
    });
    
    // Try to parse as JSON first
    try {
      const errorJson = JSON.parse(errorText);
      return sanitizeErrorMessage(
        errorJson.message || errorJson.error || 'Request failed',
        `${context} failed. Please try again.`
      );
    } catch {
      // If not JSON, use text directly
      return sanitizeErrorMessage(errorText, `${context} failed. Please try again.`);
    }
  } catch (error) {
    logError(`API Error Handler - ${context}`, error);
    return `${context} failed. Please try again.`;
  }
}; 