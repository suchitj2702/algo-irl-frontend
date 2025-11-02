/**
 * Environment configuration validation
 *
 * This file validates required environment variables for the application
 * Provides warnings for missing optional configuration
 */

export function validateEnvironment() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check critical payment configuration
  if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
    errors.push('VITE_RAZORPAY_KEY_ID is not configured. Payment functionality will not work.');
  } else if (import.meta.env.DEV && import.meta.env.VITE_RAZORPAY_KEY_ID.includes('test')) {
    console.info('[Config] Using test Razorpay key in development mode');
  }

  // Check Firebase configuration
  const firebaseKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingFirebase = firebaseKeys.filter(key => !import.meta.env[key]);
  if (missingFirebase.length > 0) {
    warnings.push(`Missing Firebase configuration: ${missingFirebase.join(', ')}`);
  }

  // Log warnings
  warnings.forEach(warning => console.warn(`[Config Warning] ${warning}`));

  // Log errors
  errors.forEach(error => console.error(`[Config Error] ${error}`));

  // In development, don't throw on errors - just warn
  if (import.meta.env.PROD && errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join('; ')}`);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('[Config] Environment configuration check complete - all required variables present');
  }
}

/**
 * Initialize and validate environment configuration
 */
export function initializeEnvironment() {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}
