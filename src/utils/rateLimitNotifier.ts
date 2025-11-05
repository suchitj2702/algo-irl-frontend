const RATE_LIMIT_MESSAGE = 'Rate limit exceeded. Please wait before trying again.';

type RateLimitListener = (message: string) => void;

const listeners = new Set<RateLimitListener>();

export function subscribeToRateLimit(listener: RateLimitListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyRateLimitExceeded(message: string = RATE_LIMIT_MESSAGE) {
  listeners.forEach((listener) => {
    try {
      listener(message);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('RateLimitNotifier listener error:', err);
      }
    }
  });
}

export function getDefaultRateLimitMessage() {
  return RATE_LIMIT_MESSAGE;
}
