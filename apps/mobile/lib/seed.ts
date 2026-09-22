import type { ActivityRecord, OnboardingDraft, StoreData, Tenant, User } from "./types";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000002";
export const DEMO_CREDENTIALS = { email: "demo@leadwatcher.app", password: "demo" };

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}
function rid() {
  return `act-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultOnboarding(): OnboardingDraft {
  return {
    step: 0,
    business: {
      businessName: "",
      website: "",
      phone: "",
      email: "",
      voice: "friendly, professional, concise",
      licenseNote: "",
    },
    scope: {
      serviceArea: [],
      inScope: [],
      outOfScope: [],
      skipPatterns: [
        "looking for work",
        "hiring myself out",
        "I'm a contractor",
        "hourly",
        "$/hr",
        "per hour",
        "need crew",
        "subcontract",
      ],
      maxOutreach: 3,
    },
    platforms: ["facebook"],
    connections: [],
    completed: false,
  };
}

/** MasterFix-like sample activity — fictional groups, no real personal data */
export function createSeedStore(): StoreData {
  const user: User = {
    id: DEMO_USER_ID,
    email: DEMO_CREDENTIALS.email,
    name: "Demo User",
    password: DEMO_CREDENTIALS.password,
    createdAt: hoursAgo(48),
  };
  const tenant: Tenant = {
    id: DEMO_TENANT_ID,
    userId: DEMO_USER_ID,
    plan: "growth",
    planActive: true,
    watcherStatus: "watching",
    onboarding: {
      step: 2,
      business: {
        businessName: "Cascade Home Pros",
        website: "https://example-home-pros.example",
        phone: "(555) 010-2000",
        email: "leads@example.com",
        voice: "friendly, professional, concise",
        licenseNote: "Licensed & insured — demo",
      },
      scope: {
        serviceArea: ["Seattle", "Bellevue", "King County"],
        inScope: ["vinyl siding", "roofing", "kitchen remodel", "deck", "windows"],
        outOfScope: ["landscaping only", "cleaning", "moving"],
        skipPatterns: [
          "looking for work",
          "hiring myself out",
          "I'm a contractor",
          "hourly",
          "$/hr",
          "per hour",
          "need crew",
          "subcontract",
        ],
        maxOutreach: 3,
      },
      platforms: ["facebook", "nextdoor", "craigslist", "reddit"],
      connections: [
        {
          type: "facebook",
          connected: true,
          identityName: "Cascade Home Pros Page",
          status: "agent_mode",
          connectedAt: hoursAgo(40),
          note: "Page + agent playbook",
        },
        {
          type: "nextdoor",
          connected: false,
          identityName: "",
          status: "disconnected",
          note: "Coming soon",
        },
        {
          type: "craigslist",
          connected: false,
          identityName: "",
          status: "disconnected",
          note: "Coming soon",
        },
        {
          type: "reddit",
          connected: false,
          identityName: "",
          status: "disconnected",
          note: "Coming soon",
        },
      ],
      completed: true,
    },
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(1),
  };

  const activity: ActivityRecord[] = [
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(0.4),
      platform: "facebook",
      action: "comment_posted",
      need: "vinyl siding",
      classification: "strong",
      postUrl: "https://facebook.com/groups/example/posts/1",
      detail: "✓ Commented on a vinyl siding lead in Contractors of Seattle",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(0.45),
      platform: "facebook",
      action: "dm_sent",
      need: "vinyl siding",
      classification: "strong",
      detail: "✓ Sent a DM on a vinyl siding lead in Contractors of Seattle",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(0.5),
      platform: "facebook",
      action: "lead_found",
      need: "vinyl siding",
      classification: "strong",
      detail: "✓ Found a strong vinyl siding lead in Contractors of Seattle",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(2),
      platform: "facebook",
      action: "skipped",
      classification: "skip",
      detail: "✓ Skipped a post on facebook (looking for work, hourly)",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(3.2),
      platform: "facebook",
      action: "comment_posted",
      need: "deck",
      classification: "strong",
      detail: "✓ Commented on a deck lead in Eastside Homeowners",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(3.3),
      platform: "facebook",
      action: "lead_found",
      need: "deck",
      classification: "strong",
      detail: "✓ Found a strong deck lead in Eastside Homeowners",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(5),
      platform: "facebook",
      action: "skipped",
      classification: "skip",
      detail: "✓ Skipped a post on facebook (no in_scope trade)",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(8),
      platform: "facebook",
      action: "comment_posted",
      need: "kitchen remodel",
      classification: "maybe",
      detail: "✓ Commented on a kitchen remodel lead in King County Remodel Recs",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(8.1),
      platform: "facebook",
      action: "lead_found",
      need: "kitchen remodel",
      classification: "maybe",
      detail: "✓ Found a maybe kitchen remodel lead in King County Remodel Recs",
    },
    {
      id: rid(),
      tenantId: DEMO_TENANT_ID,
      ts: hoursAgo(40),
      platform: "facebook",
      action: "platform_connected",
      detail: "✓ Connected facebook as Cascade Home Pros Page",
    },
  ];
  return { users: [user], tenants: [tenant], activity, sessionUserId: null };
}
