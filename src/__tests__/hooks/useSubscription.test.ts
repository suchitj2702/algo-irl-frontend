import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useSubscription } from "@/hooks/useSubscription";

let subscriptionContextMock = {
  status: "past_due" as const,
  loading: false,
  hasActiveSubscription: false,
};

vi.mock("@/contexts/SubscriptionContext", () => ({
  useSubscriptionContext: vi.fn(() => subscriptionContextMock),
}));

describe("useSubscription", () => {
  beforeEach(() => {
    subscriptionContextMock = {
      status: "past_due",
      loading: false,
      hasActiveSubscription: false,
    };
  });

  it("derives isPastDue and isCanceled flags from status", () => {
    const { result, rerender } = renderHook(() => useSubscription());

    // When status is "past_due", isPastDue should be true
    expect(result.current.isPastDue).toBe(true);
    expect(result.current.isCanceled).toBe(false);

    // Update the mock to return canceled status
    subscriptionContextMock = {
      ...subscriptionContextMock,
      status: "canceled",
    };
    rerender();

    // When status is "canceled", isCanceled should be true and isPastDue should be false
    expect(result.current.isPastDue).toBe(false);
    expect(result.current.isCanceled).toBe(true);
  });
});
