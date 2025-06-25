/**
 * Frontend API Request Signing Utilities
 * Provides HMAC-SHA256 signature generation for API authentication
 */

/**
 * Generates HMAC-SHA256 signature for API requests (browser-compatible)
 */
export async function generateRequestSignature(
  payload: Record<string, unknown>,
  timestamp: number,
  secret: string
): Promise<string> {
  const message = `${timestamp}:${JSON.stringify(payload)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const key = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', 
    key, 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates signed headers for API requests
 */
export async function createSignedHeaders(
  payload: Record<string, unknown> = {},
  additionalHeaders: Record<string, string> = {}
): Promise<Record<string, string>> {
  const secret = import.meta.env.VITE_REQUEST_SIGNATURE_SECRET;
  if (!secret) {
    throw new Error('VITE_REQUEST_SIGNATURE_SECRET is not configured');
  }
  
  const timestamp = Date.now();
  const signature = await generateRequestSignature(payload, timestamp, secret);
  
  return {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    ...additionalHeaders
  };
}

/**
 * Wrapper for fetch with automatic request signing
 */
export async function signedFetch(
  url: string,
  options: Omit<RequestInit, 'body'> & { body?: any } = {}
): Promise<Response> {
  const { body, ...restOptions } = options;
  
  // Parse body if it's a string, otherwise use as-is
  const payload = typeof body === 'string' ? JSON.parse(body) : (body || {});
  
  // Generate signed headers
  const signedHeaders = await createSignedHeaders(payload, options.headers as Record<string, string>);
  
  return fetch(url, {
    ...restOptions,
    headers: signedHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(payload)
  });
}

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
 * Handle API response errors with authentication awareness
 */
export async function handleAPIResponse(response: Response) {
  if (response.status === 401) {
    throw new APIAuthenticationError('API request authentication failed. Please refresh the page.');
  }
  
  if (response.status === 429) {
    throw new APIAuthenticationError('Too many requests. Please wait before trying again.');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }
  
  return response.json();
} 