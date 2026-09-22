export type PlatformType = "facebook" | "nextdoor" | "craigslist" | "reddit";
export type WatcherStatus = "watching" | "needs_attention" | "paused";
export type PlanTier = "starter" | "growth" | "pro" | "none";
export type ActivityAction =
  | "lead_found"
  | "comment_posted"
  | "dm_sent"
  | "skipped"
  | "platform_connected"
  | "watcher_paused"
  | "watcher_resumed"
  | "plan_activated";

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface BusinessInfo {
  businessName: string;
  website: string;
  phone: string;
  email: string;
  voice: string;
  licenseNote: string;
}

export interface LeadScope {
  serviceArea: string[];
  inScope: string[];
  outOfScope: string[];
  skipPatterns: string[];
  maxOutreach: number;
}

export interface PlatformConnection {
  type: PlatformType;
  connected: boolean;
  identityName: string;
  status: "disconnected" | "connected" | "needs_reauth" | "agent_mode";
  connectedAt?: string;
  note?: string;
}

export interface OnboardingDraft {
  step: number;
  business: BusinessInfo;
  scope: LeadScope;
  platforms: PlatformType[];
  connections: PlatformConnection[];
  completed: boolean;
}

export interface Tenant {
  id: string;
  userId: string;
  plan: PlanTier;
  planActive: boolean;
  watcherStatus: WatcherStatus;
  onboarding: OnboardingDraft;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  tenantId: string;
  ts: string;
  platform: PlatformType | "system";
  action: ActivityAction;
  postUrl?: string;
  postSnippet?: string;
  classification?: "strong" | "maybe" | "skip";
  need?: string;
  detail?: string;
}

export interface StoreData {
  users: User[];
  tenants: Tenant[];
  activity: ActivityRecord[];
  sessionUserId: string | null;
}
