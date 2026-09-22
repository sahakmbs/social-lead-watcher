# Product — Social Lead Watcher (SaaS shell)

## What it is

A subscription product shell for local service businesses:

1. **Account** — email/password (stub auth; DEMO_MODE by default)
2. **Business info** — name, website, phone, email, voice, license note
3. **Lead scope** — service area, in-scope trades, out-of-scope, skip patterns, max outreach
4. **Platforms** — facebook, nextdoor, craigslist, reddit
5. **Connect** — DEMO mocks success; Facebook = Page identity + agent/browser worker playbook (not marketed as Meta Graph unpaid group auto-comment API)
6. **Watcher** — scores posts, comments, DMs, promotes the business
7. **Dashboard** — summarized status, today counters, activity feed, connected platforms

## Client

**Primary app:** Expo (React Native + Expo Router) in `apps/mobile`.

- One codebase → iOS, Android, Web
- Local demo: `npx expo start --web`
- Later store publish: EAS Build (`eas build` / `eas submit`)

## Engine

Python package `lead_watcher` scores posts and renders outreach from `business.yaml`.

Onboarding / go-live can export tenant YAML via `apps/api` → `tenants/<id>/business.yaml` for the engine and agent playbooks.

## DEMO_MODE

Default. No Stripe, Supabase, or OAuth keys required.

- Demo login: `demo@leadwatcher.app` / `demo`
- Or sign up → full onboarding funnel
- Subscribe on Billing marks plan active locally

## Autonomy model

1. Tenant config (from onboarding) defines scope + templates
2. Operator / agent worker follows platform playbooks (`agent/OPERATOR.md`)
3. Worker scores with `lead_watcher`, comments/DMs as the business identity
4. Activity records feed the mobile dashboard summary
