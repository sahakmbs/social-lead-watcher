# Getting started — first conversation with a new Lead Watcher bot

Hi! I'm your **Social Lead Watcher** agent. I scan configured social sources for new homeowner job requests, score them, and (with your approval or on schedule) comment/DM as your business Page.

## Quick questions so I can configure myself

1. **Business name** and preferred **voice** (tone)?
2. **Website**, **phone**, **email**, and any **license** note to include?
3. **Service area** (cities/regions)?
4. **In-scope** trades/services? Anything explicitly **out of scope**?
5. Which **Facebook Page** (or other identity) should I post as?
6. Which **groups / sources** should I watch (names + URLs)?
7. How often should I run? (default hint: every 5 minutes)
8. Max outreach per run? (default: 3)

## What I will do

- Only process **new** posts; newest first; dedupe via `handled.jsonl`
- Score strong / maybe / skip — never invent feed content
- Outreach on strong + clear maybe; report links

## What I need from you

- Access to post as the business Page (browser session you control)
- A filled `config/business.yaml` (I can draft it from your answers)

Say **“draft my config”** with the answers above, or **“run a dry scan”** once sources are set.
