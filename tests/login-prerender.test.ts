import * as assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import * as path from "node:path";

test("login form does not opt the route into client-side-only rendering", async () => {
  const source = await readFile(
    path.join(process.cwd(), "app/(auth)/login/page-client.tsx"),
    "utf8",
  );

  assert.equal(
    source.includes("useSearchParams"),
    false,
    "useSearchParams causes a blank server response until the login bundle hydrates",
  );
});
