export type RazorpayEvent = "payment.failed" | "payment.success" | "ready" | "dismiss" | (string & {});

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
  method?: string;
}

export interface RazorpayTheme {
  color?: string;
  backdrop_color?: string;
}

export interface RazorpayModalOptions {
  ondismiss?: () => void;
  escape?: boolean;
  handleback?: boolean;
  confirm_close?: boolean;
  animation?: boolean;
}

export type RazorpayNotes = Record<string, string | number | boolean | undefined>;

export interface RazorpayRetryOptions {
  enabled?: boolean;
  max_count?: number;
}

export interface RazorpayDisplayBlock {
  name?: string;
  instruments?: Array<Record<string, unknown>>;
}

export interface RazorpayDisplayPreferences {
  show_default_blocks?: boolean;
}

export interface RazorpayDisplayConfig {
  blocks?: Record<string, RazorpayDisplayBlock>;
  sequence?: string[];
  preferences?: RazorpayDisplayPreferences;
}

export interface RazorpayCheckoutConfig {
  display?: RazorpayDisplayConfig;
  [key: string]: unknown;
}

export interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string | { src?: string; width?: number; height?: number };
  order_id?: string;
  subscription_id?: string;
  customer_id?: string;
  receipt?: string;
  handler?: RazorpayHandler;
  callback_url?: string;
  redirect?: boolean;
  prefill?: RazorpayPrefill;
  notes?: RazorpayNotes;
  theme?: RazorpayTheme;
  modal?: RazorpayModalOptions;
  retry?: RazorpayRetryOptions;
  method?: string;
  contact?: string;
  email?: string;
  send_sms_hash?: boolean;
  remember_customer?: boolean;
  capture?: boolean;
  timeout?: number;
  recurring?: boolean;
  config?: RazorpayCheckoutConfig;
  integration?: string;
  upi?: { flow?: "intent" | "inapp" };
  [key: string]: unknown;
}

export interface RazorpayResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  razorpay_subscription_id?: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface RazorpayErrorResponse {
  error: RazorpayError;
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: "payment.failed", handler: (response: RazorpayErrorResponse) => void): void;
  on(event: "payment.success", handler: (response: RazorpayResponse) => void): void;
  on(event: RazorpayEvent, handler: (response: unknown) => void): void;
}

export interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

export type RazorpayHandler = (response: RazorpayResponse) => void;

export interface RazorpaySubscription {
  id: string;
  status:
    | "created"
    | "authenticated"
    | "active"
    | "pending"
    | "halted"
    | "cancelled"
    | "completed"
    | "expired"
    | "paused";
  plan_id: string;
  customer_id: string;
  total_count: number;
  current_start: number | null;
  current_end: number | null;
  ended_at: number | null;
  charge_at: number | null;
  auth_attempts: number;
  short_url: string;
}

export interface RazorpayPayment {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  status: string;
  shortUrl: string;
  currentStart?: number;
  currentEnd?: number;
  planId: string;
}

export type RazorpayCheckoutResponse = RazorpayResponse;
export type RazorpayPaymentFailedResponse = RazorpayErrorResponse;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

declare module "@types/razorpay" {
  export type RazorpayEvent = import("./razorpay").RazorpayEvent;
  export interface RazorpayPrefill extends import("./razorpay").RazorpayPrefill {}
  export interface RazorpayTheme extends import("./razorpay").RazorpayTheme {}
  export interface RazorpayModalOptions extends import("./razorpay").RazorpayModalOptions {}
  export type RazorpayNotes = import("./razorpay").RazorpayNotes;
  export interface RazorpayRetryOptions extends import("./razorpay").RazorpayRetryOptions {}
  export interface RazorpayDisplayBlock extends import("./razorpay").RazorpayDisplayBlock {}
  export interface RazorpayDisplayPreferences extends import("./razorpay").RazorpayDisplayPreferences {}
  export interface RazorpayDisplayConfig extends import("./razorpay").RazorpayDisplayConfig {}
  export interface RazorpayCheckoutConfig extends import("./razorpay").RazorpayCheckoutConfig {}
  export interface RazorpayOptions extends import("./razorpay").RazorpayOptions {}
  export interface RazorpayResponse extends import("./razorpay").RazorpayResponse {}
  export interface RazorpayError extends import("./razorpay").RazorpayError {}
  export interface RazorpayErrorResponse extends import("./razorpay").RazorpayErrorResponse {}
  export interface RazorpayInstance extends import("./razorpay").RazorpayInstance {}
  export interface RazorpayConstructor extends import("./razorpay").RazorpayConstructor {}
  export type RazorpayHandler = import("./razorpay").RazorpayHandler;
  export interface RazorpaySubscription extends import("./razorpay").RazorpaySubscription {}
  export interface RazorpayPayment extends import("./razorpay").RazorpayPayment {}
  export interface CreateSubscriptionResponse extends import("./razorpay").CreateSubscriptionResponse {}
  export type RazorpayCheckoutResponse = import("./razorpay").RazorpayCheckoutResponse;
  export type RazorpayPaymentFailedResponse = import("./razorpay").RazorpayPaymentFailedResponse;
}

export {};
