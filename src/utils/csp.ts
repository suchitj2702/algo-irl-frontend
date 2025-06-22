/**
 * Content Security Policy utilities
 * Provides different CSP configurations for development vs production
 * 
 * Note: frame-ancestors directive is NOT included here because it's ignored 
 * when delivered via <meta> tag. For clickjacking protection, implement 
 * frame-ancestors via HTTP response headers or use X-Frame-Options header.
 */

export const setEnvironmentBasedCSP = () => {
  // Only run in browser environment
  if (typeof document === 'undefined') return;

  // Remove existing CSP meta tag if it exists
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Get API URL from environment variables
  const getApiUrl = (): string => {
    if (import.meta.env.DEV) {
      return import.meta.env.VITE_API_URL || 'http://localhost:3000';
    }
    return import.meta.env.VITE_PRODUCTION_API_URL;
  };

  const apiUrl = getApiUrl();

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
      connect-src 'self' ${apiUrl} https://judge0-ce.p.rapidapi.com ws: wss:;
      font-src 'self' data: blob: https://cdn.jsdelivr.net;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim());
  } else {
    // Production - More restrictive but still Monaco compatible
    const cspContent = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net;
      img-src 'self' data: blob: https:;
      connect-src 'self' ${apiUrl} https://judge0-ce.p.rapidapi.com;
      font-src 'self' data: blob: https://cdn.jsdelivr.net;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();
    
    meta.setAttribute('content', cspContent);
  }

  // Add the new CSP to the document head
  document.head.appendChild(meta);
  
  // Verify CSP was added
  setTimeout(() => {
    const addedCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!addedCSP) {
      console.error('Failed to add CSP to document');
    }
  }, 100);
}; 