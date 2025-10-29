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
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net https://checkout.razorpay.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net https://fonts.googleapis.com https://checkout.razorpay.com https://accounts.google.com;
      img-src 'self' data: blob: https:;
      connect-src 'self' ${apiUrl} https://judge0-ce.p.rapidapi.com https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://accounts.google.com https://*.google.com https://*.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com ws: wss:;
      font-src 'self' data: blob: https://cdn.jsdelivr.net https://fonts.gstatic.com;
      frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://algoirl.ai https://*.algoirl.ai;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://checkout.razorpay.com;
    `.replace(/\s+/g, ' ').trim());
  } else {
    // Production - More restrictive but still Monaco compatible
    const cspContent = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net https://checkout.razorpay.com https://va.vercel-scripts.com https://apis.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net https://fonts.googleapis.com https://checkout.razorpay.com https://accounts.google.com;
      img-src 'self' data: blob: https:;
      connect-src 'self' ${apiUrl} https://judge0-ce.p.rapidapi.com https://firebaseinstallations.googleapis.com https://firebaseremoteconfig.googleapis.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://accounts.google.com https://*.google.com https://*.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com;
      font-src 'self' data: blob: https://cdn.jsdelivr.net https://fonts.gstatic.com;
      frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com https://*.firebaseapp.com https://*.google.com https://algoirl.ai https://*.algoirl.ai;
      worker-src 'self' blob: data:;
      child-src 'self' blob: data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://checkout.razorpay.com;
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
