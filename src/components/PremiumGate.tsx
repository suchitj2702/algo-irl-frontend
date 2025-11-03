import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Crown, Check, Clock } from "lucide-react";
import { useFeatureFlags } from "../contexts/FeatureFlagsContext";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../hooks/useSubscription";
import { useAuthDialog } from "../contexts/AuthDialogContext";
import { AuthProviderList } from "./auth/AuthProviderList";
import { secureLog } from "../utils/secureLogger";
import { loadRazorpayScript } from "../utils/payment";
import type { RazorpayConstructor, RazorpayErrorResponse, RazorpayInstance, RazorpayOptions } from "@types/razorpay";

interface PremiumGateProps {
  children: ReactNode;
  feature: string;
  message?: string;
}

export function PremiumGate({
  children,
  feature,
  message,
}: PremiumGateProps) {
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const { user, loading: authLoading, signInWithGoogle, error: authError, clearError } = useAuth();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { suppressNavSignInButton } = useAuthDialog();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!user) {
      const release = suppressNavSignInButton();
      return release;
    }
    return undefined;
  }, [user, suppressNavSignInButton]);

  const handleGoogleSignIn = useCallback(async () => {
    setSigningIn(true);
    try {
      clearError();
      await signInWithGoogle();
    } catch {
      // AuthContext surfaces the error message
    } finally {
      setSigningIn(false);
    }
  }, [signInWithGoogle, clearError]);

  // Skip loading state if we already know user is not authenticated
  // This prevents double-render: "Loading..." → "Sign in required"
  if (flagsLoading || (authLoading && user !== null) || (subscriptionLoading && Boolean(user))) {
    return <div className="flex items-center justify-center p-8 text-sm text-content-muted">Loading...</div>;
  }

  // PRIORITY 1: ALWAYS require authentication for study plans
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-start justify-center px-4 pb-12 pt-24 sm:px-6">
        <div className="relative w-full max-w-xl">
          <div
            className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-br from-mint-200/45 via-transparent to-navy-400/30 dark:from-mint-500/25 dark:via-transparent dark:to-navy-800/45 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[24px] border border-outline-subtle/60 bg-white/75 dark:bg-surface-elevated/70 backdrop-blur-xl shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
            <div
              className="pointer-events-none absolute inset-x-16 -top-24 h-48 rounded-full bg-mint-100/60 dark:bg-mint-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-center gap-5 px-8 py-10 text-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-content">
                  <span className="font-normal">Log in to</span>{" "}
                  <span className="font-playfair font-semibold">AlgoIRL</span>
                </h3>
                <p className="text-sm text-content-muted dark:text-content-subtle">
                  {message || `Access your study plans and sync them across devices.`}
                </p>
              </div>
              <ul className="w-full max-w-sm text-left space-y-2 text-sm text-content-muted dark:text-content-subtle">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-mint-600 dark:text-mint-400" />
                  <span>Save personalized study plans and resume where you left off.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-mint-600 dark:text-mint-400" />
                  <span>Keep study plan progress, bookmarks, and code updates in sync.</span>
                </li>
              </ul>
              <div className="w-full max-w-sm">
                <AuthProviderList
                  title="Sign-in options"
                  description="Choose your preferred provider. Blind 75 progress stays on this device for now."
                  loading={signingIn || authLoading}
                  onGoogleClick={handleGoogleSignIn}
                  footer={
                    authError ? (
                      <p className="mt-2 text-sm text-red-500 text-left">{authError}</p>
                    ) : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PRIORITY 2: Check if subscription is required (payment gate, optional)
  if (flags.requireSubscription && !hasActiveSubscription) {
    // If payments are not enabled, allow access without subscription requirement
    if (!flags.paymentsEnabled || !flags.razorpayCheckoutEnabled) {
      return <ComingSoonModal feature={feature} message={message} />;
    }

    return (
      <>
        <div className="text-center py-12 px-6 bg-panel-100/70 dark:bg-panel-400/70 rounded-2xl border border-panel-200 dark:border-panel-400 shadow-md max-w-xl mx-auto">
          <Crown className="w-16 h-16 mx-auto text-mint-600 mb-4" />
          <h3 className="text-2xl font-bold mb-2 text-content font-playfair">Upgrade to Premium</h3>
          <p className="text-sm text-content-muted dark:text-content-subtle mb-6">
            {message || `${feature} requires a premium subscription.`}
          </p>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-3 bg-mint-600 hover:bg-mint-700 text-white rounded-lg font-medium transition-colors"
          >
            View Plans
          </button>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          monthlyPrice={flags.monthlyPriceInr}
        />
      </>
    );
  }

  // User is authenticated (and has active subscription if required)
  return <>{children}</>;
}

