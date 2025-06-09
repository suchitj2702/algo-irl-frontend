/**
 * Content Security Policy utilities
 * Provides different CSP configurations for development vs production
 */

// Set to false to completely disable CSP in development for debugging
const ENABLE_CSP_IN_DEV = false;

// Set to false to temporarily disable CSP in production for Monaco debugging
const ENABLE_CSP_IN_PROD = true;

export const setEnvironmentBasedCSP = () => {
  // Only run in browser environment
  if (typeof document === 'undefined') return;

  // Remove existing CSP meta tag if it exists
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Skip CSP in development if disabled for Monaco Editor debugging
  if (import.meta.env.DEV && !ENABLE_CSP_IN_DEV) {
    console.log('CSP disabled in development mode for Monaco Editor compatibility');
    return;
  }

  // Create new CSP meta tag
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Content-Security-Policy');

  if (import.meta.env.DEV) {
    // Development - More permissive for Monaco Editor and debugging
    meta.setAttribute('content', `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net;
      img-src 'self' data: blob: https:;
      connect-src 'self' http://localhost:3000 https://algo-irl.vercel.app https://judge0-ce.p.rapidapi.com ws: wss:;
      font-src 'self' data: blob:;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim());
  } else {
    // Production - More restrictive but still Monaco compatible
    if (!ENABLE_CSP_IN_PROD) {
      console.log('CSP disabled in production mode for Monaco Editor debugging');
      return;
    }
    
    console.log('Setting production CSP for Monaco Editor compatibility');
    meta.setAttribute('content', `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net;
      img-src 'self' data: blob: https:;
      connect-src 'self' https://algo-irl.vercel.app https://judge0-ce.p.rapidapi.com;
      font-src 'self' data: blob:;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim());
  }

  // Add the new CSP to the document head
  document.head.appendChild(meta);
}; 