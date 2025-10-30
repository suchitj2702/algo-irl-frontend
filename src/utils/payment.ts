import type { RazorpayErrorResponse, RazorpayOptions } from "@types/razorpay";

const PAYMENT_CONTEXT_KEY = "payment_context";
const PAYMENT_CONTEXT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const AUTH_USER_STORAGE_KEY = "algoIRL.auth.user";

let razorpayScriptPromise: Promise<boolean> | null = null;

/**
 * Shape of the payment context persisted in session storage.
 */
export interface PaymentContext {
  returnUrl?: string;
  feature?: string;
  preSelectDataset?: "full" | "blind75";
  timestamp: number;
}

/**
 * Lightweight representation of the persisted auth user.
 */
interface StoredAuthUser {
  uid?: string;
  email?: string | null;
  displayName?: string | null;
}

/**
 * Safely determines whether the current runtime is a browser.
 */
const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * Persists the provided payment context in sessionStorage with a fresh timestamp.
 *
 * @param context - Contextual information to retain across navigation.
 */
export function storePaymentContext(context: PaymentContext): void {
  if (!isBrowser()) {
    return;
  }

  const contextWithTimestamp: PaymentContext = {
    ...context,
    timestamp: Date.now(),
  };

  try {
    window.sessionStorage.setItem(PAYMENT_CONTEXT_KEY, JSON.stringify(contextWithTimestamp));
  } catch (error) {
    console.error("Failed to persist payment context", error);
  }
}

/**
 * Retrieves the stored payment context, enforcing a 24-hour freshness window.
 *
 * @returns The payment context if available and fresh; otherwise, null.
 */
export function retrievePaymentContext(): PaymentContext | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(PAYMENT_CONTEXT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PaymentContext;
    if (!parsed?.timestamp) {
      window.sessionStorage.removeItem(PAYMENT_CONTEXT_KEY);
      return null;
    }

    const isFresh = Date.now() - parsed.timestamp <= PAYMENT_CONTEXT_TTL_MS;
    if (!isFresh) {
      clearPaymentContext();
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Invalid payment context detected; clearing stored value.", error);
    clearPaymentContext();
    return null;
  }
}

/**
 * Removes the stored payment context from sessionStorage.
 */
export function clearPaymentContext(): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(PAYMENT_CONTEXT_KEY);

  if (import.meta.env.DEV) {
    console.debug("[payment] Cleared payment context");
  }
}

/**
 * Formats INR and USD pricing for display in the UI.
 *
 * @param inr - Price in Indian Rupees.
 * @param usd - Price in US Dollars.
 * @returns An object containing primary and secondary display strings.
 */
export function formatPriceDisplay(inr: number, usd: number): { primary: string; secondary: string } {
  const formattedInr = Number.isFinite(inr) ? Math.round(inr).toLocaleString("en-IN") : "0";
  const formattedUsd = Number.isFinite(usd) ? usd.toFixed(2) : "0.00";

  return {
    primary: `₹${formattedInr}/month`,
    secondary: `($${formattedUsd} USD)`,
  };
}

/**
 * Dynamically injects the Razorpay checkout script if it is not already available.
 *
 * @returns A promise resolving to true when the script is ready, false on failure.
 */
export function loadRazorpayScript(): Promise<boolean> {
  if (!isBrowser()) {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => resolve(true);
    const handleError = (event: Event | string) => {
      console.error("Failed to load Razorpay script", event);
      if (existingScript) {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError as EventListener);
      }
      razorpayScriptPromise = null;
      resolve(false);
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError as EventListener, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError as OnErrorEventHandler;
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

/**
 * Constructs the Razorpay configuration used during checkout initialization.
 *
 * @param subscriptionId - Identifier returned by the backend subscription creation call.
 * @param prefill - Optional prefill details for the checkout form.
 * @throws If the Razorpay key is not defined in the environment.
 */
export function getRazorpayConfig(
  subscriptionId: string,
  prefill?: { email?: string; name?: string },
): RazorpayOptions {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!key) {
    throw new Error("Razorpay key is not configured.");
  }

  return {
    key,
    subscription_id: subscriptionId,
    name: "AlgoIRL",
    description: "Comprehensive Plan Subscription",
    image: "/logo.png",
    prefill,
    theme: {
      color: "#10b981",
    },
    retry: {
      enabled: true,
      max_count: 2,
    },
    modal: {
      ondismiss: () => {
        trackPaymentEvent("razorpay_modal_dismissed", { subscriptionId });
      },
    },
    notes: {
      source: "payment-utils",
    },
  };
}

/**
 * Interprets Razorpay error payloads into user-friendly messaging.
 *
 * @param error - The error object thrown by Razorpay or the network layer.
 * @returns A structured error response containing message, code, and recoverability.
 */
export function handleRazorpayError(error: unknown): { message: string; code?: string; recoverable: boolean } {
  console.error("Razorpay error encountered", error);

  const defaultResult = {
    message: "Something went wrong with the payment. Please try again.",
    code: undefined,
    recoverable: true,
  };

  if (error && typeof error === "object" && "error" in error) {
    const { error: details } = error as RazorpayErrorResponse;
    const message = details.description || defaultResult.message;
    const code = details.code;
    const nonRecoverableCodes = new Set(["BAD_REQUEST_ERROR", "INVALID_OPTIONS", "INVALID_SECRET"]);

    return {
      message,
      code,
      recoverable: code ? !nonRecoverableCodes.has(code) : defaultResult.recoverable,
    };
  }

  if (error instanceof Error) {
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      return {
        message: "Network error. Please check your connection and try again.",
        code: "NETWORK_ERROR",
        recoverable: true,
      };
    }

    return {
      message: error.message || defaultResult.message,
      code: "UNKNOWN_ERROR",
      recoverable: true,
    };
  }

  return defaultResult;
}

/**
 * Emits a payment analytics event to available providers and development logs.
 *
 * @param event - Event name for analytics pipelines.
 * @param data - Optional contextual payload to attach to the event.
 */
export function trackPaymentEvent(event: string, data?: Record<string, unknown>): void {
  if (!isBrowser()) {
    return;
  }

  const timestamp = new Date().toISOString();
  const user = readStoredUser();

  const payload = {
    event,
    timestamp,
    ...data,
    user: user ?? undefined,
  };

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, payload);
    }

    if (window.mixpanel?.track) {
      window.mixpanel.track(event, payload);
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[payment] trackPaymentEvent", payload);
    }
  } catch (error) {
    console.error("Failed to send payment analytics event", error);
  }
}

/**
 * Attempts to read the persisted auth user for analytics enrichment.
 */
function readStoredUser(): StoredAuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAuthUser;
  } catch (error) {
    console.warn("Failed to parse stored auth user", error);
    return null;
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: {
      track?: (event: string, properties?: Record<string, unknown>) => void;
    };
    Razorpay?: typeof import("@types/razorpay").RazorpayConstructor;
  }
}
