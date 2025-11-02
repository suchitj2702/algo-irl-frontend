import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, getDocs, getFirestore, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "@/utils/toast";
import app from "../config/firebase";
import { useAuth } from "./AuthContext";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

interface SubscriptionState {
  status: SubscriptionStatus;
  currentPeriodEnd: number | null;
  cancelAt: number | null;
  planId: string | null;
  planName: "monthly" | "yearly" | null;
  isTrialing: boolean;
  daysSinceSubscribed: number | null;
  daysUntilRenewal: number | null;
  paymentMethod: string | null;
}

export interface SubscriptionContextValue extends SubscriptionState {
  loading: boolean;
  isRefreshing: boolean;
  refreshError: Error | null;
  refresh: () => Promise<SubscriptionStatus>;
  checkSubscriptionStatus: (forceRefresh?: boolean) => Promise<SubscriptionStatus>;
  setOptimisticSubscription: () => void;
  isSubscriptionExpiring: () => boolean;
  getSubscriptionDisplayStatus: () => string;
  canAccessPremiumFeatures: () => boolean;
  hasActiveSubscription: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

type RawSubscription = Record<string, unknown>;

const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  status: "none",
  currentPeriodEnd: null,
  cancelAt: null,
  planId: null,
  planName: null,
  isTrialing: false,
  daysSinceSubscribed: null,
  daysUntilRenewal: null,
  paymentMethod: null,
};

const STATUS_PRIORITY: Record<SubscriptionStatus, number> = {
  active: 3,
  past_due: 2,
  canceled: 1,
  none: 0,
};

const MS_IN_DAY = 1000 * 60 * 60 * 24;

function getRecord(value: unknown): RawSubscription | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RawSubscription;
  }
  return null;
}

function toMillis(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value > 1e12 ? value : value * 1000;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("toDate" in record && typeof record.toDate === "function") {
      try {
        const date = record.toDate();
        return date instanceof Date ? date.getTime() : null;
      } catch {
        return null;
      }
    }

    if ("seconds" in record && typeof record.seconds === "number") {
      const seconds = record.seconds;
      const nanoseconds = "nanoseconds" in record && typeof record.nanoseconds === "number" ? record.nanoseconds : 0;
      return seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    }
  }

  return null;
}

function parseSubscriptionStatus(rawStatus: unknown): { status: SubscriptionStatus; isTrialing: boolean } {
  const normalized = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";

  if (normalized === "active" || normalized === "trialing") {
    return { status: "active", isTrialing: normalized === "trialing" };
  }

  if (normalized === "past_due") {
    return { status: "past_due", isTrialing: false };
  }

  if (normalized === "canceled" || normalized === "cancelled") {
    return { status: "canceled", isTrialing: false };
  }

  return { status: "none", isTrialing: false };
}

function inferPlanId(raw: RawSubscription): string | null {
  const directPlanIdCandidate = raw["plan_id"] ?? raw["planId"];
  const directPlanId = typeof directPlanIdCandidate === "string" ? directPlanIdCandidate : null;
  if (directPlanId) {
    return directPlanId;
  }

  const plan = getRecord(raw["plan"]);
  if (plan && typeof plan.id === "string") {
    return plan.id;
  }

  const items = getRecord(raw["items"]);
  const data = items && Array.isArray(items.data) ? (items.data as unknown[]) : [];

  for (const entry of data) {
    const entryRecord = getRecord(entry);
    if (!entryRecord) {
      continue;
    }
    const price = getRecord(entryRecord["price"]) ?? getRecord(entryRecord["plan"]);
    if (price && typeof price.id === "string") {
      return price.id;
    }
  }

  return null;
}

function inferPlanName(planId: string | null, raw: RawSubscription | null): "monthly" | "yearly" | null {
  const candidates: string[] = [];

  if (raw) {
    const plan = getRecord(raw["plan"]);
    if (plan && typeof plan.interval === "string") {
      candidates.push(plan.interval);
    }

    const items = getRecord(raw["items"]);
    const data = items && Array.isArray(items.data) ? (items.data as unknown[]) : [];

    for (const entry of data) {
      const entryRecord = getRecord(entry);
      if (!entryRecord) {
        continue;
      }

      const price = getRecord(entryRecord["price"]) ?? getRecord(entryRecord["plan"]);
      if (!price) {
        continue;
      }

      if (typeof price.interval === "string") {
        candidates.push(price.interval);
      }

      const recurring = getRecord(price.recurring);
      if (recurring && typeof recurring.interval === "string") {
        candidates.push(recurring.interval);
      }
    }
  }

  if (planId) {
    candidates.push(planId);
  }

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (normalized.includes("year") || normalized.includes("annual")) {
      return "yearly";
    }
    if (normalized.includes("month")) {
      return "monthly";
    }
  }

  return null;
}

