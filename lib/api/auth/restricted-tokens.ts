import { z } from "zod";

import { GRANULAR_SCOPES } from "@/lib/oauth/scopes";
import prisma from "@/lib/prisma";

export const RestrictedTokenSubjectTypeSchema = z.enum(["user", "machine"]);

export type RestrictedTokenSubjectType = z.infer<
  typeof RestrictedTokenSubjectTypeSchema
>;

const granularScopeSet = new Set<string>(GRANULAR_SCOPES);

/**
 * Parses a persisted token owner type. Unknown values deliberately become user
 * tokens so they remain tied to (and are revoked with) the issuing user.
 */
export function parseRestrictedTokenSubjectType(
  subjectType: unknown,
): RestrictedTokenSubjectType {
  const parsedSubjectType =
    RestrictedTokenSubjectTypeSchema.safeParse(subjectType);
  return parsedSubjectType.success ? parsedSubjectType.data : "user";
}

/**
 * Returns a validated scope set, or null when the stored representation cannot
 * safely authorize a request. In particular, missing/unknown/mixed preset
 * scopes never fall back to unrestricted access.
 */
export function parseRestrictedTokenScopes(
  rawScopes: unknown,
): ReadonlySet<string> | null {
  if (typeof rawScopes !== "string") {
    return null;
  }

  const scopes = rawScopes.split(/[\s,]+/).filter(Boolean);
  if (
    scopes.length === 0 ||
    scopes.some(
      (scope) =>
        !granularScopeSet.has(scope) &&
        scope !== "apis.all" &&
        scope !== "apis.read",
    )
  ) {
    return null;
  }

  const uniqueScopes = new Set(scopes);
  const hasAll = uniqueScopes.has("apis.all");
  const hasRead = uniqueScopes.has("apis.read");

  // Presets are intentionally exclusive. Accepting a preset alongside granular
  // values could turn an invalid/legacy record into broader authorization.
  if (
    (hasAll && uniqueScopes.size !== 1) ||
    (hasRead && uniqueScopes.size !== 1)
  ) {
    return null;
  }

  return uniqueScopes;
}

/**
 * Checks one granular API permission. This is deny-by-default: invalid stored
 * scopes, unknown requested scopes, and write scopes implied from read scopes
 * are all rejected.
 */
export function hasRestrictedTokenScope(
  rawScopes: unknown,
  requiredScope: string,
): boolean {
  if (!granularScopeSet.has(requiredScope)) {
    return false;
  }

  const scopes = parseRestrictedTokenScopes(rawScopes);
  if (!scopes) {
    return false;
  }

  if (scopes.has("apis.all")) {
    return true;
  }

  if (scopes.has("apis.read")) {
    return requiredScope.endsWith(".read");
  }

  return scopes.has(requiredScope);
}

/**
 * Removes user-bound keys when their owner is removed from a team. Machine keys
 * are team-bound and intentionally survive; malformed persisted subject types
 * are revoked rather than being treated as machine keys.
 */
export function revokeUserBoundTeamTokens(userId: string, teamId: string) {
  return prisma.restrictedToken.deleteMany({
    where: {
      userId,
      teamId,
      subjectType: { not: "machine" },
    },
  });
}
