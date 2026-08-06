import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../next.config.mjs";

test("omits host-matched config when the corresponding host is not configured", async () => {
  const getHeaders = nextConfig.headers;
  const getRedirects = nextConfig.redirects;
  assert.equal(typeof getHeaders, "function");
  assert.equal(typeof getRedirects, "function");

  const [headers, redirects] = await Promise.all([
    getHeaders(),
    getRedirects(),
  ]);
  const hasUndefinedHost = (routes: typeof headers) =>
    routes.some((route) =>
      route.has?.some(
        (condition) => condition.type === "host" && !condition.value,
      ),
    );

  assert.equal(hasUndefinedHost(headers), false);
  assert.equal(hasUndefinedHost(redirects), false);
});
