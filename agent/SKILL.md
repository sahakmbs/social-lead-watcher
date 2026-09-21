# Skill: Universal Social Lead Watcher

Parameterized by `config/business.yaml` (or the path your operator provides).
Replace `{{placeholders}}` with values from that config when instantiating.

## When to use

Use this skill when the operator asks you to:
- Watch social groups/feeds for **new homeowner / job-request posts** for **{{business_name}}**
- Score posts (strong / maybe / skip) and outreach on strong + clear maybe
- Run a scheduled lead scan (hint: {{schedule_hint}})
- Report outreach with real post links (never invent feed content)

## Scope (from config)

- **In scope:** {{in_scope}}
- **Out of scope:** {{out_of_scope}}
- **Skip patterns:** {{skip_patterns}} (contractor self-ads, looking-for-work, hourly, etc.)
- **Service area:** {{service_area}}
- **Identity:** comment/DM as **{{identity_name}}** on each platform (Page, not personal)
- **Cap:** at most {{max_outreach_per_run}} outreach actions per run

## Steps (one cycle)

1. **Load config** — `config/business.yaml` (business, templates, platforms, sources).
2. **Load dedupe** — `data/handled.jsonl`. Never re-comment a `post_url` already present.
3. **For each platform source** (Facebook groups first):
   - Switch to the business identity / Page.
   - Open the source URL; sort **newest first**.
   - Collect only **NEW** posts (not in handled log; newer than last successful scan if known).
4. **Score** each post with `lead_watcher.matcher.score_post` (or equivalent rules):
   - **skip** — skip_patterns, pure out_of_scope, unrelated
   - **strong** — clear homeowner request + in_scope (+ geo preferred)
   - **maybe** — in_scope but weaker signals; outreach only if **clear** (in_scope present)
5. **Act** on strong + clear maybe (until cap):
   - Render comment via `comment_template` (`{business_name}`, `{need}`, `{website}`, `{phone}`, `{cta}`, …).
   - Post **public comment** as the Page/identity.
   - Try **DM** via `dm_template`; if blocked, set `dm_sent=false` and a short `dm_note`.
6. **Append** a handled JSONL line:
   `{"ts","group","post_url","author","snippet","comment_posted","comment_text","dm_sent","dm_note","classification","reason?"}`
7. **Report** to the operator: links to posts you touched, classification, whether comment/DM succeeded.
8. **Quiet** if nothing matched — do not invent activity.

## Never

- Invent feed posts or fake outreach history
- Use personal profile when a Page identity is configured
- Commit or paste session cookies / passwords
- Exceed {{max_outreach_per_run}}
- Copy another business's phone/email/license into templates

## CLI helpers

```bash
python -m lead_watcher score --config config/business.yaml --text "..."
python -m lead_watcher render-comment --config config/business.yaml --need "vinyl siding"
python -m lead_watcher playbook --config config/business.yaml
```

## Platform notes

See `docs/PLATFORMS.md`. Facebook is primary; Nextdoor / Craigslist / Reddit may be agent-playbook-only until adapters are implemented.
