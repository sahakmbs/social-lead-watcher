# Social Lead Watcher

Config-driven social lead engine (**Python**) + **Expo** subscription SaaS shell (iOS / Android / Web).

Find homeowner job requests → score them → comment/DM as the business → summarize on a dashboard.

> Facebook is modeled as **connected Page identity + agent/browser worker playbook**. This is **not** marketed as an official Meta unpaid group auto-comment API.

## Quick demo (offline-first)

```bash
# 1) Python engine (optional for scoring CLI / tests)
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest

# 2) Expo app (primary product UI)
cd apps/mobile
cp .env.example .env   # DEMO_MODE=1 by default
npm install
npx expo start --web   # or: npm run web
```

### Click-through test (no cloud keys)

1. Open the web app from Expo.
2. **Sign up** with any email/password **or** **Log in → One-click demo**  
   (`demo@leadwatcher.app` / `demo`).
3. Complete **Setup**: Business → Lead scope → Platforms → Connect (mock) → Review → **Go live**.
4. Land on **Dashboard** with status, today counters, connected platforms, activity feed.
5. Open **Billing** → Subscribe (DEMO marks plan active locally).
6. **Settings** → edit scope, reconnect, pause/resume, reset demo store.

### Optional API (YAML export + Python score bridge)

```bash
cd apps/api && npm install && DEMO_MODE=1 npm run start
# http://localhost:8787/health
```

Point the app at it with `EXPO_PUBLIC_API_URL=http://localhost:8787` in `apps/mobile/.env`.

## Repo map

| Path | Role |
|------|------|
| `apps/mobile` | **Expo Router** app — landing, auth, onboarding, dashboard, settings, billing |
| `apps/api` | Thin Express API — tenant YAML export, billing stub, score/comment preview |
| `apps/web` | Legacy Next.js scaffold (unused; Expo is primary) |
| `lead_watcher/` | Python scoring + templates + platform adapters |
| `config/` | Example / template `business.yaml` |
| `tenants/` | Per-tenant YAML exports from onboarding |
| `docs/PRODUCT.md` | SaaS flow + autonomy model |
| `agent/OPERATOR.md` | How the worker uses config and reports activity |
| `docs/ARCHITECTURE.md` | Engine architecture |

## Expo routes

| Route | Screen |
|-------|--------|
| `/` | Landing + pricing tease |
| `/signup`, `/login` | Stub auth (DEMO_MODE) |
| `/onboarding` | 5-step wizard (persists draft) |
| `/dashboard` | Watcher status, today stats, activity, platforms |
| `/settings` | Edit business/scope, reconnect, pause |
| `/billing` | Starter / Growth / Pro + DEMO subscribe |

## Python CLI

```bash
python -m lead_watcher score --config config/examples/home-services.yaml \
  --text "Looking for vinyl siding contractor in Seattle"

python -m lead_watcher render-comment --config config/examples/home-services.yaml --need "vinyl siding"
python -m lead_watcher init-config --out config/business.yaml
python -m lead_watcher playbook --config config/examples/home-services.yaml
```

## Later: App Store / Play Store

```bash
cd apps/mobile
npx eas-cli login
npx eas build --platform all
npx eas submit --platform ios
npx eas submit --platform android
```

Configure `app.json` / EAS project when ready. DEMO_MODE keeps local testing free of store credentials.

## Env

**Expo (`apps/mobile/.env`)**

- `EXPO_PUBLIC_DEMO_MODE=1` (default)
- `EXPO_PUBLIC_API_URL=http://localhost:8787`
- `EXPO_PUBLIC_AUTH_PROVIDER=stub`

**API (`apps/api`)**

- `DEMO_MODE=1`
- `PORT=8787`
- `STRIPE_SECRET_KEY=` / `STRIPE_PRICE_*` placeholders (unused in demo)

## License

MIT — see `LICENSE`.
