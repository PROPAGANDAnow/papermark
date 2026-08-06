"use client";

/**
 * Compatibility boundary for the incomplete viewer Request List feature.
 *
 * The fallback deliberately exposes no trigger, so an incomplete feature
 * cannot be opened, perform a request, or initiate navigation.
 */
export type RequestListButtonProps = {
  className?: string;
};

export function RequestListButton(_props: RequestListButtonProps) {
  return null;
}
