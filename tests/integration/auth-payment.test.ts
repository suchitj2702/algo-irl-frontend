import type { ReactNode } from "react";
import React from "react";
import { vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/utils";
import StudyPlanForm from "@/components/pages/StudyPlanForm";

// Mock Firebase Auth before importing components
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(() => ({
    setCustomParameters: vi.fn(),
  })),
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

const paymentModalMock = vi.fn();

vi.mock("@/components/PremiumGate", () => ({
  PremiumGate: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/components/PaymentModal", () => ({
  __esModule: true,
  default: (props: unknown) => {
    paymentModalMock(props);
    return null;
  },
}));

// Mock API service to prevent URL parsing errors in tests
vi.mock("@/utils/api-service", () => ({
  fetchCompanies: vi.fn(async () => [
    { id: "meta", name: "Meta" },
    { id: "amazon", name: "Amazon" },
  ]),
}));

describe("Authentication to Payment Flow", () => {
  beforeEach(() => {
    paymentModalMock.mockClear();
  });

  it("should prompt sign-in for unauthenticated users", async () => {
    const openAuthDialog = vi.fn();

    renderWithProviders(React.createElement(StudyPlanForm), {
      authValue: { user: null },
      subscriptionValue: { hasActiveSubscription: false },
      authDialogValue: { openAuthDialog },
    });

    fireEvent.click(screen.getByText(/unlock full dataset/i));

    await waitFor(() => {
      expect(openAuthDialog).toHaveBeenCalledWith(expect.objectContaining({ intent: "premium-gate" }));
    });
  });

  it("should show payment modal after authentication", async () => {
    const { rerender } = renderWithProviders(React.createElement(StudyPlanForm), {
      authValue: { user: null },
      subscriptionValue: { hasActiveSubscription: false },
    });

    fireEvent.click(screen.getByText(/unlock full dataset/i));

    rerender(React.createElement(StudyPlanForm), {
      authValue: { user: { uid: "test-user" } },
      subscriptionValue: { hasActiveSubscription: false },
    });

    await waitFor(() => {
      expect(paymentModalMock).toHaveBeenCalled();
    });

    const latestCall = paymentModalMock.mock.calls.at(-1)?.[0] as { isOpen?: boolean } | undefined;
    expect(latestCall?.isOpen).toBe(true);
  });

  it("should auto-select full dataset after payment success", async () => {
    vi.useFakeTimers();
    const refresh = vi.fn().mockResolvedValue("active");
    const checkSubscriptionStatus = vi.fn().mockResolvedValue("active");

    try {
      const { rerender } = renderWithProviders(React.createElement(StudyPlanForm), {
        authValue: { user: { uid: "test-user" } },
        subscriptionValue: {
          hasActiveSubscription: false,
          status: "none",
          refresh,
          checkSubscriptionStatus,
        },
      });

      fireEvent.click(screen.getByText(/unlock full dataset/i));

      await waitFor(() => {
        expect(paymentModalMock).toHaveBeenCalled();
      });

      const modalProps = paymentModalMock.mock.calls.at(-1)?.[0] as {
        onSuccess?: (response: unknown) => void;
      } | undefined;

      modalProps?.onSuccess?.({});

      rerender(React.createElement(StudyPlanForm), {
        authValue: { user: { uid: "test-user" } },
        subscriptionValue: {
          hasActiveSubscription: true,
          status: "active",
          refresh,
          checkSubscriptionStatus,
        },
      });

      await vi.advanceTimersByTimeAsync(1000);

      const fullDatasetButton = screen.getByRole("button", { name: /full dataset/i });

      await waitFor(() => {
        expect(fullDatasetButton).toHaveClass("bg-gradient-to-r");
      });
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  }, 10000); // Increase timeout to 10 seconds
});
