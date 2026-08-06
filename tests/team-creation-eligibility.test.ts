import assert from "node:assert/strict";
import test from "node:test";

import {
  PREMIUM_TEAM_LIMIT,
  getTeamCreationEligibility,
} from "../ee/limits/team-creation-eligibility";

test("grants unlimited creation only to active admins of an unlimited team", () => {
  assert.deepEqual(
    getTeamCreationEligibility([
      {
        role: "ADMIN",
        status: "ACTIVE",
        blockedAt: null,
        team: { plan: "datarooms-unlimited" },
      },
    ]),
    {
      isPremiumAdmin: false,
      canCreatePremium: false,
      canCreateUnlimited: true,
    },
  );
});

test("grants premium creation to active premium admins below the team limit", () => {
  assert.deepEqual(
    getTeamCreationEligibility([
      {
        role: "ADMIN",
        status: "ACTIVE",
        blockedAt: null,
        team: { plan: "datarooms-premium" },
      },
      {
        role: "ADMIN",
        status: "ACTIVE",
        blockedAt: null,
        team: { plan: "free" },
      },
    ]),
    { isPremiumAdmin: true, canCreatePremium: true, canCreateUnlimited: false },
  );
});

test("denies premium creation after the premium team limit", () => {
  const memberships = Array.from({ length: PREMIUM_TEAM_LIMIT }, () => ({
    role: "ADMIN" as const,
    status: "ACTIVE",
    blockedAt: null,
    team: { plan: "datarooms-premium" },
  }));

  assert.deepEqual(getTeamCreationEligibility(memberships), {
    isPremiumAdmin: true,
    canCreatePremium: false,
    canCreateUnlimited: false,
  });
});

test("fails closed for unknown plans and inactive, blocked, or non-admin memberships", () => {
  for (const membership of [
    {
      role: "ADMIN",
      status: "ACTIVE",
      blockedAt: null,
      team: { plan: "enterprise" },
    },
    {
      role: "ADMIN",
      status: "INVITED",
      blockedAt: null,
      team: { plan: "datarooms-unlimited" },
    },
    {
      role: "ADMIN",
      status: "ACTIVE",
      blockedAt: new Date(),
      team: { plan: "datarooms-premium" },
    },
    {
      role: "MEMBER",
      status: "ACTIVE",
      blockedAt: null,
      team: { plan: "datarooms-unlimited" },
    },
  ]) {
    assert.deepEqual(getTeamCreationEligibility([membership]), {
      isPremiumAdmin: false,
      canCreatePremium: false,
      canCreateUnlimited: false,
    });
  }
});
