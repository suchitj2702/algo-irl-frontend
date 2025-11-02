import { useMemo } from "react";
import { useSubscriptionContext } from "../contexts/SubscriptionContext";

export function useSubscription() {
  const subscription = useSubscriptionContext();

  return useMemo(
    () => ({
      ...subscription,
      isPastDue: subscription.status === "past_due",
      isCanceled: subscription.status === "canceled",
    }),
    [subscription],
  );
}
