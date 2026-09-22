# Operator — autonomous worker playbook

How an agent or human operator runs Social Lead Watcher for a tenant and reports back to the dashboard.

## Inputs

- Tenant `business.yaml` (from onboarding export under `tenants/<tenant_id>/business.yaml`, or `config/business.yaml`)
- Platform connection status from the app:
  - **Facebook:** Page identity + browser/agent session (never commit cookies)
  - **Others:** OAuth stub / adapter hooks until live credentials exist

## Cycle

1. Load config: `python -m lead_watcher score --config tenants/<id>/business.yaml --text "..."` for spot checks
2. For each watched source (newest first):
   - Capture real post URL + text (do not invent feed content)
   - Score with `lead_watcher` matcher
   - **strong** or clear **maybe** with in-scope hit → outreach
   - skip patterns / out-of-scope → skip and log
3. Cap by `max_outreach_per_run`
4. Comment as the **business Page/identity**, then attempt DM
5. Append activity for the dashboard:
   - `lead_found`, `comment_posted`, `dm_sent`, `skipped`
   - Include post snippet, classification, need, detail

## Facebook posture

Operate as the connected **Page**. Use the agent/browser worker playbook.

Do **not** claim this is an official Meta unpaid group auto-comment SaaS API. Session cookies stay in the operator environment only.

## Reporting

Push summarized actions into the app activity feed (DEMO store or API). Dashboard shows:

- Watcher status: watching / needs_attention / paused
- Today: leads, comments, DMs, skipped
- Recent activity list
- Connected platforms

## Safety

- No secrets in git
- Respect platform ToS and community norms
- Prefer soft, helpful outreach; never spam
