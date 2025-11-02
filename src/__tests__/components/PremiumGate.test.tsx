import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import { PremiumGate } from "@/components/PremiumGate";

const featureFlagsState = {
  flags: {
    paymentsEnabled: true,
    razorpayCheckoutEnabled: true,
    showPricingPage: true,
    requireSubscription: false,
    paymentsRolloutPercentage: 100,
    paymentsAllowedEmails: [] as string[],
    monthlyPriceInr: 799,
    monthlyPriceUsd: 9.99,
    showAnnualPlan: false,
    maxFreeStudyPlans: 1,
    requireAuthForStudyPlans: true,
  },
  loading: false,
  refreshFlags: vi.fn(),
};

const authState = {
  user: null as { email?: string } | null,
  loading: false,
  error: null as string | null,
  signInWithGoogle: vi.fn(),
  clearError: vi.fn(),
};

const subscriptionState = {
  status: "none" as const,
  hasActiveSubscription: false,
  loading: false,
  isPastDue: false,
  isCanceled: false,
  refresh: vi.fn(),
};

const authDialogState = {
  openAuthDialog: vi.fn(),
  closeAuthDialog: vi.fn(),
  suppressNavSignInButton: vi.fn(() => vi.fn()),
  navSignInHidden: false,
};

vi.mock("@/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => featureFlagsState,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => subscriptionState,
}));

vi.mock("@/contexts/AuthDialogContext", () => ({
  useAuthDialog: () => authDialogState,
}));

describe("PremiumGate", () => {
  beforeEach(() => {
    authState.user = null;
    authState.error = null;
    authState.signInWithGoogle.mockReset();
    authState.clearError.mockReset();
    subscriptionState.hasActiveSubscription = false;
    subscriptionState.loading = false;
    subscriptionState.refresh.mockReset();
    featureFlagsState.flags.requireSubscription = false;
    featureFlagsState.flags.razorpayCheckoutEnabled = true;
    featureFlagsState.loading = false;
    authDialogState.suppressNavSignInButton.mockReturnValue(() => {});
    authDialogState.suppressNavSignInButton.mockClear();
  });

  it("renders login prompt when user is not authenticated", () => {
    render(
      <PremiumGate feature="Study Plan" message="Sign in required">
        <div>Protected</div>
      </PremiumGate>,
    );

    expect(screen.getByText(/log in to/i)).toBeInTheDocument();
    expect(authDialogState.suppressNavSignInButton).toHaveBeenCalled();
  });

  it("renders children when user has active subscription", () => {
    authState.user = { email: "user@example.com" };
    subscriptionState.hasActiveSubscription = true;
    featureFlagsState.flags.requireSubscription = true;

    render(
      <PremiumGate feature="Study Plan">
        <div data-testid="premium-content">Unlocked</div>
      </PremiumGate>,
    );

    expect(screen.getByTestId("premium-content")).toBeInTheDocument();
  });

  it("shows coming soon message when subscription required but checkout disabled", () => {
    authState.user = { email: "user@example.com" };
    subscriptionState.hasActiveSubscription = false;
    featureFlagsState.flags.requireSubscription = true;
    featureFlagsState.flags.razorpayCheckoutEnabled = false;

    render(
      <PremiumGate feature="Premium Feature">
        <div>Protected</div>
      </PremiumGate>,
    );

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
