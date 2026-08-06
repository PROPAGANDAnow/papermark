import prisma from "@/lib/prisma";

import {
  PREMIUM_TEAM_LIMIT,
  getTeamCreationEligibility,
} from "./team-creation-eligibility";

export { PREMIUM_TEAM_LIMIT };

export async function getPremiumTeamEligibility(userId: string): Promise<{
  isPremiumAdmin: boolean;
  canCreate: boolean;
}> {
  try {
    const memberships = await prisma.userTeam.findMany({
      where: {
        userId,
        role: "ADMIN",
        status: "ACTIVE",
        blockedAt: null,
      },
      select: {
        role: true,
        status: true,
        blockedAt: true,
        team: {
          select: {
            plan: true,
          },
        },
      },
    });
    const eligibility = getTeamCreationEligibility(memberships);

    return {
      isPremiumAdmin: eligibility.isPremiumAdmin,
      canCreate: eligibility.canCreatePremium,
    };
  } catch {
    return { isPremiumAdmin: false, canCreate: false };
  }
}
