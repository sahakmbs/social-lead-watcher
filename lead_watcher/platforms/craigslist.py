"""
Craigslist adapter stub.

Roadmap: poll geo+category RSS / search URLs for "services wanted" style
posts. Prefer RSS over HTML scraping when available.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from lead_watcher.models import Post, SourceConfig
from lead_watcher.platforms.base import ManualBrowserRequired, PlatformAdapter


class CraigslistAdapter(PlatformAdapter):
    """Craigslist — stub with RSS-oriented playbook."""

    platform_type = "craigslist"

    def list_watched_sources(self) -> list[SourceConfig]:
        return list(self.platform_config.sources)

    def fetch_new_posts(self, since: Optional[datetime] = None) -> list[Post]:
        # Future: parse RSS from sources[].url
        raise ManualBrowserRequired(
            "Craigslist automation not implemented; use agent or RSS later.",
            playbook=self.agent_playbook_scan(),
        )

    def post_comment(self, post: Post, text: str) -> bool:
        # CL typically uses email reply, not public comments
        raise ManualBrowserRequired(
            "Craigslist has no public comments — reply by email/phone from the post.",
            playbook=(
                f"Open {post.url}; use the post's reply method with:\n{text}"
            ),
        )

    def send_dm(self, post: Post, text: str) -> tuple[bool, str]:
        raise ManualBrowserRequired(
            "Craigslist reply is email-based.",
            playbook=self.agent_playbook_dm(post, text),
        )

    def agent_playbook_scan(self) -> str:
        sources = "\n".join(
            f"  - {s.name}: {s.url}" for s in self.list_watched_sources()
        ) or "  (add city+category search or RSS URLs)"
        return f"""# Craigslist Lead Watch — {self.business_config.business_name}

## Sources
{sources}

## Steps
1. Prefer RSS/search URLs for services-wanted / gig-adjacent homeowner posts.
2. Score text with matcher; skip spam and contractor ads.
3. Reply via the post's contact method (email form); no fake public comment.
4. Log outreach to handled.jsonl with post_url.
"""