function extractPaymentMethod(raw: RawSubscription | null): string | null {
  if (!raw) {
    return null;
  }

  const paymentMethodValue = raw["payment_method"] ?? raw["default_payment_method"];
  if (typeof paymentMethodValue === "string") {
    return paymentMethodValue;
  }

  const paymentMethodRecord = getRecord(paymentMethodValue);
  if (paymentMethodRecord) {
    const card = getRecord(paymentMethodRecord["card"]);
    if (card) {
      const brand = typeof card["brand"] === "string" ? card["brand"] : null;
      const last4 = typeof card["last4"] === "string" ? card["last4"] : null;

      if (brand && last4) {
        return `${brand.toUpperCase()} •••• ${last4}`;
      }

      if (brand) {
        return brand.toUpperCase();
      }
    }

    if (typeof paymentMethodRecord.id === "string") {
      return paymentMethodRecord.id;
    }
  }

  return null;
}

function selectPreferredSubscription(subscriptions: RawSubscription[]): RawSubscription | null {
  let best: { data: RawSubscription; priority: number; createdAt: number } | null = null;

  for (const data of subscriptions) {
    const { status } = parseSubscriptionStatus(data["status"]);
    const priority = STATUS_PRIORITY[status];
    const createdAt =
      toMillis(data["created"]) ??
      toMillis(data["start_date"]) ??
      toMillis(data["current_period_start"]) ??
      0;

    if (!best || priority > best.priority || (priority === best.priority && createdAt > best.createdAt)) {
      best = { data, priority, createdAt };
    }
  }

  return best?.data ?? null;
}

