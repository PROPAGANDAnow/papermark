import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const pagePath = path.join(
  process.cwd(),
  "ee/features/dataroom-analytics/pages/dataroom-analytics-page.tsx",
);

test("dataroom analytics fallback is available without requesting analytics data", () => {
  assert.equal(
    existsSync(pagePath),
    true,
    "the analytics route must resolve to a local fallback page",
  );

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /AppLayout/);
  assert.match(page, /Analytics are currently unavailable/);
  assert.doesNotMatch(page, /\/api\//);
  assert.doesNotMatch(page, /useDataroom(?:Stats|Visitors|DocumentStats)/);
  assert.doesNotMatch(page, /DataroomVisitorsTable/);
  assert.doesNotMatch(page, /StatsCard/);
});
