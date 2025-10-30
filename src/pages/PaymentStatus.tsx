import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

type PaymentRouteStatus = "success" | "failed" | "pending";

function isValidStatus(value: string | undefined): value is PaymentRouteStatus {
  return value === "success" || value === "failed" || value === "pending";
}

export default function PaymentStatusPage() {
  const params = useParams<{ status?: string }>();
  const status: PaymentRouteStatus | undefined = isValidStatus(params.status) ? params.status : undefined;

  const navigate = useNavigate();
  const { refresh } = useSubscription();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (status !== "success") {
      return;
    }

    void refresh();
    setCountdown(5);

    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          navigate("/my-study-plans", { replace: true });
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [navigate, refresh, status]);

  useEffect(() => {
    if (status !== "pending") {
      return;
    }

    const poll = window.setInterval(async () => {
      try {
        const nextStatus = await refresh();
        if (nextStatus === "active") {
          window.clearInterval(poll);
          navigate("/payment/status/success", { replace: true });
        }
      } catch (error) {
        console.error("Payment status polling failed:", error);
      }
    }, 2000);

    return () => window.clearInterval(poll);
  }, [navigate, refresh, status]);

  const retryPayment = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("payment-retry-requested"));
    }
  }, []);

  const pendingContent = useMemo(
    () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center px-6">
          <Clock className="mx-auto h-24 w-24 text-amber-500 animate-pulse" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Payment Processing</h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Your payment is being processed. This may take a few moments.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-mint-600" aria-hidden="true" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Please don&apos;t close this window.</p>
          </div>
        </div>
      </div>
    ),
    [],
  );

  const successContent = useMemo(
    () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-mint-50/60 to-white dark:from-slate-950 dark:via-mint-950/40 dark:to-slate-900">
        <div className="max-w-lg text-center px-6 py-10">
          <CheckCircle className="mx-auto h-24 w-24 text-mint-500" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Payment Successful!</h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Your Comprehensive Plan is now active.
          </p>
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-mint-200 bg-mint-50 p-6 text-left shadow-sm dark:border-mint-800/40 dark:bg-mint-900/20">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">What&apos;s next?</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <li>✓ Access 2000+ curated problems</li>
                <li>✓ Create unlimited study plans</li>
                <li>✓ Track your progress</li>
                <li>✓ Unlock premium insights</li>
              </ul>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting in {countdown} seconds...</p>
            <button
              type="button"
              onClick={() => navigate("/my-study-plans")}
              className="inline-flex items-center justify-center rounded-lg bg-mint-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500"
            >
              Go to Study Plans
            </button>
          </div>
        </div>
      </div>
    ),
    [countdown, navigate],
  );

  const failedContent = useMemo(
    () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-lg text-center px-6 py-10">
          <XCircle className="mx-auto h-24 w-24 text-red-500" aria-hidden="true" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Payment Failed</h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            We couldn&apos;t process your payment. Please try again.
          </p>
          <div className="mt-8 space-y-6 text-left">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/40 dark:bg-red-900/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Common issues</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <li>• Insufficient funds</li>
                <li>• Card declined by bank</li>
                <li>• Incorrect card details</li>
                <li>• Network timeout</li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={retryPayment}
                className="flex-1 rounded-lg bg-mint-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-mint-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    [navigate, retryPayment],
  );

  if (!status) {
    return <Navigate to="/" replace />;
  }

  if (status === "success") {
    return successContent;
  }

  if (status === "failed") {
    return failedContent;
  }

  return pendingContent;
}