function deriveSubscriptionState(raw: RawSubscription | null): SubscriptionState {
  if (!raw) {
    return { ...DEFAULT_SUBSCRIPTION_STATE };
  }

  const { status, isTrialing } = parseSubscriptionStatus(raw["status"]);
  const currentPeriodEnd = toMillis(raw["current_period_end"] ?? raw["currentPeriodEnd"]);
  const cancelAt = toMillis(raw["cancel_at"] ?? raw["cancelAt"]);
  const planId = inferPlanId(raw);
  const planName = inferPlanName(planId, raw);
  const subscribedAt =
    toMillis(raw["created"]) ??
    toMillis(raw["start_date"]) ??
    toMillis(raw["current_period_start"]) ??
    null;
  const paymentMethod = extractPaymentMethod(raw);

  const daysSinceSubscribed =
    subscribedAt !== null ? Math.max(0, Math.floor((Date.now() - subscribedAt) / MS_IN_DAY)) : null;
  const daysUntilRenewal =
    currentPeriodEnd !== null ? Math.max(0, Math.floor((currentPeriodEnd - Date.now()) / MS_IN_DAY)) : null;

  return {
    status,
    currentPeriodEnd,
    cancelAt,
    planId,
    planName,
    isTrialing,
    daysSinceSubscribed,
    daysUntilRenewal,
    paymentMethod,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const firestore = useMemo(() => getFirestore(app), []);
  const { user } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({ ...DEFAULT_SUBSCRIPTION_STATE });
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [refreshError, setRefreshError] = useState<Error | null>(null);

  const emitSubscriptionChange = useCallback(
    (newStatus: SubscriptionStatus) => {
      if (typeof window === "undefined") {
        return;
      }

      window.dispatchEvent(
        new CustomEvent("subscription-changed", {
          detail: { status: newStatus, previousStatus: subscriptionState.status },
        }),
      );
    },
    [subscriptionState.status],
  );

  const updateSubscriptionState = useCallback(
    (raw: RawSubscription | null): SubscriptionStatus => {
      const nextState = deriveSubscriptionState(raw);

      if (subscriptionState.status !== nextState.status) {
        emitSubscriptionChange(nextState.status);
      }

      setSubscriptionState(nextState);
      return nextState.status;
    },
    [emitSubscriptionChange, subscriptionState.status],
  );

  const refresh = useCallback(async (): Promise<SubscriptionStatus> => {
    if (!user) {
      setRefreshError(null);
      setLoading(false);
      setIsRefreshing(false);
      setLastRefreshTime(Date.now());
      return updateSubscriptionState(null);
    }

    setIsRefreshing(true);
    setLoading(true);
    setRefreshError(null);

    try {
      const subscriptionsRef = collection(firestore, "customers", user.uid, "subscriptions");
      const snapshot = await getDocs(subscriptionsRef);
      const rawSubscriptions = snapshot.docs.map((doc) => doc.data() as RawSubscription);

      if (rawSubscriptions.length === 0) {
        const nextStatus = updateSubscriptionState(null);
        setLastRefreshTime(Date.now());
        return nextStatus;
      }

      const preferredSubscription = selectPreferredSubscription(rawSubscriptions);
      const nextStatus = updateSubscriptionState(preferredSubscription);
      setLastRefreshTime(Date.now());
      return nextStatus;
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Unable to refresh subscription status at this time.");
      setRefreshError(normalizedError);
      console.error("Error refreshing subscription status:", normalizedError);
      return subscriptionState.status;
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [firestore, subscriptionState.status, updateSubscriptionState, user]);

  useEffect(() => {
    if (!user) {
      // Immediately reset state when user signs out
      updateSubscriptionState(null);
      setLoading(false);
      setRefreshError(null);
      setLastRefreshTime(Date.now());
      return;
    }

    void refresh();
  }, [refresh, updateSubscriptionState, user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const activeIntervals: number[] = [];
    const activeTimeouts: number[] = [];

    const handlePaymentSuccess = () => {
      const pollInterval = window.setInterval(async () => {
        try {
          const nextStatus = await refresh();
          if (nextStatus === "active") {
            window.clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("Subscription refresh error:", error);
        }
      }, 2000);

      activeIntervals.push(pollInterval);

      const timeoutId = window.setTimeout(() => {
        window.clearInterval(pollInterval);
      }, 30000);

      activeTimeouts.push(timeoutId);
    };

    window.addEventListener("payment-success", handlePaymentSuccess);

    return () => {
      window.removeEventListener("payment-success", handlePaymentSuccess);
      activeIntervals.forEach((intervalId) => window.clearInterval(intervalId));
      activeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscriptionsRef = collection(firestore, "customers", user.uid, "subscriptions");
    const subscriptionQuery = query(subscriptionsRef, where("status", "in", ["active", "trialing", "past_due"]));

    const unsubscribe = onSnapshot(
      subscriptionQuery,
      (snapshot) => {
        const rawSubscriptions = snapshot.docs.map((doc) => doc.data() as RawSubscription);

        if (rawSubscriptions.length === 0) {
          updateSubscriptionState(null);
          setLastRefreshTime(Date.now());
          return;
        }

        const preferredSubscription = selectPreferredSubscription(rawSubscriptions);
        updateSubscriptionState(preferredSubscription);
        setLastRefreshTime(Date.now());
      },
      (error) => {
        console.error("Subscription listener error:", error);
      },
    );

    return () => unsubscribe();
  }, [firestore, updateSubscriptionState, user]);

  const checkSubscriptionStatus = useCallback(
    async (forceRefresh = false) => {
      const cacheExpired = Date.now() - lastRefreshTime > 60_000;

      if (!forceRefresh && !cacheExpired && subscriptionState.status !== "none") {
        return subscriptionState.status;
      }

      return refresh();
    },
    [lastRefreshTime, refresh, subscriptionState.status],
  );

  const setOptimisticSubscription = useCallback(() => {
    setSubscriptionState((previous) => {
      if (previous.status === "active") {
        return previous;
      }

      emitSubscriptionChange("active");
      return { ...previous, status: "active" };
    });

    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      void (async () => {
        const actualStatus = await refresh();
        if (actualStatus !== "active") {
          toast.error("Subscription activation pending...");
        }
      })();
    }, 5000);
  }, [emitSubscriptionChange, refresh]);

  const isSubscriptionExpiring = useCallback(() => {
    if (!subscriptionState.currentPeriodEnd) {
      return false;
    }

    const daysRemaining = Math.floor((subscriptionState.currentPeriodEnd - Date.now()) / MS_IN_DAY);
    return daysRemaining <= 7;
  }, [subscriptionState.currentPeriodEnd]);

  const getSubscriptionDisplayStatus = useCallback(() => {
    if (loading) {
      return "Loading...";
    }

    if (subscriptionState.status === "active") {
      return "Active";
    }

    if (subscriptionState.status === "past_due") {
      return "Payment pending";
    }

    if (subscriptionState.status === "canceled") {
      return "Canceled";
    }

    return "Free";
  }, [loading, subscriptionState.status]);

  const canAccessPremiumFeatures = useCallback(() => {
    return subscriptionState.status === "active" || subscriptionState.status === "past_due";
  }, [subscriptionState.status]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      ...subscriptionState,
      loading,
      isRefreshing,
      refreshError,
      refresh,
      checkSubscriptionStatus,
      setOptimisticSubscription,
      isSubscriptionExpiring,
      getSubscriptionDisplayStatus,
      canAccessPremiumFeatures,
      hasActiveSubscription: subscriptionState.status === "active",
    }),
    [
      subscriptionState,
      loading,
      isRefreshing,
      refreshError,
      refresh,
      checkSubscriptionStatus,
      setOptimisticSubscription,
      isSubscriptionExpiring,
      getSubscriptionDisplayStatus,
      canAccessPremiumFeatures,
    ],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscriptionContext(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscriptionContext must be used within a SubscriptionProvider");
  }

  return context;
}
