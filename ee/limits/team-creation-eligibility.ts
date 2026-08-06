export const PREMIUM_TEAM_LIMIT = 5;

type TeamCreationMembership = {
  role: string;
  status: string;
  blockedAt: Date | null;
  team: {
    plan: string;
  };
};

const isActiveAdmin = (membership: TeamCreationMembership) =>
  membership.role === "ADMIN" &&
  membership.status === "ACTIVE" &&
  membership.blockedAt === null;

export function getTeamCreationEligibility(
  memberships: TeamCreationMembership[],
) {
  const activeAdminMemberships = memberships.filter(isActiveAdmin);
  const plans = activeAdminMemberships.map(
    (membership) => membership.team.plan,
  );
  const canCreateUnlimited = plans.includes("datarooms-unlimited");
  const isPremiumAdmin = plans.includes("datarooms-premium");

  return {
    isPremiumAdmin,
    canCreatePremium:
      !canCreateUnlimited &&
      isPremiumAdmin &&
      activeAdminMemberships.length < PREMIUM_TEAM_LIMIT,
    canCreateUnlimited,
  };
}
