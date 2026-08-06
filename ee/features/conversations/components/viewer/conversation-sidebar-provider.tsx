"use client";

import { type ReactNode } from "react";

/**
 * Conversation viewer UI is not available in this build. Keep the public
 * viewer's integration inert rather than reconstructing a client-side state
 * provider that could expose a conversation panel without server-verified
 * authorization.
 */
export function ConversationSidebarProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

/**
 * Returns null while the conversation sidebar is unavailable. Callers must
 * treat the missing context as disabled and must not render any data.
 */
export type ConversationSidebarState = {
  isOpen: boolean;
};

export function useConversationSidebarSafe(): ConversationSidebarState | null {
  return null;
}

/**
 * Preserves the viewer layout API without reserving space for an unavailable
 * sidebar or initiating any conversation-related client behavior.
 */
export function ConversationSidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
