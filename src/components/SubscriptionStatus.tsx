import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Loader2, AlertTriangle, CreditCard, Info, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PaymentModal } from "./PaymentModal";
import { trackPaymentEvent } from "@/utils/payment";
import { toast } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionStatusProps {
  variant?: "compact" | "detailed";
  showUpgradeButton?: boolean;
}

const POPOVER_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 6 },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2, ease: "easeIn" } },
};

function formatDate(timestamp: number | null): string {
  if (!timestamp) {
    return "—";
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionStatus({
  variant = "compact",
  showUpgradeButton = variant === "detailed",
}: SubscriptionStatusProps) {
  const {
    status,
    loading,
    isRefreshing,
    refreshError,
    hasActiveSubscription,
    planName,
    currentPeriodEnd,
    daysUntilRenewal,
    paymentMethod,
    isSubscriptionExpiring,
    getSubscriptionDisplayStatus,
    checkSubscriptionStatus,
  } = useSubscription();

  const { getIdToken, user } = useAuth();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentContext, setPaymentContext] = useState<{ feature?: string; returnUrl?: string }>({});
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const popoverAnchorRef = useRef<HTMLDivElement | null>(null);

  const expiringSoon = hasActiveSubscription && isSubscriptionExpiring();
  const statusDisplay = getSubscriptionDisplayStatus();

  const planDisplay = hasActiveSubscription || status === "past_due" ? "Comprehensive" : "Free";
  const nextBillingText =
    status === "canceled"
      ? `Expired on ${formatDate(currentPeriodEnd)}`
      : currentPeriodEnd
        ? formatDate(currentPeriodEnd)
        : status === "past_due"
          ? "Payment required"
          : hasActiveSubscription
            ? "Scheduled"
            : "Not scheduled";

  const badgeConfig = useMemo(() => {
    if (status === "past_due") {
      return "border border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-300";
    }

    if (expiringSoon) {
      return "border border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300";
    }

    if (hasActiveSubscription) {
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
    }

    return "border border-slate-300/60 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200";
  }, [expiringSoon, hasActiveSubscription, status]);

  useEffect(() => {
    if (!isPopoverOpen) {
      return;
    }

    if (typeof document === "undefined") {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!popoverAnchorRef.current?.contains(target)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  const handleOpenPaymentModal = useCallback(
    (feature?: string) => {
      const returnUrl =
        typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : undefined;

      trackPaymentEvent("subscription_payment_modal_opened", {
        variant,
        feature: feature ?? "Subscription",
        status,
      });

      setPaymentContext({ feature, returnUrl });
      setIsPopoverOpen(false);
      setShowPaymentModal(true);
    },
    [status, variant],
  );

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentModal(false);
    toast.success("Payment received! Updating your subscription…");
    void checkSubscriptionStatus(true);
  }, [checkSubscriptionStatus]);

  const handlePaymentFailure = useCallback((error: Error) => {
    toast.error(error.message || "Payment failed. Please try again.");
  }, []);

  const handlePaymentClose = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handleRefresh = useCallback(() => {
    trackPaymentEvent("subscription_status_manual_refresh", { variant, status });
    void checkSubscriptionStatus(true);
  }, [checkSubscriptionStatus, status, variant]);

  const openBillingPortal = useCallback(
    async (action?: "manage" | "cancel") => {
      if (!user) {
        toast.info("Sign in to manage your subscription.");
        return;
      }

      trackPaymentEvent("subscription_portal_open_requested", { action: action ?? "manage", variant });

      try {
        setIsPortalLoading(true);
        const idToken = await getIdToken();

        const response = await fetch("/api/billing/customer-portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify(action ? { action } : {}),
        });

        const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

        if (!response.ok || !payload.url) {
          throw new Error(payload.error || "Unable to open the billing portal right now.");
        }

        window.location.href = payload.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong while opening the billing portal.";
        toast.error(message);
      } finally {
        setIsPortalLoading(false);
      }
    },
    [getIdToken, user, variant],
  );

  const manageButtonDisabled = !hasActiveSubscription && status !== "past_due";

  const renderUpgradeButton = () => {
    if (hasActiveSubscription || !showUpgradeButton) {
      return null;
    }

    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => handleOpenPaymentModal("Subscription Upgrade")}
        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-mint-600 to-mint-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 hover:from-mint-700 hover:to-mint-800"
      >
        Upgrade to Pro
      </motion.button>
    );
  };

  const renderPastDueWarning = () => {
    if (status !== "past_due") {
      return null;
    }

    return (
      <motion.div
        key="past-due"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div className="space-y-2">
            <p>Payment failed. Update payment method to maintain access.</p>
            <button
              type="button"
              onClick={() => handleOpenPaymentModal("Payment Update")}
              className="inline-flex rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Update Payment
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderExpiringWarning = () => {
    if (!expiringSoon || daysUntilRenewal == null) {
      return null;
    }

    return (
      <motion.div
        key="expiring"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="mb-4 rounded-lg border border-amber-200 bg-yellow-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div className="space-y-2">
            <p>Your subscription expires in {daysUntilRenewal} days.</p>
            <button
              type="button"
              onClick={() => handleOpenPaymentModal("Subscription Renewal")}
              className="text-sm font-medium text-amber-700 underline transition hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              Renew now
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (variant === "compact") {
    return (
      <div ref={popoverAnchorRef} className="relative flex items-center">
        <button
          type="button"
          onClick={() => setIsPopoverOpen((value) => !value)}
          className="group inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 hover:bg-white/60 dark:hover:bg-white/10"
        >
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${badgeConfig}`}
          >
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            {hasActiveSubscription ? "PRO" : "FREE"}
          </span>
          {(loading || isRefreshing) && <Loader2 className="h-3.5 w-3.5 animate-spin text-content-muted" aria-hidden="true" />}
        </button>

        <AnimatePresence>
          {isPopoverOpen && (
            <motion.div
              key="subscription-popover"
              variants={POPOVER_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-outline-subtle/40 bg-white/95 p-4 text-sm shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-content-muted">Status</p>
                  <p className="text-sm font-semibold text-content">{statusDisplay}</p>
                </div>
                <Crown className="h-4 w-4 text-mint-600" aria-hidden="true" />
              </div>

              <dl className="space-y-2 text-xs text-content-muted">
                <div className="flex justify-between">
                  <dt>Plan</dt>
                  <dd className="text-content">{planDisplay}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Next billing</dt>
                  <dd className="text-content">{nextBillingText}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Payment method</dt>
                  <dd className="text-content">{paymentMethod ?? "—"}</dd>
                </div>
              </dl>

              {refreshError && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                  <p>{refreshError.message}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1 rounded-md border border-outline-subtle/60 px-2.5 py-1 text-xs font-medium text-content transition hover:border-mint-500 hover:text-mint-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Refresh
                </button>
                {renderUpgradeButton()}
              </div>

              {renderPastDueWarning()}
              {renderExpiringWarning()}
            </motion.div>
          )}
        </AnimatePresence>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          feature={paymentContext.feature}
          returnUrl={paymentContext.returnUrl}
        />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="subscription-status-detailed"
          variants={CARD_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative overflow-hidden rounded-2xl border border-outline-subtle/60 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90"
        >
          {isRefreshing && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70">
              <Loader2 className="h-5 w-5 animate-spin text-mint-600" aria-hidden="true" />
              <span className="ml-2 text-sm font-medium text-content-muted">Syncing subscription…</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeConfig}`}>
              <Crown className="h-4 w-4" aria-hidden="true" />
              {hasActiveSubscription ? "PRO" : "FREE"}
            </span>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-content-muted">Current plan</p>
              <p className="text-lg font-semibold text-content">{planDisplay}</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-md border border-outline-subtle/60 px-3 py-1.5 text-xs font-medium text-content transition hover:border-mint-500 hover:text-mint-600"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-outline-subtle/40 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-content-muted">Status</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-content">
                  {statusDisplay}
                  {refreshError && (
                    <Info className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-outline-subtle/40 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-content-muted">Next billing</p>
                <p className="mt-1 text-sm font-semibold text-content">{nextBillingText}</p>
              </div>
              <div className="rounded-xl border border-outline-subtle/40 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-content-muted">Payment method</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-content">
                  <CreditCard className="h-4 w-4 text-content-muted" aria-hidden="true" />
                  {paymentMethod ?? "Not on file"}
                </p>
              </div>
              <div className="rounded-xl border border-outline-subtle/40 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wide text-content-muted">Plan cadence</p>
                <p className="mt-1 text-sm font-semibold text-content">
                  {planName ? (planName === "yearly" ? "Yearly billing" : "Monthly billing") : "Free tier"}
                </p>
              </div>
            </div>

            <AnimatePresence>
              {renderPastDueWarning()}
              {renderExpiringWarning()}
            </AnimatePresence>

            {refreshError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-200">
                <p>{refreshError.message}</p>
                <p className="mt-1 text-xs text-red-500/80">Try refreshing your status or contact support if the issue persists.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-content-muted dark:text-content-subtle">
              <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Manage billing and invoices from the subscription portal.
            </div>
            <div className="flex items-center gap-3">
              {renderUpgradeButton()}
              <button
                type="button"
                onClick={() => openBillingPortal("manage")}
                disabled={manageButtonDisabled || isPortalLoading}
                className="inline-flex items-center justify-center rounded-lg border border-outline-subtle/60 px-4 py-2 text-sm font-medium text-content transition hover:border-mint-500 hover:text-mint-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPortalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="ml-2">Opening…</span>
                  </>
                ) : (
                  "Manage subscription"
                )}
              </button>
              {hasActiveSubscription && (
                <button
                  type="button"
                  onClick={() => openBillingPortal("cancel")}
                  className="text-sm font-medium text-content-muted underline transition hover:text-red-500"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        feature={paymentContext.feature ?? (hasActiveSubscription ? "Subscription Renewal" : "Subscription Upgrade")}
        returnUrl={paymentContext.returnUrl}
      />
    </>
  );
}
