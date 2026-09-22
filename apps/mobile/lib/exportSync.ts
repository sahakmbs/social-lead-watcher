import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ActivityRecord, Tenant } from "./types";
import { isDemoMode } from "./store";

const PAT_KEY = "slw.github.pat";
const REPO_KEY = "slw.github.repo";

export async function getGithubPat(): Promise<string> {
  return (await AsyncStorage.getItem(PAT_KEY)) || "";
}
export async function setGithubPat(pat: string) {
  if (!pat) await AsyncStorage.removeItem(PAT_KEY);
  else await AsyncStorage.setItem(PAT_KEY, pat);
}
export async function getGithubRepo(): Promise<string> {
  return (await AsyncStorage.getItem(REPO_KEY)) || "sahakmbs/social-lead-watcher";
}
export async function setGithubRepo(repo: string) {
  await AsyncStorage.setItem(REPO_KEY, repo || "sahakmbs/social-lead-watcher");
}

export function slugify(name: string) {
  return (name || "tenant")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "tenant";
}

export function tenantToYaml(tenant: Tenant): string {
  const b = tenant.onboarding.business;
  const s = tenant.onboarding.scope;
  const platforms = tenant.onboarding.connections
    .filter((c) => c.connected)
    .map((c) => {
      return `  - type: ${c.type}\n    identity_name: "${c.identityName}"\n    sources: []`;
    })
    .join("\n");

  const list = (arr: string[]) =>
    arr.length ? arr.map((x) => `  - "${x.replace(/"/g, '\\"')}"`).join("\n") : "  []";

  return `# Exported from Social Lead Watcher — do not commit PII to public repos
business_name: "${b.businessName.replace(/"/g, '\\"')}"
voice: "${(b.voice || "").replace(/"/g, '\\"')}"
website: "${b.website}"
phone: "${b.phone}"
email: "${b.email}"
license_note: "${(b.licenseNote || "").replace(/"/g, '\\"')}"

service_area:
${list(s.serviceArea)}

in_scope:
${list(s.inScope)}

out_of_scope:
${list(s.outOfScope)}

skip_patterns:
${list(s.skipPatterns)}

max_outreach_per_run: ${s.maxOutreach}
schedule_hint: "every 5 minutes"

platforms:
${platforms || "  []"}
`;
}

export function sanitizeActivity(activity: ActivityRecord[]) {
  return activity.map((a) => ({
    ts: a.ts,
    platform: a.platform,
    action: a.action,
    classification: a.classification,
    need: a.need,
    summary: a.detail?.startsWith("✓ ") ? a.detail.slice(2) : a.detail || a.action,
  }));
}

function downloadText(filename: string, content: string, mime = "text/plain") {
  if (typeof document === "undefined") {
    return { ok: false, message: "Download available on web / desktop." };
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true, message: `Downloaded ${filename}` };
}

export function exportLocalFiles(tenant: Tenant, activity: ActivityRecord[]) {
  const slug = slugify(tenant.onboarding.business.businessName || "demo");
  const yaml = tenantToYaml(tenant);
  const snap = JSON.stringify(
    { exportedAt: new Date().toISOString(), activity: sanitizeActivity(activity.slice(0, 100)) },
    null,
    2,
  );
  const r1 = downloadText(`business-${slug}.yaml`, yaml, "text/yaml");
  const r2 = downloadText(`activity-${slug}.json`, snap, "application/json");
  return { ok: r1.ok || r2.ok, message: [r1.message, r2.message].filter(Boolean).join(" · ") };
}

/** Commit business.yaml to tenants/<slug>/ via GitHub Contents API (user PAT only). */
export async function saveConfigToGithub(tenant: Tenant): Promise<{ ok: boolean; message: string }> {
  const slug = slugify(tenant.onboarding.business.businessName || "demo");
  if (slug === "demo" || isDemoMode()) {
    // Simulate success in demo — never push personal secrets from demo UI by accident
    await AsyncStorage.setItem(
      `slw.local.tenant.${slug}`,
      tenantToYaml(tenant),
    );
    return {
      ok: true,
      message: "Demo sync OK — config saved to local store (public repo keeps tenants/demo only).",
    };
  }

  const pat = await getGithubPat();
  if (!pat) {
    return { ok: false, message: "Add a GitHub PAT in Settings first." };
  }
  const repo = await getGithubRepo();
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return { ok: false, message: "Repo must look like owner/name" };
  }

  const path = `tenants/${slug}/business.yaml`;
  const content = tenantToYaml(tenant);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(content)))
      : Buffer.from(content, "utf8").toString("base64");

  // Get existing sha if any
  let sha: string | undefined;
  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
  });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const putRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore(tenant): update ${slug} business.yaml via app sync`,
      content: b64,
      sha,
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.text();
    return { ok: false, message: `GitHub error: ${putRes.status} ${err.slice(0, 180)}` };
  }
  return { ok: true, message: `Saved to ${repo}:${path}` };
}
