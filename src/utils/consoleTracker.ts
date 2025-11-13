/**
 * Console Tracker Utility
 *
 * Tracks the last N console logs in a circular buffer for issue reporting.
 * Integrates with the secure logger and sanitizes sensitive information.
 */

export interface ConsoleLogEntry {
  timestamp: string; // ISO 8601 format
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
}

class ConsoleTracker {
  private logs: ConsoleLogEntry[] = [];
  private readonly maxLogs: number = 10;

  /**
   * Track a console log entry
   */
  track(level: ConsoleLogEntry['level'], message: string): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitize(message),
    });

    // Remove oldest log if we exceed the limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get all tracked logs (returns a copy)
   */
  getLogs(): ConsoleLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all tracked logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Sanitize sensitive information from log messages
   */
  private sanitize(message: string): string {
    if (typeof message !== 'string') {
      try {
        message = JSON.stringify(message);
      } catch {
        message = String(message);
      }
    }

    // Remove common sensitive patterns
    let sanitized = message
      // API keys (common patterns)
      .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[API_KEY_REDACTED]')
      .replace(/pk_live_[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
      .replace(/pk_test_[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
      // Bearer tokens
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]')
      // JWT tokens (looks for pattern xxx.yyy.zzz)
      .replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[JWT_TOKEN_REDACTED]')
      // Email addresses
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]')
      // Credit card numbers (simple pattern)
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER_REDACTED]')
      // Phone numbers (simple pattern)
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')
      // Firebase API keys
      .replace(/AIza[a-zA-Z0-9_-]{35}/g, '[FIREBASE_KEY_REDACTED]')
      // Password-like patterns in URLs or JSON
      .replace(/(password|pwd|passwd)["']?\s*[:=]\s*["']?[^"',\s}]+/gi, '$1=[PASSWORD_REDACTED]');

    // Truncate very long messages
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '... [TRUNCATED]';
    }

    return sanitized;
  }
}

// Export singleton instance
export const consoleTracker = new ConsoleTracker();
