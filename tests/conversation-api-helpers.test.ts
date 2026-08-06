import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("conversation mention notification helper requires internal authorization and fails closed", () => {
  const source = readSource(
    "ee/features/conversations/api/send-conversation-mention-notification.ts",
  );

  assert.match(source, /req\.method !== "POST"/);
  assert.match(source, /process\.env\.INTERNAL_API_KEY/);
  assert.match(source, /return res\.status\(401\)/);
  assert.match(source, /return res\.status\(501\)/);
  assert.doesNotMatch(source, /sendConversation\w*Notification\s*\(/);
});

test("team questions helper authenticates and scopes queries to an active team membership", () => {
  const source = readSource(
    "ee/features/conversations/api/team-questions-route.ts",
  );

  assert.match(source, /getServerSession\(req, res, authOptions\)/);
  assert.match(
    source,
    /users:\s*\{\s*some:\s*\{\s*userId[\s\S]*blockedAt:\s*null/,
  );
  assert.match(source, /teamId/);
  assert.match(source, /dataroomId/);
});
