# Social Lead Watcher

Config-driven **Facebook** lead brain (Python) + calm **Expo** app (iOS / Android / Web).

Find homeowner job requests → score them → craft unique comments/DMs → summarize on a dashboard.

> **Open the web app:** [https://sahakmbs.github.io/social-lead-watcher/](https://sahakmbs.github.io/social-lead-watcher/)

### iPhone (works today)

1. Open the link above in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Launch from the icon (standalone PWA)

AltStore / IPA: see [`docs/ALTSTORE.md`](docs/ALTSTORE.md) (needs Apple signing via EAS — PWA is the zero-friction path).

---

Facebook is **connected Page identity + agent/browser worker playbook**. This is **not** marketed as an official Meta unpaid group auto-comment API.

## Quick demo (offline-first)

```bash
# 1) Python brain
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest

python -m lead_watcher craft \
  --config tenants/demo/business.yaml \
  --text "Looking for vinyl siding contractor in Seattle" \
  --group "Contractors of Seattle"

# 2) Expo app
cd apps/mobile
cp .env.example .env   # DEMO_MODE=1 by default
npm install
npx expo start --web
```

1. **Log in → Try demo** (`demo@leadwatcher.app` / `demo`)
2. Dashboard shows hero metric + calm activity list
3. Setup is **3 steps**: Business → Who you help → Facebook
4. Settings → Export / Sync for YAML download or optional GitHub save (your PAT)

## What Facebook autonomy does vs doesn’t

| Does | Doesn’t |
|------|---------|
| Score posts strong / maybe / skip | Steal passwords or cookies |
| Craft **unique** comment + DM variants | Claim Meta Graph unpaid group auto-comment SaaS |
| Agent playbook posts as the **Page** | Commit Messenger bodies / PII to this public repo |
| Dashboard one-liners + daily rollup | Smart Nextdoor / Craigslist / Reddit (listed, not smart yet) |

## Repo map

| Path | Role |
|------|------|
| `apps/mobile` | Expo Router UI — Linear-inspired dark calm |
| `apps/api` | Optional Express bridge |
| `lead_watcher/` | Matcher, `craft` / reply brain, summarizer |
| `tenants/demo/` | Public sample config only |
| `tenants/README.md` | Personal config policy |
| `agent/SKILL.md` | Facebook-pro worker skill |
| `docs/` | Architecture + **GitHub Pages** static web app |

## Python CLI

```bash
python -m lead_watcher craft --config tenants/demo/business.yaml --text "…"
python -m lead_watcher score --config tenants/demo/business.yaml --text "…"
python -m lead_watcher playbook --config tenants/demo/business.yaml
```

## Deploy web (GitHub Pages)

Static export lands in `docs/` (or via Actions on `main`):

```bash
cd apps/mobile && npx expo export --platform web --output-dir ../../docs
```

Pages URL: **https://sahakmbs.github.io/social-lead-watcher/**

## License

MIT — see `LICENSE`.
