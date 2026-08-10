import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Slack event manager does not construct its optional client at module load", () => {
  const source = readFileSync("lib/integrations/slack/events.ts", "utf8");

  assert.doesNotMatch(source, /constructor\(\)\s*{\s*this\.client = new SlackClient\(\)/);
  assert.doesNotMatch(
    source,
    /export const slackEventManager = new SlackEventManager\(\);/,
  );
  assert.match(source, /function getSlackEventManager\(\)/);
});
