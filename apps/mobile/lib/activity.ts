import type { ActivityRecord } from "./types";

/** Human one-liner matching lead_watcher.summarize.activity_one_liner */
export function activityOneLiner(a: ActivityRecord): string {
  const need = (a.need || "").trim();
  const platform = a.platform === "system" ? "" : a.platform;
  const what = need || "a lead";

  const groupHint =
    a.detail && / in /.test(a.detail)
      ? a.detail.split(" in ").slice(-1)[0]
      : "";

  const where = groupHint
    ? ` in ${groupHint}`
    : platform
      ? ` on ${platform}`
      : "";

  switch (a.action) {
    case "comment_posted":
      return `Commented on a ${what} lead${where || (platform ? ` on ${platform}` : "")}`;
    case "dm_sent":
      return `Sent a DM on a ${what} lead${where || ""}`;
    case "lead_found":
      return `Found a ${a.classification || "new"} ${what} lead${where || ""}`;
    case "skipped":
      return `Skipped a post${platform ? ` on ${platform}` : ""}${a.detail ? ` (${shortReason(a.detail)})` : ""}`;
    case "platform_connected":
      return a.detail?.split("(")[0]?.trim() || `Connected ${platform}`;
    case "watcher_paused":
      return "Watcher paused";
    case "watcher_resumed":
      return "Watcher resumed";
    case "plan_activated":
      return a.detail || "Plan activated";
    default:
      return a.detail || a.action;
  }
}

function shortReason(detail: string) {
  const part = detail.includes(":") ? detail.split(":").slice(1).join(":").trim() : detail;
  return part.length > 40 ? part.slice(0, 37) + "…" : part;
}

export function dailyRollup(activity: ActivityRecord[]): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = activity.filter((a) => new Date(a.ts) >= start);
  if (!today.length) return "No activity yet today.";
  const leads = today.filter((a) => a.action === "lead_found").length;
  const comments = today.filter((a) => a.action === "comment_posted").length;
  const dms = today.filter((a) => a.action === "dm_sent").length;
  const skipped = today.filter((a) => a.action === "skipped").length;
  const parts: string[] = [];
  if (leads) parts.push(`${leads} lead${leads === 1 ? "" : "s"} found`);
  if (comments) parts.push(`${comments} comment${comments === 1 ? "" : "s"}`);
  if (dms) parts.push(`${dms} DM${dms === 1 ? "" : "s"}`);
  if (skipped) parts.push(`${skipped} skipped`);
  if (!parts.length) return `${today.length} update${today.length === 1 ? "" : "s"} today.`;
  return "Today: " + parts.join(", ") + ".";
}

export function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function displayLine(a: ActivityRecord): string {
  if (a.detail && a.detail.startsWith("✓ ")) return a.detail.slice(2);
  return activityOneLiner(a);
}
