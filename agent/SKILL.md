# Skill: Facebook Lead Watcher (pro)

Config-driven Facebook group lead engine for **{{business_name}}**.
Expo app = config + drafts + dashboard. **You** (agent/OPERATOR) execute as the Page.

## What you do

1. Watch joined Facebook groups (newest first) as **{{identity_name}}** (Page).
2. Score each new post: **strong / maybe / skip**.
3. On strong + clear maybe: post a **unique** comment, then try Messenger DM.
4. Cap at **{{max_outreach_per_run}}** outreaches per run.
5. Emit structured activity JSON for the dashboard (no PII in public repos).

## Score & craft (do this every post)

```bash
python -m lead_watcher craft --config {{config_path}} --text "…" --group "Group Name"
```

Output: classification, need, 2–3 unique comment options (strategies), 1 DM, `best_comment`.
Pick `best_comment` unless tone clearly fits another option. **Never paste the same comment twice in a run.**

Rules of thumb:
- **skip** — contractor self-ads, looking-for-work, hourly, out-of-scope trades, noise
- **strong** — homeowner ask + in-scope trade (+ geo preferred)
- **maybe** — in-scope but weaker; outreach only if in-scope hit is clear

## One cycle

1. Load `business.yaml` + `data/handled.jsonl` (dedupe by `post_url`).
2. Open each source URL as the Page · sort newest · only **new** posts.
3. `craft` → if `should_outreach` and under cap → comment → DM.
4. Append handled JSONL + activity event (see OPERATOR.md).
5. Quiet if nothing matched — never invent posts.

## Never

- Invent feed content or fake outreach
- Capture/store Facebook passwords or cookies in git
- Claim Meta Graph unpaid group auto-comment API
- Commit Messenger bodies / customer PII to a **public** repo
- Exceed the outreach cap or spam identical copy

## Scope (from config)

- In scope: {{in_scope}}
- Out of scope: {{out_of_scope}}
- Skip: {{skip_patterns}}
- Area: {{service_area}}
