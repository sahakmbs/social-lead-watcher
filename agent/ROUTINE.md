# Routine: Facebook lead watch (unattended)

Unattended cycle for **{{business_name}}** as Page **{{identity_name}}**.

## Focus

- Newest posts first · only **new** URLs
- Cap: **{{max_outreach_per_run}}**
- Facebook groups from config only (other platforms: ignore for now)
- Craft unique copy every time:

```bash
python -m lead_watcher craft --config {{config_path}} --text "…" --group "…"
```

## Per post

1. Score/craft
2. skip → log `skipped` (reason) · continue
3. strong / clear maybe → `lead_found` → comment (`best_comment`) → DM attempt
4. Append handled.jsonl

## Report (structured)

Emit a JSON array of activity events (see OPERATOR.md). Then a one-line rollup:

```bash
python -c "from lead_watcher.summarize import daily_rollup; print(daily_rollup(events))"
```

## Quiet mode

No matches → `"No new leads"` (or silence). Never invent activity.

## Schedule

{{schedule_hint}} — one cycle, then stop.
