import useSWR from "swr";

export type ViewerRequestListOptions = {
  linkId: string | null | undefined;
  dataroomId: string | null | undefined;
  viewerId: string | null | undefined;
  isPreview: boolean | null | undefined;
};

/**
 * Treat request-list access as disabled unless a future session-verified API
 * explicitly returns `{ enabled: true }`. The viewer API is intentionally not
 * wired in this worktree, so using a null SWR key avoids issuing an unverified
 * request while preserving the hook contract for existing viewer UI.
 */
export function viewerRequestListEnabled(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "enabled" in data &&
    (data as { enabled?: unknown }).enabled === true
  );
}

/**
 * Safe compatibility hook for the incomplete Request List feature.
 *
 * A null key keeps SWR disabled: missing IDs, preview mode, fetch failures, and
 * absent API data all resolve to `enabled: false`. This must be replaced only
 * alongside a session-verified endpoint that returns an explicit boolean.
 */
export function useViewerRequestList(_options: ViewerRequestListOptions) {
  const { data, error, isLoading, mutate } = useSWR<unknown>(null);

  return {
    enabled: viewerRequestListEnabled(data),
    error,
    isLoading,
    mutate,
  };
}
