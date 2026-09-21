"""
Reddit adapter stub.

Roadmap: watch configured subreddits via official API (PRAW) or agent mode.
Never scrape logged-out HTML at scale; respect Reddit API terms.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from lead_watcher.models import Post, SourceConfig
from lead_watcher.platforms.base import ManualBrowserRequired, PlatformAdapter


class RedditAdapter(PlatformAdapter):
    """Reddit — stub; API integration TBD."""

    platform_type = "reddit"

    def list_watched_sources(self) -> list[SourceConfig]:
        return list(self.platform_config.sources)

    def fetch_new_posts(self, since: Optional[datetime] = None) -> list[Post]:
        raise ManualBrowserRequired(
            "Reddit fetch not implemented; use agent mode or future PRAW adapter.",
            playbook=self.agent_playbook_scan(),
        )

    def post_comment(self, post: Post, text: str) -> bool:
        raise ManualBrowserRequired(
            "Reddit comment requires API credentials or agent.",
            playbook=self.agent_playbook_comment(post, text),
        )

    def send_dm(self, post: Post, text: str) -> tuple[bool, str]:
        raise ManualBrowserRequired(
            "Reddit DM (chat/message) requires API credentials or agent.",
            playbook=self.agent_playbook_dm(post, text),
        )

    def agent_playbook_scan(self) -> str:
        sources = "\n".join(
            f"  - {s.name}: {s.url}" for s in self.list_watched_sources()
        ) or "  (add subreddit URLs, e.g. https://reddit.com/r/Seattle)"
        return f"""# Reddit Lead Watch — {self.business_config.business_name}

## Sources
{sources}

## Steps
1. Sort by New; only posts since last run.
2. Score with matcher (homeowner requests in service_area).
3. Comment helpfully (Reddit culture: no hard sell); offer DM / website.
4. Follow subreddit rules; log to handled.jsonl.
"""
