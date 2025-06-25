/**
 * Environment configuration validation
 */

export function validateEnvironment() {
  const requiredVars = [
    'VITE_REQUEST_SIGNATURE_SECRET'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  const secret = import.meta.env.VITE_REQUEST_SIGNATURE_SECRET;
  if (secret && secret.length < 32) {
    console.warn('VITE_REQUEST_SIGNATURE_SECRET should be at least 32 characters long');
  }
}

/**
 * Initialize and validate environment configuration
 */
export function initializeEnvironment() {
  try {
    validateEnvironment();
    console.log('Environment configuration validated successfully');
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
} 