import { useMemo } from "react";
import { useSubscriptionContext } from "../contexts/SubscriptionContext";

export function useSubscription() {
  const { status, currentPeriodEnd, loading, refresh } = useSubscriptionContext();

  const hasActiveSubscription = useMemo(() => status === "active", [status]);
  const isPastDue = useMemo(() => status === "past_due", [status]);
  const isCanceled = useMemo(() => status === "canceled", [status]);

  return {
    status,
    currentPeriodEnd,
    loading,
    refresh,
    hasActiveSubscription,
    isPastDue,
    isCanceled,
  };
}
