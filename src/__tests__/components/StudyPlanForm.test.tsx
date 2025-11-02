import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import React from "react";
import { StudyPlanForm } from "@/components/pages/StudyPlanForm";
import PaymentModal from "@/components/PaymentModal";

// Move all mocks first
vi.mock("@/components/PremiumGate", () => ({
  PremiumGate: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

vi.mock("@/components/PaymentModal", () => ({
  __esModule: true,
  default: vi.fn(() => null),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { email: "tester@example.com" } as { email?: string } | null,
    loading: false,
  })),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(() => ({
    hasActiveSubscription: false,
    loading: false,
    refresh: vi.fn(),
    status: "none" as const,
  })),
}));

vi.mock("@/contexts/AuthDialogContext", () => ({
  useAuthDialog: vi.fn(() => ({
    openAuthDialog: vi.fn(),
  })),
}));

vi.mock("@/utils/payment", () => ({
  trackPaymentEvent: vi.fn(),
  storePaymentContext: vi.fn(),
  loadRazorpay: vi.fn(),
  generateConfig: vi.fn(),
  getPaymentContext: vi.fn(),
  clearPaymentContext: vi.fn(),
  mapPaymentError: vi.fn(),
  checkPaymentContextFreshness: vi.fn(),
}));

vi.mock("@/utils/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/utils/companiesCache", () => ({
  getCachedCompanies: () => [
    { id: "meta", name: "Meta" },
    { id: "amazon", name: "Amazon" },
  ],
  cacheCompanies: vi.fn(),
}));

vi.mock("@/utils/api-service", () => ({
  fetchCompanies: vi.fn(),
}));

import { trackPaymentEvent, storePaymentContext } from "@/utils/payment";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthDialog } from "@/contexts/AuthDialogContext";
import { toast } from "@/utils/toast";

describe("StudyPlanForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits valid configuration with default values", async () => {
    const onSubmit = vi.fn();

    render(<StudyPlanForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    const submitButton = screen.getByRole("button", { name: /generate study plan/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const [config] = onSubmit.mock.calls[0];
    expect(config).toMatchObject({
      companyId: "meta",
      roleFamily: "backend",
      timeline: 14,
      hoursPerDay: 2,
      datasetType: "blind75",
    });
  });

  it("opens payment modal and stores context when full dataset requires upgrade", () => {
    const onSubmit = vi.fn();

    vi.mocked(useSubscription).mockReturnValue({
      hasActiveSubscription: false,
      loading: false,
      refresh: vi.fn(),
      status: "none" as const,
      isPastDue: false,
      isCanceled: false,
    });

    render(<StudyPlanForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    const fullDatasetButton = screen.getByRole("button", { name: /full dataset/i });
    fireEvent.click(fullDatasetButton);

    expect(vi.mocked(storePaymentContext)).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "Full Dataset Access",
        returnUrl: "/study-plan-form",
        preSelectDataset: "full",
      }),
    );

    expect(vi.mocked(trackPaymentEvent)).toHaveBeenCalledWith("full_dataset_payment_prompt");
    const lastCall = vi.mocked(PaymentModal).mock.calls.at(-1);
    expect(lastCall?.[0]).toMatchObject({ isOpen: true });
  });

  it("shows validation error when submitting without required difficulty", async () => {
    const onSubmit = vi.fn();

    render(<StudyPlanForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    const easyToggle = screen.getByRole("button", { name: "Easy" });
    const mediumToggle = screen.getByRole("button", { name: "Medium" });
    const hardToggle = screen.getByRole("button", { name: "Hard" });

    fireEvent.click(easyToggle);
    fireEvent.click(mediumToggle);
    fireEvent.click(hardToggle);

    const submitButton = screen.getByRole("button", { name: /generate study plan/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/please select at least one difficulty level/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
