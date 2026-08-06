import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repositoryRoot = process.cwd();
const providerPath = join(
  repositoryRoot,
  "ee/features/conversations/components/viewer/conversation-sidebar-provider.tsx",
);

test("conversation sidebar fallback is inert and does not fetch viewer data", () => {
  const source = readFileSync(providerPath, "utf8");

  assert.match(source, /export function ConversationSidebarProvider/);
  assert.match(source, /export function useConversationSidebarSafe/);
  assert.match(source, /export function ConversationSidebarLayout/);
  assert.match(source, /return null;/);
  assert.doesNotMatch(source, /\b(fetch|useSWR|axios)\b/);
});
