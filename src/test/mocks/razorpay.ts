import { vi } from "vitest";

type RazorpayConstructor = typeof import("@types/razorpay").RazorpayConstructor;

interface RazorpayMock {
  open: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
}

const mockFactory = () => ({
  open: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
});

export const mockRazorpay: RazorpayMock = mockFactory();

const razorpayCtor = vi.fn(() => mockRazorpay);
export const mockRazorpayConstructor = razorpayCtor as unknown as RazorpayConstructor;

/**
 * Installs a minimal Razorpay constructor on the window for tests.
 */
export function installRazorpayMock(overrides: Partial<RazorpayMock> = {}) {
  mockRazorpay.open.mockReset();
  mockRazorpay.on.mockReset();
  mockRazorpay.off.mockReset();

  Object.assign(mockRazorpay, overrides);

  Object.defineProperty(window, "Razorpay", {
    value: mockRazorpayConstructor,
    configurable: true,
    writable: true,
  });

  return { Razorpay: mockRazorpayConstructor, instance: mockRazorpay };
}

/**
 * Removes the mocked Razorpay constructor between tests.
 */
export function resetRazorpayMock() {
  mockRazorpay.open.mockReset();
  mockRazorpay.on.mockReset();
  mockRazorpay.off.mockReset();
  razorpayCtor.mockReset();

  if ("Razorpay" in window) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (window as typeof window & { Razorpay?: RazorpayConstructor }).Razorpay;
  }
}
