"use client";

/**
 * Compatibility boundary for the incomplete viewer Request List feature.
 *
 * This intentionally renders nothing and performs no requests, mutations, or
 * navigation. The parent only mounts it after a session-verified entitlement;
 * until a complete viewer implementation exists, the fallback remains closed.
 */
export type RequestListSheetProps = {
  linkId: string;
  dataroomId: string;
  viewId: string;
  viewerId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequestListSheet(_props: RequestListSheetProps) {
  return null;
}
