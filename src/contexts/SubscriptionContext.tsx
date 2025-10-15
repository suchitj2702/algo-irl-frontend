import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

interface SubscriptionContextValue {
  status: SubscriptionStatus;
  currentPeriodEnd: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, getSubscriptionStatus } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("none");
  const [loading, setLoading] = useState<boolean>(false);
  const currentPeriodEnd: number | null = null;

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus("none");
      return;
    }

    setLoading(true);
    try {
      const nextStatus = await getSubscriptionStatus();
      setStatus(nextStatus);
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      setStatus("none");
    } finally {
      setLoading(false);
    }
  }, [user, getSubscriptionStatus]);

  useEffect(() => {
    if (!user) {
      // Immediately reset state when user signs out
      setStatus("none");
      setLoading(false);
      return;
    }

    void refresh();
  }, [user, refresh]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      status,
      currentPeriodEnd,
      loading,
      refresh,
    }),
    [status, currentPeriodEnd, loading, refresh],
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
