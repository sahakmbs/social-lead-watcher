# Architecture

Social Lead Watcher splits **policy** (YAML), **scoring** (pure functions), **outreach text** (templates), **dedupe** (JSONL), and **I/O** (platform adapters / agents).

## Modes

### Agent mode (default)

Adapters raise `ManualBrowserRequired` with an `agent_playbook_*` string. An AI browser agent follows the playbook while using `matcher` + `templates` + `HandledStore` as the brain. This matches how operators already run Page+Groups workflows without committing session cookies.

### Automation mode (optional)

Set env flags such as `LEAD_WATCHER_FB_AUTOMATION=1` in a **private** runner if/when Playwright (or official APIs) are implemented. The open repo keeps those paths as stubs/TODOs. Never commit credentials.

## Matcher

`lead_watcher.matcher.score_post` is a pure function:

1. **skip_patterns** → `skip` immediately (self-ads, looking-for-work, hourly, crews).
2. **out_of_scope** without **in_scope** → `skip`.
3. Score += in_scope hits, request-language signals (`looking for`, `recommend`, `quote`…), service_area hits.
4. Thresholds: `strong_min_score` (default 4) and `maybe_min_score` (default 2).
5. Outreach if `strong`, or `maybe` **and** at least one in_scope match.

No network, no LLM required.

## Adapters

`PlatformAdapter` is the only I/O boundary:

| Method | Role |
|---|---|
| `list_watched_sources()` | Groups / subs / search URLs from YAML |
| `fetch_new_posts(since)` | New candidates, newest first |
| `post_comment(post, text)` | Public reply as identity |
| `send_dm(post, text)` | Private message; return `(ok, note)` |

Facebook is the reference implementation (playbooks + scoring helpers). Nextdoor, Craigslist, and Reddit ship as interface-compatible stubs.

## Runner

`python -m lead_watcher run` loads config → adapters → fetch → score → render → (dry-run or attempt) → optional JSONL append. Volume is capped by `max_outreach_per_run`. Already-handled URLs are skipped.

## Handled log

One JSON object per line:

```json
{
  "ts": "2026-09-21T12:00:00Z",
  "group": "Example Group",
  "post_url": "https://…",
  "author": "Name",
  "snippet": "…",
  "comment_posted": true,
  "comment_text": "…",
  "dm_sent": false,
  "dm_note": "messaging blocked",
  "classification": "strong",
  "reason": "in_scope: vinyl siding"
}
```

`reason` is optional. The store is append-only and keyed by `post_url`.
