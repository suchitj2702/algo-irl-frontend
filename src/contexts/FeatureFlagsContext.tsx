import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAndActivate, getRemoteConfig, getValue } from 'firebase/remote-config';
import app from '../config/firebase';

export interface FeatureFlags {
  paymentsEnabled: boolean;
  razorpayCheckoutEnabled: boolean;
  showPricingPage: boolean;
  requireSubscription: boolean;
  paymentsRolloutPercentage: number;
  paymentsAllowedEmails: string[];
  monthlyPriceInr: number;
  monthlyPriceUsd: number;
  showAnnualPlan: boolean;
  maxFreeStudyPlans: number;
  requireAuthForStudyPlans: boolean;
}

export interface FeatureFlagsContextType {
  flags: FeatureFlags;
  loading: boolean;
  refreshFlags: () => Promise<void>;
}

export const defaultFlags: FeatureFlags = {
  paymentsEnabled: false,
  razorpayCheckoutEnabled: false,
  showPricingPage: false,
  requireSubscription: false,
  paymentsRolloutPercentage: 0,
  paymentsAllowedEmails: [],
  monthlyPriceInr: 799,
  monthlyPriceUsd: 9.99,
  showAnnualPlan: false,
  maxFreeStudyPlans: 1,
  requireAuthForStudyPlans: false,
};

function parseJsonArray(value: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === 'string') as string[]) : [];
  } catch (err) {
    console.warn('Failed to parse Remote Config array value:', err);
    return [];
  }
}

export const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
}

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  const loadFlags = useCallback(async () => {
    try {
      const remoteConfig = getRemoteConfig(app);

      remoteConfig.settings.minimumFetchIntervalMillis = 12 * 60 * 60 * 1000; // 12 hours
      remoteConfig.settings.fetchTimeoutMillis = 60 * 1000; // 60 seconds

      remoteConfig.defaultConfig = {
        payments_enabled: defaultFlags.paymentsEnabled,
        razorpay_checkout_enabled: defaultFlags.razorpayCheckoutEnabled,
        show_pricing_page: defaultFlags.showPricingPage,
        require_subscription: defaultFlags.requireSubscription,
        payments_rollout_percentage: defaultFlags.paymentsRolloutPercentage,
        payments_allowed_emails: JSON.stringify(defaultFlags.paymentsAllowedEmails),
        monthly_price_inr: defaultFlags.monthlyPriceInr,
        monthly_price_usd: defaultFlags.monthlyPriceUsd,
        show_annual_plan: defaultFlags.showAnnualPlan,
        max_free_study_plans: defaultFlags.maxFreeStudyPlans,
        require_auth_for_study_plans: defaultFlags.requireAuthForStudyPlans,
      };

      await fetchAndActivate(remoteConfig);

      const newFlags: FeatureFlags = {
        paymentsEnabled: getValue(remoteConfig, 'payments_enabled').asBoolean(),
        razorpayCheckoutEnabled: getValue(remoteConfig, 'razorpay_checkout_enabled').asBoolean(),
        showPricingPage: getValue(remoteConfig, 'show_pricing_page').asBoolean(),
        requireSubscription: getValue(remoteConfig, 'require_subscription').asBoolean(),
        paymentsRolloutPercentage: getValue(remoteConfig, 'payments_rollout_percentage').asNumber(),
        paymentsAllowedEmails: parseJsonArray(getValue(remoteConfig, 'payments_allowed_emails').asString()),
        monthlyPriceInr: getValue(remoteConfig, 'monthly_price_inr').asNumber(),
        monthlyPriceUsd: getValue(remoteConfig, 'monthly_price_usd').asNumber(),
        showAnnualPlan: getValue(remoteConfig, 'show_annual_plan').asBoolean(),
        maxFreeStudyPlans: getValue(remoteConfig, 'max_free_study_plans').asNumber(),
        requireAuthForStudyPlans: getValue(remoteConfig, 'require_auth_for_study_plans').asBoolean(),
      };

      setFlags(newFlags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
      setFlags(defaultFlags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadFlags();
    }, 12 * 60 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [loadFlags]);

  const refreshFlags = useCallback(async () => {
    setLoading(true);
    await loadFlags();
  }, [loadFlags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refreshFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
