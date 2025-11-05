import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Check, X } from "lucide-react";
import type { RazorpayErrorResponse, RazorpayInstance, RazorpayOptions, RazorpayResponse } from "@types/razorpay";
import { useAuth } from "../contexts/AuthContext";
import { secureLog } from "../utils/secureLogger";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const RETURN_URL_STORAGE_KEY = "payment_return_url";
const FEATURE_STORAGE_KEY = "payment_feature";
// Plan ID can be overridden via environment variable for testing
const PLAN_ID = import.meta.env.VITE_RAZORPAY_PLAN_ID || "plan_monthly_study_plan_inr";

type ScriptStatus = "idle" | "loading" | "ready" | "failed";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
  feature?: string;
  onSuccess?: (response: RazorpayResponse) => void;
  onFailure?: (error: Error, payload?: RazorpayErrorResponse) => void;
}

interface CreateSubscriptionResponse {
  subscriptionId?: string;
  shortUrl?: string;
  error?: string;
  message?: string;
}

const initialScriptStatus: ScriptStatus =
  typeof window !== "undefined" && window.Razorpay ? "ready" : "idle";

export function PaymentModal({
  isOpen,
  onClose,
  returnUrl,
  feature,
  onSuccess,
  onFailure,
}: PaymentModalProps) {
  const { getIdToken, user } = useAuth();

  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>(initialScriptStatus);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureRazorpayScript = useCallback((): Promise<void> => {
    if (typeof window === "undefined") {
      setScriptStatus("failed");
      return Promise.reject(new Error("Payment system requires a browser environment"));
    }

    if (window.Razorpay) {
      setScriptStatus("ready");
      return Promise.resolve();
    }

    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;

    setScriptStatus("loading");

    return new Promise((resolve, reject) => {
      const handleLoad = () => {
        setScriptStatus("ready");
        resolve();
      };

      const handleError = () => {
        setScriptStatus("failed");
        secureLog.error('Payment', new Error(`Failed to load Razorpay script from ${RAZORPAY_SCRIPT_URL}`), {
          hint: 'Check network connectivity or browser extensions'
        });
        reject(new Error("Failed to load payment system. Please check your internet connection or disable ad-blockers and try again."));
      };

      if (existingScript) {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener("error", handleError, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      script.onload = handleLoad;
      script.onerror = handleError;
      document.body.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setError(null);

    if (typeof window !== "undefined") {
      if (returnUrl) {
        sessionStorage.setItem(RETURN_URL_STORAGE_KEY, returnUrl);
      } else {
        sessionStorage.removeItem(RETURN_URL_STORAGE_KEY);
      }

      if (feature) {
        sessionStorage.setItem(FEATURE_STORAGE_KEY, feature);
      } else {
        sessionStorage.removeItem(FEATURE_STORAGE_KEY);
      }
    }

    ensureRazorpayScript().catch(() => {
      setError("Payment gateway unavailable");
    });
  }, [ensureRazorpayScript, feature, isOpen, returnUrl]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isActionDisabled = isProcessing || scriptStatus === "loading" || scriptStatus === "failed";

  const handlePaymentFailed = useCallback(
    (response: RazorpayErrorResponse) => {
      const message = response.error.description || "Payment failed. Please try again.";
      setError(message);
      setIsProcessing(false);
      onFailure?.(new Error(message), response);
    },
    [onFailure],
  );

  const handlePaymentSuccess = useCallback(
    (response: RazorpayResponse) => {
      setIsProcessing(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("payment-success", { detail: response }));
      }
      onSuccess?.(response);
      onClose();
    },
    [onClose, onSuccess],
  );

  const handleProceedToPayment = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (typeof window === "undefined") {
        throw new Error("Payment system requires a browser environment");
      }

      await ensureRazorpayScript();

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!key) {
        secureLog.error('Payment', new Error('Razorpay API key not configured'), {
          hint: 'Check VITE_RAZORPAY_KEY_ID environment variable'
        });
        throw new Error("Payment configuration missing. Please contact support.");
      }

      // Log warning in development if using test key
      if (import.meta.env.DEV && key.includes('test')) {
        secureLog.warn('Payment', 'Using test Razorpay key');
      }

      const idToken = await getIdToken();

      const payload: Record<string, unknown> = {
        planId: PLAN_ID,
        metadata: {
          source: "modal",
          ...(feature ? { feature } : {}),
        },
      };

      // Debug logging for development
      if (import.meta.env.DEV) {
        secureLog.dev('Payment', 'Creating subscription', { planId: PLAN_ID });
      }

      if (returnUrl) {
        payload.returnUrl = returnUrl;
      }

      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(payload),
      }).catch((networkError: unknown) => {
        throw networkError ?? new Error("Network error. Please try again.");
      });

      let responseBody: CreateSubscriptionResponse | null = null;
      try {
        responseBody = (await response.json()) as CreateSubscriptionResponse;
      } catch {
        // Swallow JSON parse errors to fall back to generic messaging.
      }

      if (!response.ok) {
        const apiMessage = responseBody?.error || responseBody?.message;

        // CRITICAL: DO NOT LOG FULL RESPONSE BODY - May contain sensitive payment data
        secureLog.error('Payment', new Error('API request failed'), {
          status: response.status,
          endpoint: '/billing/create-subscription',
        });

        // Provide specific error messages for common issues
        if (apiMessage?.toLowerCase().includes('invalid planid')) {
          throw new Error("Subscription plan configuration error. Please contact support.");
        }

        throw new Error(apiMessage || "Network error. Please try again.");
      }

      if (!responseBody?.subscriptionId) {
        if (responseBody?.shortUrl) {
          window.location.href = responseBody.shortUrl;
          return;
        }

        throw new Error("Failed to create subscription. Please try again.");
      }

      const razorpayConstructor = window.Razorpay;

      if (!razorpayConstructor) {
        secureLog.error('Payment', new Error('Razorpay SDK not loaded properly'));
        throw new Error("Payment system initialization failed. Please refresh the page and try again.");
      }

      const options: RazorpayOptions = {
        key,
        name: "AlgoIRL",
        description: "Comprehensive Plan Subscription",
        image: "/logo.png",
        subscription_id: responseBody.subscriptionId,
        handler: handlePaymentSuccess,
        prefill: {
          email: user?.email ?? undefined,
        },
        notes: {
          source: "payment-modal",
          ...(feature ? { feature } : {}),
        },
        theme: {
          color: "#0FB37C",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay: RazorpayInstance = new razorpayConstructor(options);
      razorpay.on("payment.failed", handlePaymentFailed);
      razorpay.open();
    } catch (err: unknown) {
      secureLog.error('Payment', err as Error);

      let displayMessage = "Network error. Please try again.";

      if (err instanceof Error) {
        if (err.message === "Failed to fetch" || err.name === "TypeError") {
          displayMessage = "Network error. Please try again.";
        } else {
          displayMessage = err.message || displayMessage;
        }
        onFailure?.(err);
      } else {
        onFailure?.(new Error("Payment failed due to an unknown error."));
      }

      if (displayMessage.toLowerCase().includes("network")) {
        setError("Network error. Please try again.");
      } else if (displayMessage.toLowerCase().includes("gateway unavailable")) {
        setError("Payment gateway unavailable");
      } else {
        setError(displayMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    ensureRazorpayScript,
    feature,
    getIdToken,
    handlePaymentFailed,
    handlePaymentSuccess,
    onFailure,
    returnUrl,
    user?.email,
  ]);

  const actionLabel = useMemo(() => {
    if (scriptStatus === "loading") {
      return "Loading payment gateway...";
    }

    if (isProcessing) {
      return "Initializing payment...";
    }

    return "Proceed to Payment";
  }, [isProcessing, scriptStatus]);

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-black/5 bg-white/95 p-8 text-left shadow-[0_30px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl transition-all dark:border-white/10 dark:bg-surface-elevated/90 dark:text-content"
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 rounded-full p-2 text-content-muted transition hover:bg-black/5 hover:text-content dark:hover:bg-white/10"
                aria-label="Close payment modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col gap-6 sm:gap-8">
                <header className="flex flex-col gap-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-mint-100 via-mint-50 to-mint-200 text-mint-700 dark:from-mint-500/20 dark:via-mint-500/10 dark:to-mint-400/20">
                    <Crown className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="font-playfair text-2xl font-semibold text-content sm:text-3xl">
                      Unlock Comprehensive Plan
                    </h2>
                    <p className="mt-2 text-sm text-content-muted">
                      Access curated resources and premium study material instantly.
                    </p>
                  </div>
                </header>

                <section className="rounded-2xl border border-black/5 bg-mint-50/60 p-5 text-center shadow-inner dark:border-white/10 dark:bg-mint-500/10">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-mint-700 dark:text-mint-200">
                      Comprehensive Plan
                    </p>
                    <p className="text-4xl font-bold text-mint-700 dark:text-mint-100">
                      ₹799<span className="text-lg font-medium text-mint-600 dark:text-mint-200">/month</span>
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-mint-600 dark:text-mint-300">
                      ≈ $9.99 USD
                    </p>
                  </div>
                </section>

                <section className="space-y-4">
                  <ul className="space-y-3">
                    {[
                      "Access to 2000+ curated problems",
                      "Comprehensive topic coverage",
                      "Advanced study plans",
                      "Priority support",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-content">
                        <span className="mt-1 rounded-full bg-mint-100 p-1 text-mint-600 dark:bg-mint-500/20 dark:text-mint-200">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="leading-6 text-content-muted dark:text-content-subtle">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-content-muted">
                    {["Cards", "UPI", "NetBanking", "Wallets"].map((method) => (
                      <span
                        key={method}
                        className="rounded-full border border-black/10 bg-white px-3 py-1 shadow-sm transition hover:border-mint-300 hover:text-mint-700 dark:border-white/10 dark:bg-surface-elevated/80 dark:hover:border-mint-400 dark:hover:text-mint-200"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </section>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isActionDisabled}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#7DD3FC] to-[#60A5FA] px-6 py-4 text-sm font-semibold text-white shadow-lightblue-glow transition hover:from-[#60A5FA] hover:to-[#3B82F6] hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-50 disabled:hover:from-[#7DD3FC] disabled:hover:to-[#60A5FA] disabled:hover:scale-100 disabled:hover:translate-y-0"
                >
                  {(isProcessing || scriptStatus === "loading") && (
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {actionLabel}
                </button>

                <div className="flex flex-col items-center gap-2 text-xs text-content-muted sm:flex-row sm:justify-center">
                  <span>🔒 Secure payment</span>
                  <span className="hidden text-content-muted sm:inline">•</span>
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PaymentModal;
