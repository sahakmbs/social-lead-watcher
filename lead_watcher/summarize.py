"""Dashboard activity one-liners and daily rollups (anonymized-friendly)."""

from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any, Mapping, Sequence


def activity_one_liner(event: Mapping[str, Any]) -> str:
    """
    Human one-liner for an activity event.

    Prefer structured fields; never require raw Messenger text.
    """
    action = str(event.get("action") or "")
    need = str(event.get("need") or "").strip()
    group = str(event.get("group") or event.get("source_name") or "").strip()
    platform = str(event.get("platform") or "").strip()
    detail = str(event.get("detail") or "").strip()
    classification = str(event.get("classification") or "").strip()

    where = f" in {group}" if group else (f" on {platform}" if platform and platform != "system" else "")
    what = need or "a lead"

    if action == "comment_posted":
        return f"Commented on a {what} lead{where}"
    if action == "dm_sent":
        return f"Sent a DM on a {what} lead{where}"
    if action == "lead_found":
        label = classification or "new"
        return f"Found a {label} {what} lead{where}"
    if action == "skipped":
        reason = detail.split(":")[-1].strip() if detail else "out of scope"
        return f"Skipped a post{where} ({reason})"
    if action == "platform_connected":
        return detail or f"Connected {platform}"
    if action == "watcher_paused":
        return "Watcher paused"
    if action == "watcher_resumed":
        return "Watcher resumed"
    if action == "plan_activated":
        return detail or "Plan activated"
    return detail or action.replace("_", " ").capitalize() or "Activity"


def daily_rollup(events: Sequence[Mapping[str, Any]], *, day: str | None = None) -> str:
    """
    Compact daily summary string for the dashboard hero/subtitle.

    Counts actions; does not include personal names or message bodies.
    """
    if day is None:
        day = datetime.now().strftime("%Y-%m-%d")

    def on_day(ev: Mapping[str, Any]) -> bool:
        ts = str(ev.get("ts") or "")
        return ts.startswith(day) if len(day) >= 10 else True

    today = [e for e in events if on_day(e)]
    if not today:
        return "No activity yet today."

    c = Counter(str(e.get("action") or "") for e in today)
    leads = c.get("lead_found", 0)
    comments = c.get("comment_posted", 0)
    dms = c.get("dm_sent", 0)
    skipped = c.get("skipped", 0)

    parts: list[str] = []
    if leads:
        parts.append(f"{leads} lead{'s' if leads != 1 else ''} found")
    if comments:
        parts.append(f"{comments} comment{'s' if comments != 1 else ''}")
    if dms:
        parts.append(f"{dms} DM{'s' if dms != 1 else ''}")
    if skipped:
        parts.append(f"{skipped} skipped")
    if not parts:
        return f"{len(today)} update{'s' if len(today) != 1 else ''} today."
    return "Today: " + ", ".join(parts) + "."


def sanitize_activity_for_export(events: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    """Strip PII-ish fields before writing public/shared snapshots."""
    out: list[dict[str, Any]] = []
    for e in events:
        out.append(
            {
                "ts": e.get("ts"),
                "platform": e.get("platform"),
                "action": e.get("action"),
                "classification": e.get("classification"),
                "need": e.get("need"),
                "group": e.get("group") or e.get("source_name"),
                "summary": activity_one_liner(e),
                # Intentionally omit author, dm bodies, raw snippets with names
            }
        )
    return out
