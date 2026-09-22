# Tenants

## Public repo policy

This **public** repository holds:

- Application + `lead_watcher` code
- **Demo tenant only:** `tenants/demo/` (sample business, no real customers)

Personal / production configs must **not** be committed here.

## Personal configs

Keep your real `business.yaml` in one of:

1. **Local only** — `config/business.yaml` (gitignored) or `tenants/<your-slug>/` on your machine
2. **Private path** — a private fork / private repo / private gist
3. **App Export / Sync** — download YAML + sanitized activity from the Expo app; optional “Save config to GitHub” uses **your** PAT (stored in AsyncStorage only, never committed) to write `tenants/<slug>/business.yaml`

## What is safe to commit

| Safe | Not safe |
|------|----------|
| `tenants/demo/business.yaml` | Real phone/email of customers |
| Anonymized activity summaries | Messenger / DM message bodies |
| Skip patterns, in-scope trades | Session cookies, passwords, PATs |

Activity snapshots for public sync must use `lead_watcher.summarize.sanitize_activity_for_export`.

## Demo

```bash
python -m lead_watcher craft \
  --config tenants/demo/business.yaml \
  --text "Looking for vinyl siding contractor in Seattle"
```
