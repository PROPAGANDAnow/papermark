import bcrypt from "bcryptjs";

type AdminAuthEnvironment = {
  ADMIN_EMAILS?: string;
  ADMIN_PASSWORD_HASHES?: string;
};

type AdminCredentials = {
  email?: string;
  password?: string;
};

function normalizeEmail(email: string | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

function configuredAdminEmails(env: AdminAuthEnvironment): Set<string> {
  return new Set(
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter((email): email is string => Boolean(email)),
  );
}

function configuredPasswordHashes(
  env: AdminAuthEnvironment,
): Record<string, string> {
  try {
    const hashes = JSON.parse(env.ADMIN_PASSWORD_HASHES ?? "{}") as unknown;
    if (!hashes || typeof hashes !== "object" || Array.isArray(hashes)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(hashes).flatMap(([email, hash]) => {
        const normalizedEmail = normalizeEmail(email);
        return normalizedEmail && typeof hash === "string" && hash.length > 0
          ? [[normalizedEmail, hash]]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

export function canAccessAdminRoute(
  email: string | undefined,
  env: AdminAuthEnvironment = {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_PASSWORD_HASHES: process.env.ADMIN_PASSWORD_HASHES,
  },
): boolean {
  const normalizedEmail = normalizeEmail(email);
  return (
    normalizedEmail !== null && configuredAdminEmails(env).has(normalizedEmail)
  );
}

export async function authorizeAdminCredentials(
  credentials: AdminCredentials | undefined,
  env: AdminAuthEnvironment = {
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    ADMIN_PASSWORD_HASHES: process.env.ADMIN_PASSWORD_HASHES,
  },
): Promise<{ id: string; email: string } | null> {
  const email = normalizeEmail(credentials?.email);
  const password = credentials?.password;

  if (!email || !password || !canAccessAdminRoute(email, env)) {
    return null;
  }

  const passwordHash = configuredPasswordHashes(env)[email];
  if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
    return null;
  }

  return { id: email, email };
}
