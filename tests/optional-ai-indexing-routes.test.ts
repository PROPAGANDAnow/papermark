import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routes = [
  "app/(ee)/api/ai/store/teams/[teamId]/datarooms/[dataroomId]/route.ts",
  "app/(ee)/api/ai/store/teams/[teamId]/documents/[documentId]/route.ts",
];

test("optional AI indexing routes load OpenAI-backed helpers only after a credential guard", () => {
  for (const route of routes) {
    const source = readFileSync(route, "utf8");
    assert.doesNotMatch(
      source,
      /^import .*@(\/ee)?\/features\/ai\/lib\/(trigger|vector-stores)/m,
      `${route} must not statically import eager AI helpers`,
    );

    const credentialGuard = source.indexOf("process.env.OPENAI_API_KEY");
    const dynamicImport = source.indexOf("import(");
    assert.ok(credentialGuard >= 0, `${route} needs an OpenAI credential guard`);
    assert.ok(
      dynamicImport > credentialGuard,
      `${route} must dynamically import AI helpers after the guard`,
    );
  }
});
