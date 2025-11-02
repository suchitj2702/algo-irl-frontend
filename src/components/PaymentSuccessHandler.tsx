import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/contexts/FeatureFlagsContext";
import { clearPaymentContext, retrievePaymentContext, trackPaymentEvent } from "@/utils/payment";
import { secureLog } from "@/utils/secureLogger";

type VerificationAttempt = {
  paymentId: string;
  subscriptionId: string;
  signature?: string | null;
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

export function PaymentSuccessHandler() {
  const { flags } = useFeatureFlags();

  // Don't render if payments are disabled
  if (!flags.paymentsEnabled) {
    return null;
  }
  const { refresh } = useSubscription();
  const { getIdToken } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);

  const activePollRef = useRef<number | null>(null);
  const verificationAttemptRef = useRef<VerificationAttempt | null>(null);
  const handlePaymentCallbackRef = useRef<(paymentId: string, subscriptionId: string, signature?: string | null) => Promise<void>>();

  const clearActivePoll = useCallback(() => {
    if (activePollRef.current !== null) {
      window.clearInterval(activePollRef.current);
      activePollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearActivePoll();
    };
  }, [clearActivePoll]);

  const navigateToDestination = useCallback(
    (returnUrl?: string) => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("razorpay_payment_id");
        url.searchParams.delete("razorpay_subscription_id");
        url.searchParams.delete("razorpay_signature");
        window.history.replaceState({}, "", url.toString());
      }

      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate("/my-study-plans");
      }
    },
    [navigate],
  );

  const handleActivatedSubscription = useCallback(async () => {
    toast.success("Subscription activated! Enjoy your premium features!", {
      duration: 5000,
      icon: "✨",
    });

    const paymentContext = retrievePaymentContext();

    if (paymentContext?.preSelectDataset === "full") {
      window.dispatchEvent(
        new CustomEvent("select-dataset", {
          detail: { type: "full" },
        }),
      );
    }

    navigateToDestination(paymentContext?.returnUrl);
    clearPaymentContext();
  }, [navigateToDestination]);

  const handleSuccessfulPayment = useCallback(async () => {
    toast.success("Payment successful! Activating your subscription...", {
      duration: 5000,
      icon: "🎉",
    });

    window.dispatchEvent(new Event("payment-success"));

    const source = typeof window !== "undefined" ? window.sessionStorage.getItem("payment_source") : undefined;
    const feature = typeof window !== "undefined" ? window.sessionStorage.getItem("payment_feature") : undefined;

    trackPaymentEvent("payment_completed", {
      source: source ?? undefined,
      feature: feature ?? undefined,
    });

    clearActivePoll();

    let attempts = 0;

    activePollRef.current = window.setInterval(async () => {
      attempts += 1;

      try {
        const status = await refresh();

        if (status === "active") {
          clearActivePoll();
          await handleActivatedSubscription();
        } else if (attempts >= MAX_POLL_ATTEMPTS) {
          clearActivePoll();
          toast.info("Subscription activation in progress. This may take a few minutes.");
          navigateToDestination();
        }
      } catch (error) {
        secureLog.error('Payment', error as Error, { context: 'subscription-polling' });
      }
    }, POLL_INTERVAL_MS);
  }, [clearActivePoll, handleActivatedSubscription, navigateToDestination, refresh]);

  const retryPayment = useCallback(() => {
    if (!verificationAttemptRef.current || !handlePaymentCallbackRef.current) {
      toast.error("Unable to retry payment. Please try again from the payment page.");
      navigate(-1);
      return;
    }

    const { paymentId, subscriptionId, signature } = verificationAttemptRef.current;
    void handlePaymentCallbackRef.current(paymentId, subscriptionId, signature ?? undefined);
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleRetryRequest = () => {
      retryPayment();
    };

    window.addEventListener("payment-retry-requested", handleRetryRequest);
    return () => window.removeEventListener("payment-retry-requested", handleRetryRequest);
  }, [retryPayment]);

  const handleFailedPayment = useCallback(async () => {
    const source = typeof window !== "undefined" ? window.sessionStorage.getItem("payment_source") : undefined;

    trackPaymentEvent("payment_failed", {
      source: source ?? undefined,
    });

    toast.custom(
      (toastInstance) => (
        <div className="pointer-events-auto w-full max-w-sm rounded-lg border border-red-200 bg-white p-4 shadow-lg dark:border-red-900/40 dark:bg-red-950/40">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-200">
                ✕
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-200">Payment failed. Please try again.</p>
                <p className="mt-1 text-xs text-red-500/80 dark:text-red-300/70">
                  We couldn&apos;t verify your payment. You can retry or contact support if the issue persists.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(toastInstance.id);
                  retryPayment();
                }}
                className="inline-flex items-center justify-center rounded-md bg-mint-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-mint-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: 5000 },
    );

    navigate(-1);
  }, [navigate, retryPayment]);

  const handlePaymentCallback = useCallback(
    async (paymentId: string, subscriptionId: string, signature?: string | null) => {
      if (typeof window === "undefined") {
        return;
      }

      verificationAttemptRef.current = { paymentId, subscriptionId, signature };

      setIsProcessing(true);

      try {
        const idToken = await getIdToken();
        const payload: Record<string, unknown> = {
          paymentId,
          subscriptionId,
        };

        if (signature) {
          payload.signature = signature;
        }

        const response = await fetch("/api/billing/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await handleSuccessfulPayment();
        } else {
          const errorPayload = await response.json().catch(() => ({}));
          const message =
            (errorPayload && typeof errorPayload.message === "string" && errorPayload.message) ||
            (errorPayload && typeof errorPayload.error === "string" && errorPayload.error) ||
            "Payment verification failed. Please try again.";
          secureLog.error('Payment', new Error('Payment verification failed'), { message });
          await handleFailedPayment();
        }
      } catch (error) {
        secureLog.error('Payment', error as Error, { context: 'payment-verification' });
        toast.error("Payment verification failed. Please contact support.");
      } finally {
        setIsProcessing(false);
      }
    },
    [getIdToken, handleFailedPayment, handleSuccessfulPayment],
  );

  useEffect(() => {
    handlePaymentCallbackRef.current = handlePaymentCallback;
  }, [handlePaymentCallback]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("razorpay_payment_id");
    const subscriptionId = params.get("razorpay_subscription_id");
    const signature = params.get("razorpay_signature");

    if (paymentId && subscriptionId) {
      void handlePaymentCallback(paymentId, subscriptionId, signature);
    }
  }, [handlePaymentCallback]);

  const processingOverlay = useMemo(() => {
    if (!isProcessing) {
      return null;
    }

    const content = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl dark:bg-slate-900/95">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-mint-600" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Processing payment…</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Please don&apos;t close this window.</p>
          </div>
        </div>
      </div>
    );

    if (typeof document === "undefined") {
      return content;
    }

    return createPortal(content, document.body);
  }, [isProcessing]);

  return processingOverlay;
}

export default PaymentSuccessHandler;
