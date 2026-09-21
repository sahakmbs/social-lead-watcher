# Setup: Instantiate a Lead Watcher agent for a business

## 1. Clone / copy this repo

```bash
git clone https://github.com/sahakmbs/social-lead-watcher.git
cd social-lead-watcher
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Create business config

```bash
python -m lead_watcher init-config --out config/business.yaml
# or copy the commented template:
cp config/business.example.yaml config/business.yaml
```

Edit `config/business.yaml`:
- business_name, website, phone, email, license_note
- service_area, in_scope, out_of_scope, skip_patterns
- comment_template / dm_template
- platforms[].identity_name and sources[].url

`config/business.yaml` is gitignored — keep secrets and real group URLs local.

## 3. Smoke-test scoring

```bash
python -m lead_watcher score \
  --config config/business.yaml \
  --text "Looking for vinyl siding contractor in Seattle"
python -m lead_watcher render-comment --config config/business.yaml --need "vinyl siding"
```

## 4. Wire the agent

1. Import `agent/SKILL.md` into your agent skill system; substitute `{{placeholders}}` from the YAML (or point the agent at the YAML path).
2. Use `agent/ROUTINE.md` as the scheduled/cron prompt.
3. Point handled log at `data/handled.jsonl` (create via first append; `data/.gitkeep` keeps the folder).
4. Authenticate the **browser / Page** identity yourself — never store cookies in the repo.

## 5. First conversation

Follow `agent/getting-started.md` with the operator.

## 6. Optional automation

Set `LEAD_WATCHER_FB_AUTOMATION=1` only in a secured runner if/when Playwright paths are implemented. Default is **agent/browser mode** via playbooks (`python -m lead_watcher playbook --config ...`).
