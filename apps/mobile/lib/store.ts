import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  OnboardingDraft,
  PlatformType,
  PlanTier,
  StoreData,
  Tenant,
  User,
  WatcherStatus,
} from "./types";
import { createSeedStore, defaultOnboarding, DEMO_CREDENTIALS } from "./seed";

const KEY = "slw.store.v1";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

let memory: StoreData | null = null;

export function isDemoMode() {
  return process.env.EXPO_PUBLIC_DEMO_MODE !== "0";
}

export async function loadStore(): Promise<StoreData> {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      memory = JSON.parse(raw) as StoreData;
      return memory!;
    }
  } catch {
    /* ignore */
  }
  memory = createSeedStore();
  await persist();
  return memory;
}

async function persist() {
  if (!memory) return;
  await AsyncStorage.setItem(KEY, JSON.stringify(memory));
}

export async function resetDemoStore() {
  memory = createSeedStore();
  await persist();
  return memory;
}

export async function getSession(): Promise<{ user: User; tenant: Tenant } | null> {
  const store = await loadStore();
  if (!store.sessionUserId) return null;
  const user = store.users.find((u) => u.id === store.sessionUserId);
  if (!user) return null;
  const tenant = store.tenants.find((t) => t.userId === user.id);
  if (!tenant) return null;
  return { user, tenant };
}

export async function signup(email: string, name: string, password: string) {
  const store = await loadStore();
  if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  const user: User = {
    id: uid(),
    email: email.toLowerCase().trim(),
    name: name.trim() || email.split("@")[0],
    password,
    createdAt: new Date().toISOString(),
  };
  const tenant: Tenant = {
    id: uid(),
    userId: user.id,
    plan: "none",
    planActive: false,
    watcherStatus: "paused",
    onboarding: defaultOnboarding(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.users.push(user);
  store.tenants.push(tenant);
  store.sessionUserId = user.id;
  await persist();
  return { user, tenant };
}

export async function login(email: string, password: string) {
  const store = await loadStore();
  const user = store.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user) throw new Error("Invalid email or password");
  store.sessionUserId = user.id;
  await persist();
  const tenant = store.tenants.find((t) => t.userId === user.id)!;
  return { user, tenant };
}

export async function demoLogin() {
  return login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
}

export async function logout() {
  const store = await loadStore();
  store.sessionUserId = null;
  await persist();
}

export async function saveOnboarding(draft: OnboardingDraft): Promise<Tenant> {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const t = store.tenants.find((x) => x.id === sess.tenant.id)!;
  t.onboarding = draft;
  t.updatedAt = new Date().toISOString();
  await persist();
  return t;
}

export async function goLive(): Promise<Tenant> {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const t = store.tenants.find((x) => x.id === sess.tenant.id)!;
  t.onboarding.completed = true;
  t.onboarding.step = 4;
  t.watcherStatus = "watching";
  t.updatedAt = new Date().toISOString();
  store.activity.unshift({
    id: uid(),
    tenantId: t.id,
    ts: new Date().toISOString(),
    platform: "system",
    action: "watcher_resumed",
    detail: "Went live from onboarding — watcher Watching",
  });
  await persist();
  try {
    const api = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";
    await fetch(`${api}/api/onboarding/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant: t }),
    });
  } catch {
    /* offline ok */
  }
  return t;
}

export async function connectPlatform(type: PlatformType, identityName: string) {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const t = store.tenants.find((x) => x.id === sess.tenant.id)!;
  const note =
    type === "facebook"
      ? "Connected Page identity + agent/browser worker playbook (not Meta Graph group scraping API)."
      : "OAuth stub — adapter hook ready for real credentials.";
  const conn = {
    type,
    connected: true,
    identityName: identityName || `${type} account`,
    status: type === "facebook" ? ("agent_mode" as const) : ("connected" as const),
    connectedAt: new Date().toISOString(),
    note,
  };
  t.onboarding.connections = [
    ...t.onboarding.connections.filter((c) => c.type !== type),
    conn,
  ];
  if (!t.onboarding.platforms.includes(type)) t.onboarding.platforms.push(type);
  t.updatedAt = new Date().toISOString();
  store.activity.unshift({
    id: uid(),
    tenantId: t.id,
    ts: new Date().toISOString(),
    platform: type,
    action: "platform_connected",
    detail: `${type} connected as ${conn.identityName} (${conn.status})`,
  });
  await persist();
  return conn;
}

export async function setWatcherStatus(status: WatcherStatus) {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const t = store.tenants.find((x) => x.id === sess.tenant.id)!;
  t.watcherStatus = status;
  t.updatedAt = new Date().toISOString();
  store.activity.unshift({
    id: uid(),
    tenantId: t.id,
    ts: new Date().toISOString(),
    platform: "system",
    action: status === "paused" ? "watcher_paused" : "watcher_resumed",
    detail: `Watcher set to ${status}`,
  });
  await persist();
  return t;
}

export async function activatePlan(plan: PlanTier) {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const t = store.tenants.find((x) => x.id === sess.tenant.id)!;
  t.plan = plan;
  t.planActive = true;
  t.updatedAt = new Date().toISOString();
  store.activity.unshift({
    id: uid(),
    tenantId: t.id,
    ts: new Date().toISOString(),
    platform: "system",
    action: "plan_activated",
    detail: `Plan ${plan} activated (DEMO_MODE local)`,
  });
  await persist();
  return t;
}

export async function getDashboard() {
  const sess = await getSession();
  if (!sess) throw new Error("Unauthorized");
  const store = await loadStore();
  const activity = store.activity.filter((a) => a.tenantId === sess.tenant.id);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = activity.filter((a) => new Date(a.ts) >= start);
  return {
    user: sess.user,
    tenant: store.tenants.find((t) => t.id === sess.tenant.id)!,
    activity: activity.slice(0, 50),
    today: {
      leadsFound: today.filter((a) => a.action === "lead_found").length,
      commentsPosted: today.filter((a) => a.action === "comment_posted").length,
      dmsSent: today.filter((a) => a.action === "dm_sent").length,
      skipped: today.filter((a) => a.action === "skipped").length,
    },
  };
}
