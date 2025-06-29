/**
 * Frontend API Request Signing Utilities
 * Provides HMAC-SHA256 signature generation for API authentication
 */

/**
 * Creates deterministic JSON string with sorted keys to match backend behavior
 */
function deterministicStringify(obj: Record<string, unknown>): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  
  // Sort keys to ensure consistent ordering with backend
  const sortedKeys = Object.keys(obj).sort();
  const pairs: string[] = [];
  
  for (const key of sortedKeys) {
    const value = obj[key];
    let valueStr: string;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      valueStr = deterministicStringify(value as Record<string, unknown>);
    } else {
      valueStr = JSON.stringify(value);
    }
    
    pairs.push(`"${key}":${valueStr}`);
  }
  
  return `{${pairs.join(',')}}`;
}

/**
 * Generates HMAC-SHA256 signature for API requests (browser-compatible)
 */
export async function generateRequestSignature(
  payload: Record<string, unknown>,
  timestamp: number,
  secret: string,
  debugInfo?: { clientTime: number; payloadStr: string }
): Promise<string> {
  // Use deterministic JSON serialization to match backend
  const payloadStr = deterministicStringify(payload);
  const message = `${timestamp}:${payloadStr}`;
  
  // Store debug info if provided
  if (debugInfo) {
    debugInfo.clientTime = Date.now();
    debugInfo.payloadStr = payloadStr;
  }
  
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
  
  // Use exact current time
  const timestamp = Date.now();
  
  // Debug info object
  const debugInfo = { clientTime: 0, payloadStr: '' };
  const signature = await generateRequestSignature(payload, timestamp, secret, debugInfo);
  
  // Create debug headers that backend can log
  const debugHeaders = {
    'X-Debug-Client-Time': timestamp.toString(),
    'X-Debug-Payload-Keys': Object.keys(payload).sort().join(','),
    'X-Debug-Payload-Length': debugInfo.payloadStr.length.toString(),
    'X-Debug-UA': navigator.userAgent,
    'X-Debug-Timezone-Offset': new Date().getTimezoneOffset().toString(),
    'X-Debug-Serialization': debugInfo.payloadStr.substring(0, 100), // First 100 chars for debugging
  };
  
  return {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
    ...debugHeaders,
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
  
  // Ensure the request body uses the same deterministic serialization
  const requestBody = typeof body === 'string' ? body : deterministicStringify(payload);
  
  const response = await fetch(url, {
    ...restOptions,
    headers: signedHeaders,
    body: requestBody
  });
  
  // If we get a 401, send additional debug info to a logging endpoint
  if (response.status === 401) {
    try {
      // Send debug info without signature (since signing is failing)
      await fetch(url.replace('/problem/prepare', '/debug/signature-failure'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: url,
          clientTimestamp: signedHeaders['X-Timestamp'],
          debugHeaders: Object.keys(signedHeaders)
            .filter(k => k.startsWith('X-Debug-'))
            .reduce((obj, k) => ({ ...obj, [k]: signedHeaders[k] }), {}),
          payloadSnapshot: requestBody.substring(0, 200), // First 200 chars
        })
      }).catch(() => {}); // Ignore debug logging failures
    } catch (e) {
      // Silently ignore debug logging errors
    }
  }
  
  return response;
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