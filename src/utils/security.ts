import React, { useRef } from 'react';
import crypto from 'crypto-js';

/**
 * Security Enhancement Module for AlgoIRL Frontend
 * 
 * This module provides several layers of security protection:
 * 1. Browser fingerprinting for device identification
 * 2. Request signing for API authentication
 * 3. Honeypot fields for bot detection
 * 4. Client-side rate limiting
 * 5. Secure API client with built-in security features
 */

// Generate a unique browser fingerprint
export function generateBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    // Canvas fingerprinting (simplified)
    getCanvasFingerprint(),
  ];
  
  return crypto.SHA256(components.join('|')).toString();
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

// Request signing for sensitive operations
export function signRequest(payload: any): { signature: string; timestamp: number } {
  const timestamp = Date.now();
  const message = `${timestamp}:${JSON.stringify(payload)}`;
  
  // Use a client-side key (less secure than server-side, but adds a layer)
  const signature = crypto.HmacSHA256(message, 'client-key').toString();
  
  return { signature, timestamp };
}

// Generate a random honeypot field name
function generateHoneypotFieldName(): string {
  const prefixes = ['user', 'email', 'name', 'phone', 'address'];
  const suffixes = ['field', 'input', 'data', 'info'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}_${suffix}_${Math.random().toString(36).substr(2, 5)}`;
}

// Honeypot field generator
export function HoneypotField(): JSX.Element {
  const fieldName = useRef(generateHoneypotFieldName());
  
  return React.createElement('input', {
    type: 'text',
    name: fieldName.current,
    style: { display: 'none' },
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': 'true'
  });
}

/**
 * Client-side rate limiter to prevent excessive API requests
 * This provides basic protection against brute force attacks and API abuse
 */
class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  canMakeRequest(action: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(action) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(time => time > now - windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(action, recentAttempts);
    
    return true;
  }
  
  getRemainingTime(action: string, windowMs: number): number {
    const attempts = this.attempts.get(action) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const resetTime = oldestAttempt + windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

export const clientRateLimiter = new ClientRateLimiter();

// Secure API client
export class SecureApiClient {
  private fingerprint: string;
  
  constructor() {
    this.fingerprint = generateBrowserFingerprint();
  }
  
  async post<T>(url: string, data: any, options: { signed?: boolean } = {}): Promise<T> {
    // Check client-side rate limit
    if (!clientRateLimiter.canMakeRequest(url, 10, 60000)) {
      const remaining = clientRateLimiter.getRemainingTime(url, 60000);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(remaining / 1000)} seconds.`);
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Client-Fingerprint': this.fingerprint,
    };
    
    // Add signature if requested
    if (options.signed) {
      const { signature, timestamp } = signRequest(data);
      headers['X-Timestamp'] = timestamp.toString();
      headers['X-Signature'] = signature;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'same-origin', // Important for CSRF protection
    });
    
    // Handle rate limit response
    if (response.status === 429) {
      const resetAt = response.headers.get('X-RateLimit-Reset');
      const retryAfter = response.headers.get('Retry-After');
      
      throw new Error(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async get<T>(url: string, options: { signed?: boolean } = {}): Promise<T> {
    // Check client-side rate limit
    if (!clientRateLimiter.canMakeRequest(url, 15, 60000)) {
      const remaining = clientRateLimiter.getRemainingTime(url, 60000);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(remaining / 1000)} seconds.`);
    }
    
    const headers: HeadersInit = {
      'X-Client-Fingerprint': this.fingerprint,
    };
    
    // Add signature if requested (for GET requests, sign the URL and timestamp)
    if (options.signed) {
      const { signature, timestamp } = signRequest({ url, method: 'GET' });
      headers['X-Timestamp'] = timestamp.toString();
      headers['X-Signature'] = signature;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'same-origin',
    });
    
    // Handle rate limit response
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
} 