function ComingSoonModal({ feature, message }: { feature: string; message?: string }) {
  return (
    <div className="text-center py-12 px-6">
      <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-content font-playfair">Coming Soon!</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        {message || `${feature} is currently in development and will be available soon.`}
      </p>
      <p className="text-sm text-gray-500">We&rsquo;ll notify you when this feature launches. Stay tuned!</p>
    </div>
  );
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyPrice: number;
}

function UpgradeModal({ isOpen, onClose, monthlyPrice }: UpgradeModalProps) {
  const { getIdToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get Firebase ID token
      const idToken = await getIdToken();
      if (!idToken) {
        throw new Error("Please sign in first");
      }

      // Step 2: Create subscription on backend
      const response = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planId: "plan_monthly_study_plan_inr", // Or USD based on user location
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      // Step 3: Option A - Redirect to Razorpay hosted page (simpler)
      if (data.shortUrl) {
        window.location.href = data.shortUrl;
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        throw new Error("Payment gateway unavailable. Please check your connection and try again.");
      }

      const razorpayConstructor = (window as typeof window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!razorpayConstructor) {
        throw new Error("Payment gateway unavailable. Please refresh and try again.");
      }

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "AlgoIRL",
        description: "Premium Study Plans Subscription",
        image: "/logo.png",
        handler: async () => {
          secureLog.dev("Payment", "Payment successful");
          onClose();
          alert("Payment successful! Your premium features are now active.");
        },
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#10B981",
        },
        modal: {
          ondismiss: () => {
            secureLog.dev("Payment", "Checkout dismissed");
            setLoading(false);
          },
        },
      };

      const razorpay: RazorpayInstance = new razorpayConstructor(options);

      razorpay.on("payment.failed", (response) => {
        secureLog.error('Payment', new Error('Payment failed'), { hasResponse: !!response });
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (err: any) {
      secureLog.error('Payment', err as Error);
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Crown className="w-16 h-16 mx-auto text-mint-600 mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-content font-playfair">Upgrade to Premium</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock unlimited study plans and advanced features
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold">₹{monthlyPrice}</span>
            <span className="text-gray-600 dark:text-gray-400">/month</span>
            <p className="text-sm text-gray-500 mt-1">~${(monthlyPrice / 83).toFixed(2)} USD</p>
          </div>

          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-mint-600 mt-0.5 flex-shrink-0" />
              <span>Generate unlimited personalized study plans</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-mint-600 mt-0.5 flex-shrink-0" />
              <span>Cross-device progress synchronization</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-mint-600 mt-0.5 flex-shrink-0" />
              <span>Advanced analytics and insights</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-mint-600 mt-0.5 flex-shrink-0" />
              <span>Priority support</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-5 h-5 text-mint-600 mt-0.5 flex-shrink-0" />
              <span>Cancel anytime</span>
            </li>
          </ul>

          {/* Payment Methods */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 text-center mb-2">Secure payment powered by Razorpay</p>
            <div className="flex justify-center items-center gap-3 text-xs text-gray-400">
              <span>💳 Cards</span>
              <span>🏦 Netbanking</span>
              <span>📱 UPI</span>
              <span>💰 Wallets</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Maybe Later
          </button>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-mint-600 hover:bg-mint-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {loading ? "Processing..." : "Upgrade Now"}
          </button>
        </div>

        {/* Trust Signals */}
        <p className="mt-4 text-center text-xs text-gray-500">
          🔒 Secure payment • Cancel anytime • Money-back guarantee
        </p>
      </div>
    </div>
  );
}
