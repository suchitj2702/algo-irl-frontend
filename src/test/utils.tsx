import { render, type RenderResult } from "@testing-library/react";
import type { MemoryRouterProps } from "react-router-dom";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { AuthContext, type AuthContextType } from "@/contexts/AuthContext";
import {
  SubscriptionContext,
  type SubscriptionContextValue,
} from "@/contexts/SubscriptionContext";
import {
  FeatureFlagsContext,
  defaultFlags,
  type FeatureFlagsContextType,
} from "@/contexts/FeatureFlagsContext";
import {
  AuthDialogContext,
  type AuthDialogContextValue,
} from "@/contexts/AuthDialogContext";
import { fireEvent, screen, waitFor } from "@testing-library/react";

type ProviderOverrides = {
  authValue?: Partial<AuthContextType>;
  subscriptionValue?: Partial<SubscriptionContextValue>;
  featureFlagsValue?: Partial<FeatureFlagsContextType>;
  authDialogValue?: Partial<AuthDialogContextValue>;
  router?: Partial<MemoryRouterProps>;
};

function createAuthDefaults(): AuthContextType {
  return {
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signInWithRedirect: vi.fn(),
    signInForFeature: vi.fn(),
    signOut: vi.fn(),
    getIdToken: vi.fn().mockResolvedValue(null),
    hasActiveSubscription: vi.fn().mockResolvedValue(false),
    getSubscriptionStatus: vi.fn().mockResolvedValue("none"),
    postAuthRedirect: null,
    setPostAuthRedirect: vi.fn(),
    authTrigger: null,
    setAuthTrigger: vi.fn(),
    handlePostAuthNavigation: vi.fn(),
    clearError: vi.fn(),
  };
}

function createSubscriptionDefaults(): SubscriptionContextValue {
  return {
    status: "none",
    currentPeriodEnd: null,
    cancelAt: null,
    planId: null,
    planName: null,
    isTrialing: false,
    daysSinceSubscribed: null,
    daysUntilRenewal: null,
    paymentMethod: null,
    loading: false,
    isRefreshing: false,
    refreshError: null,
    refresh: vi.fn().mockResolvedValue("none"),
    checkSubscriptionStatus: vi.fn().mockResolvedValue("none"),
    setOptimisticSubscription: vi.fn(),
    isSubscriptionExpiring: vi.fn().mockReturnValue(false),
    getSubscriptionDisplayStatus: vi.fn().mockReturnValue("inactive"),
    canAccessPremiumFeatures: vi.fn().mockReturnValue(false),
    hasActiveSubscription: false,
  };
}

function createFeatureFlagsDefaults(): FeatureFlagsContextType {
  return {
    flags: { ...defaultFlags },
    loading: false,
    refreshFlags: vi.fn().mockResolvedValue(undefined),
  };
}

function createAuthDialogDefaults(): AuthDialogContextValue {
  return {
    openAuthDialog: vi.fn(),
    closeAuthDialog: vi.fn(),
    suppressNavSignInButton: vi.fn().mockReturnValue(() => {}),
    navSignInHidden: false,
  };
}

function renderTree(ui: ReactElement, options: ProviderOverrides): ReactElement {
  const authValue = { ...createAuthDefaults(), ...options.authValue };
  const subscriptionValue = { ...createSubscriptionDefaults(), ...options.subscriptionValue };
  const featureFlagsValue = {
    ...createFeatureFlagsDefaults(),
    ...options.featureFlagsValue,
  };
  const authDialogValue = { ...createAuthDialogDefaults(), ...options.authDialogValue };
  const routerProps: MemoryRouterProps = {
    initialEntries: ["/"],
    ...options.router,
  };

  return (
    <MemoryRouter {...routerProps}>
      <AuthContext.Provider value={authValue}>
        <SubscriptionContext.Provider value={subscriptionValue}>
          <FeatureFlagsContext.Provider value={featureFlagsValue}>
            <AuthDialogContext.Provider value={authDialogValue}>
              {ui}
            </AuthDialogContext.Provider>
          </FeatureFlagsContext.Provider>
        </SubscriptionContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOverrides = {},
): RenderResult & {
  rerender: (nextUi: ReactElement, nextOptions?: ProviderOverrides) => void;
} {
  let currentOptions: ProviderOverrides = {
    router: options.router,
    authValue: options.authValue,
    subscriptionValue: options.subscriptionValue,
    featureFlagsValue: options.featureFlagsValue,
    authDialogValue: options.authDialogValue,
  };

  const renderResult = render(renderTree(ui, currentOptions));

  const rerender = (nextUi: ReactElement, nextOptions: ProviderOverrides = {}) => {
    currentOptions = {
      ...currentOptions,
      ...nextOptions,
      router: { ...currentOptions.router, ...nextOptions.router },
      authValue: { ...currentOptions.authValue, ...nextOptions.authValue },
      subscriptionValue: {
        ...currentOptions.subscriptionValue,
        ...nextOptions.subscriptionValue,
      },
      featureFlagsValue: {
        ...currentOptions.featureFlagsValue,
        ...nextOptions.featureFlagsValue,
      },
      authDialogValue: {
        ...currentOptions.authDialogValue,
        ...nextOptions.authDialogValue,
      },
    };

    renderResult.rerender(renderTree(nextUi, currentOptions));
  };

  return { ...renderResult, rerender };
}

export { fireEvent, screen, waitFor };
