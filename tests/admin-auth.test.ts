import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeAdminCredentials,
  canAccessAdminRoute,
} from "../lib/auth/admin-auth";

const passwordHash =
  "$2b$10$3Pa2eUMI0qP8cT2fQhejzOyTBDbZdwIa2C/TYGGm.sjdxRXbUjwkW";
const env = {
  ADMIN_EMAILS: "admin@example.com",
  ADMIN_PASSWORD_HASHES: JSON.stringify({
    "admin@example.com": passwordHash,
  }),
};

test("rejects invalid and non-allowlisted administrator credentials", async () => {
  assert.equal(
    await authorizeAdminCredentials(
      { email: "admin@example.com", password: "wrong-password" },
      env,
    ),
    null,
  );
  assert.equal(
    await authorizeAdminCredentials(
      { email: "not-admin@example.com", password: "password" },
      env,
    ),
    null,
  );
});

test("accepts a configured administrator with the matching password", async () => {
  const user = await authorizeAdminCredentials(
    { email: "ADMIN@example.com", password: "password" },
    env,
  );

  assert.deepEqual(user, {
    email: "admin@example.com",
    id: "admin@example.com",
  });
});

test("rejects unauthenticated and non-admin sessions from protected admin routes", () => {
  assert.equal(canAccessAdminRoute(undefined, env), false);
  assert.equal(canAccessAdminRoute("not-admin@example.com", env), false);
  assert.equal(canAccessAdminRoute("admin@example.com", env), true);
});
