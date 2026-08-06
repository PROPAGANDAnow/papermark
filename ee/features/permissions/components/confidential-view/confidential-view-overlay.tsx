import React, { type CSSProperties } from "react";

/**
 * Fail-closed compatibility boundary for persisted confidential-view settings.
 *
 * The premium confidential-view enforcement flow is not present in this
 * distribution. A persisted enabled setting must therefore obscure the viewer,
 * rather than render protected material without its promised protection.
 *
 * This is deliberately a fixed, opaque layer with the highest practical stack
 * level. It is independent of every viewer's local positioning/transform
 * context, and intercepts pointer/touch input before it reaches the content.
 */
export type ConfidentialViewOverlayProps = {
  navbarAbove?: boolean;
  rotation?: number;
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  backgroundColor: "rgb(3, 7, 18)",
  color: "white",
  isolation: "isolate",
  pointerEvents: "auto",
  touchAction: "none",
  userSelect: "none",
};

export function ConfidentialViewOverlay(_props: ConfidentialViewOverlayProps) {
  return (
    <div
      aria-label="Confidential content is unavailable"
      aria-modal="true"
      data-testid="confidential-view-overlay"
      role="alertdialog"
      style={overlayStyle}
      tabIndex={-1}
    >
      <p className="max-w-md text-center text-sm font-medium leading-6">
        Confidential content is unavailable.
      </p>
    </div>
  );
}
