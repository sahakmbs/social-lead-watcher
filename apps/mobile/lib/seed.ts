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
      step: 4,
      business: {
        businessName: "Demo Home Services",
        website: "https://example.com",
        phone: "(555) 010-2000",
        email: "leads@example.com",
        voice: "friendly, professional, concise",
        licenseNote: "Licensed & insured — demo only",
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
      platforms: ["facebook", "nextdoor"],
      connections: [
        {
          type: "facebook",
          connected: true,
          identityName: "Demo Home Services Page",
          status: "agent_mode",
          connectedAt: hoursAgo(40),
          note: "Connected Page identity + agent/browser worker playbook (not Meta Graph group scraping API).",
        },
        {
          type: "nextdoor",
          connected: true,
          identityName: "Demo Nextdoor Biz",
          status: "connected",
          connectedAt: hoursAgo(39),
          note: "OAuth stub — adapter hook ready.",
        },
      ],
      completed: true,
    },
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(1),
  };
  const activity: ActivityRecord[] = [
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(0.5), platform: "facebook", action: "comment_posted", postSnippet: "Looking for vinyl siding contractor in Seattle…", classification: "strong", need: "vinyl siding", detail: "Commented as Page" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(0.6), platform: "facebook", action: "dm_sent", postSnippet: "Looking for vinyl siding contractor in Seattle…", classification: "strong", need: "vinyl siding", detail: "Messenger DM attempted" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(0.7), platform: "facebook", action: "lead_found", postSnippet: "Looking for vinyl siding contractor in Seattle…", classification: "strong", need: "vinyl siding" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(2), platform: "facebook", action: "skipped", postSnippet: "Roofer looking for work, available hourly…", classification: "skip", detail: "skip_patterns: looking for work, hourly" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(3), platform: "nextdoor", action: "lead_found", postSnippet: "Need a deck builder near Bellevue — recommendations?", classification: "strong", need: "deck" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(3.1), platform: "nextdoor", action: "comment_posted", postSnippet: "Need a deck builder near Bellevue — recommendations?", classification: "strong", need: "deck" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(5), platform: "facebook", action: "skipped", postSnippet: "Anyone know a good pizza place?", classification: "skip", detail: "no in_scope trade" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(8), platform: "facebook", action: "lead_found", postSnippet: "Kitchen remodel quotes in King County please", classification: "maybe", need: "kitchen remodel" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(8.2), platform: "facebook", action: "comment_posted", postSnippet: "Kitchen remodel quotes in King County please", classification: "maybe", need: "kitchen remodel" },
    { id: rid(), tenantId: DEMO_TENANT_ID, ts: hoursAgo(40), platform: "facebook", action: "platform_connected", detail: "facebook connected as Demo Home Services Page (agent_mode)" },
  ];
  return { users: [user], tenants: [tenant], activity, sessionUserId: null };
}
