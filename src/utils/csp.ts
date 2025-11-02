/**
 * Content Security Policy utilities
 * Provides different CSP configurations for development vs production
 * 
 * Note: frame-ancestors directive is NOT included here because it's ignored 
 * when delivered via <meta> tag. For clickjacking protection, implement 
 * frame-ancestors via HTTP response headers or use X-Frame-Options header.
 */

/**
 * DEPRECATED: CSP is now managed via vercel.json HTTP headers
 *
 * This dynamic CSP was causing conflicts with vercel.json HTTP header CSP.
 * HTTP headers take precedence and are more secure than meta tags.
 *
 * All CSP configuration has been consolidated in vercel.json.
 * This function is kept for reference but disabled.
 *
 * @deprecated Use vercel.json CSP headers instead
 */
export const setEnvironmentBasedCSP = () => {
  // CSP now managed via vercel.json HTTP headers - this function is disabled
  // to prevent conflicts between meta tag CSP and HTTP header CSP.

  if (import.meta.env.DEV) {
    console.info('[CSP] Content Security Policy is managed via vercel.json HTTP headers');
  }

  // Original implementation kept for reference:
  // - All CSP directives have been moved to vercel.json
  // - HTTP header CSP is more secure than meta tag CSP
  // - Prevents dual CSP conflicts where the most restrictive policy wins
}; 
