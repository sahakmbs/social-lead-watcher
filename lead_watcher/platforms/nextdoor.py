"""
Nextdoor adapter stub.

Roadmap: watch neighborhood feeds / for-sale-and-free style requests for
home-service leads. Nextdoor heavily restricts scraping; prefer agent mode
with a logged-in business profile.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from lead_watcher.models import Post, SourceConfig
from lead_watcher.platforms.base import ManualBrowserRequired, PlatformAdapter


class NextdoorAdapter(PlatformAdapter):
    """Nextdoor — agent-driven stub."""

    platform_type = "nextdoor"

    def list_watched_sources(self) -> list[SourceConfig]:
        return list(self.platform_config.sources)

    def fetch_new_posts(self, since: Optional[datetime] = None) -> list[Post]:
        raise ManualBrowserRequired(
            "Nextdoor fetch is agent-driven (no public API for lead scanning).",
            playbook=self.agent_playbook_scan(),
        )

    def post_comment(self, post: Post, text: str) -> bool:
        raise ManualBrowserRequired(
            "Nextdoor comment requires browser/agent.",
            playbook=self.agent_playbook_comment(post, text),
        )

    def send_dm(self, post: Post, text: str) -> tuple[bool, str]:
        raise ManualBrowserRequired(
            "Nextdoor DM requires browser/agent.",
            playbook=self.agent_playbook_dm(post, text),
        )

    def agent_playbook_scan(self) -> str:
        sources = "\n".join(
            f"  - {s.name}: {s.url}" for s in self.list_watched_sources()
        ) or "  (configure neighborhood / search URLs in business.yaml)"
        return f"""# Nextdoor Lead Watch — {self.business_config.business_name}

## Setup
- Use a business/neighborhood account allowed to post in target areas.
- Respect Nextdoor community guidelines; no spam.

## Sources
{sources}

## Steps
1. Open feeds / searches newest first.
2. Collect homeowner job requests in service_area + in_scope.
3. Skip ads, looking-for-work, out_of_scope.
4. Comment + message within platform norms; log to handled.jsonl.
"""
