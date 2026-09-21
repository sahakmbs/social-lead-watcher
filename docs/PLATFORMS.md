# Platforms

## Facebook (primary)

**Workflow:** operate as the **business Page**, watch **Groups the Page has joined**, comment as the Page, try Messenger DM.

| Topic | Notes |
|---|---|
| Identity | `platforms[].identity_name` = Page name |
| Sources | Group name + URL |
| Fetch | Agent playbook by default; Playwright scaffold is a TODO gated by env |
| Comment | Public, as Page — never personal profile |
| DM | Messenger; privacy settings often block — log `dm_note` |
| Dedupe | `post_url` in `handled.jsonl` |

Setup: join target groups **as the Page**, confirm comment permissions, keep session in the operator's browser (not this repo).

## Nextdoor (roadmap)

- Watch neighborhood feeds for homeowner requests in `service_area`
- Heavy anti-bot posture → agent mode first
- Respect community guidelines; no blast outreach
- Stub: `lead_watcher.platforms.nextdoor.NextdoorAdapter`

## Craigslist (roadmap)

- Prefer **RSS / search URLs** for services-wanted style posts
- No public comments — outreach is reply-by-email / phone from the post
- Stub: `lead_watcher.platforms.craigslist.CraigslistAdapter`

## Reddit (roadmap)

- Official API (PRAW) or agent; respect subreddit rules and API terms
- Soft-sell comments; hard-sell gets removed
- Sources = subreddit new-sort URLs
- Stub: `lead_watcher.platforms.reddit.RedditAdapter`

## Adding a platform

See README “How to add a platform”. Register the type in `get_adapter()`.
