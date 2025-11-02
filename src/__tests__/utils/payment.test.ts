import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  clearPaymentContext,
  getRazorpayConfig,
  handleRazorpayError,
  loadRazorpayScript,
  retrievePaymentContext,
  storePaymentContext,
  trackPaymentEvent,
} from "@/utils/payment";

describe("payment utilities", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    clearPaymentContext();
    vi.unstubAllEnvs();
    vi.stubEnv("VITE_RAZORPAY_KEY_ID", "rzp_test_key");
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (window as typeof window & { Razorpay?: unknown }).Razorpay;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves payment context with freshness check", () => {
    storePaymentContext({ returnUrl: "/plan", feature: "Full Dataset" });
    const context = retrievePaymentContext();

    expect(context).not.toBeNull();
    expect(context).toMatchObject({
      returnUrl: "/plan",
      feature: "Full Dataset",
    });
    expect(context?.timestamp).toBeGreaterThan(0);
  });

  it("returns null for expired payment context", () => {
    const expired = {
      returnUrl: "/old",
      feature: "Feature",
      timestamp: Date.now() - 25 * 60 * 60 * 1000,
    };
    sessionStorage.setItem("payment_context", JSON.stringify(expired));

    expect(retrievePaymentContext()).toBeNull();
  });

  it("maps network errors to user friendly messages", () => {
    const result = handleRazorpayError(new Error("Failed to fetch"));

    expect(result).toEqual({
      message: "Network error. Please check your connection and try again.",
      code: "NETWORK_ERROR",
      recoverable: true,
    });
  });

  it("generates Razorpay configuration with environment key", () => {
    const config = getRazorpayConfig("sub_123", { email: "user@example.com" });

    expect(config).toMatchObject({
      key: "rzp_test_key",
      subscription_id: "sub_123",
      prefill: { email: "user@example.com" },
    });
  });

  it("emits analytics events to configured providers", () => {
    const gtag = vi.fn();
    const mixpanelTrack = vi.fn();

    Object.assign(window, {
      gtag,
      mixpanel: { track: mixpanelTrack },
    });

    trackPaymentEvent("test_event", { foo: "bar" });

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "test_event",
      expect.objectContaining({ foo: "bar" }),
    );
    expect(mixpanelTrack).toHaveBeenCalledWith("test_event", expect.objectContaining({ foo: "bar" }));
  });

  it("resolves immediately when Razorpay is already available", async () => {
    window.Razorpay = vi.fn() as never;

    await expect(loadRazorpayScript()).resolves.toBe(true);
  });
});
