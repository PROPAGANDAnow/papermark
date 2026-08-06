import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { usePlan } from "@/lib/swr/use-billing";

/**
 * Client-side counterpart to `isRequestListEnabled`. The flag is intentionally
 * fail-closed while either the billing or feature-flag request is unresolved.
 */
export function requestListFeatureEnabled(
  teamPlan: string | null | undefined,
  requestListFlag: boolean | undefined,
): boolean {
  const plan = teamPlan?.split("+")[0];

  return (
    plan === "datarooms-plus" ||
    plan === "datarooms-premium" ||
    plan === "datarooms-unlimited" ||
    requestListFlag === true
  );
}

export function useRequestListFeatureEnabled(): boolean {
  const { plan } = usePlan();
  const { isFeatureEnabled } = useFeatureFlags();

  return requestListFeatureEnabled(plan, isFeatureEnabled("requestList"));
}
