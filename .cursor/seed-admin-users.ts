import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

/**
 * This fork authenticates administrators with the `admin-password` credentials
 * provider, which issues a session whose user `id` is the admin email (see
 * `lib/auth/admin-auth.ts`). Dashboard bootstrap (`/api/teams`) then creates a
 * `UserTeam` referencing that id, so a matching `User` row must exist or the
 * foreign key fails. This seed keeps a `User` row (id = email) in sync with the
 * `ADMIN_EMAILS` allowlist so a freshly provisioned environment is usable.
 */
async function main() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(normalizeEmail)
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    console.log("[seed-admin-users] No ADMIN_EMAILS configured; nothing to do.");
    return;
  }

  for (const email of emails) {
    const user = await prisma.user.upsert({
      where: { id: email },
      update: { email, emailVerified: new Date() },
      create: {
        id: email,
        email,
        name: email.split("@")[0],
        emailVerified: new Date(),
      },
      select: { id: true, email: true },
    });
    console.log(`[seed-admin-users] Ensured admin user ${user.email}`);
  }
}

main()
  .catch((error) => {
    console.error("[seed-admin-users] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
