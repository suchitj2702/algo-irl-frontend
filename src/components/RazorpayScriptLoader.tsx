import { useEffect } from "react";
import { useFeatureFlags } from "../contexts/FeatureFlagsContext";
import { loadRazorpayScript } from "../utils/payment";
import { secureLog } from "../utils/secureLogger";

/**
 * Lazily loads Razorpay Checkout.js when remote config enables payments.
 * Prevents the third-party script from running before the feature flag rollout.
 */
export function RazorpayScriptLoader() {
  const { flags, loading } = useFeatureFlags();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!flags.paymentsEnabled || !flags.razorpayCheckoutEnabled) {
      return;
    }

    let cancelled = false;

    loadRazorpayScript()
      .then((loaded) => {
        if (!loaded && !cancelled) {
          secureLog.error("Payment", new Error("Failed to preload Razorpay checkout script"), {
            context: "feature-flag-init",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          secureLog.error("Payment", error as Error, { context: "feature-flag-init" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [flags.paymentsEnabled, flags.razorpayCheckoutEnabled, loading]);

  return null;
}
