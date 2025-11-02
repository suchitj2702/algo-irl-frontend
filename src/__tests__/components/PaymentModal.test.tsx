import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import PaymentModal from "@/components/PaymentModal";
import { mockRazorpay, resetRazorpayMock } from "@/test/mocks/razorpay";
import React from "react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const authMock = {
  getIdToken: vi.fn(),
  user: { email: "tester@example.com" },
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authMock,
}));

describe("PaymentModal Component", () => {
  let razorpaySpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetRazorpayMock();
    mockRazorpay.open.mockClear();
    mockRazorpay.on.mockClear();
    authMock.user = { email: "tester@example.com" };

    razorpaySpy = vi.fn(() => mockRazorpay);
    Object.defineProperty(window, "Razorpay", {
      value: razorpaySpy,
      configurable: true,
      writable: true,
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            subscriptionId: "sub_123",
            shortUrl: "https://rzp.io/l/test",
          }),
      }),
    ) as typeof fetch;

    sessionStorage.clear();
    authMock.getIdToken = vi.fn().mockResolvedValue("id-token");
  });

  afterEach(() => {
    resetRazorpayMock();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should render payment modal when open", () => {
    render(<PaymentModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText("Unlock Comprehensive Plan")).toBeInTheDocument();
    expect(screen.getByText(/₹799/i)).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<PaymentModal isOpen onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("should initialize Razorpay on payment button click", async () => {
    render(<PaymentModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Proceed to Payment"));

    await waitFor(() => {
      expect(razorpaySpy).toHaveBeenCalled();
      expect(mockRazorpay.open).toHaveBeenCalled();
    });
  });

  it("should store returnUrl in sessionStorage", async () => {
    const returnUrl = "/study-plan-form";

    render(<PaymentModal isOpen onClose={vi.fn()} returnUrl={returnUrl} />);

    fireEvent.click(screen.getByText("Proceed to Payment"));

    await waitFor(() => {
      expect(sessionStorage.getItem("payment_return_url")).toBe(returnUrl);
    });
  });

  it("should handle API errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Payment failed",
          }),
      }),
    ) as typeof fetch;

    render(<PaymentModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByText("Proceed to Payment"));

    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    });
  });
});
