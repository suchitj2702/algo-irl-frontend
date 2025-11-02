import { secureLog } from './secureLogger';

const isBrowser = (): boolean => typeof window !== "undefined";

export function trackEvent(event: string, data?: Record<string, unknown>): void {
  if (!isBrowser()) {
    return;
  }

  const payload = data ?? {};

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, payload);
    }

    if (window.mixpanel?.track) {
      window.mixpanel.track(event, payload);
    }

    if (window.va?.track) {
      window.va.track(event, payload);
    }

    if (import.meta.env.DEV) {
      secureLog.dev('Analytics', `trackEvent: ${event}`, payload);
    }
  } catch (error) {
    secureLog.error('Analytics', error as Error, { event });
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: {
      track?: (event: string, properties?: Record<string, unknown>) => void;
    };
    va?: {
      track?: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}
