"""
Facebook adapter — Page + Groups workflow (primary platform).

Production MasterFix-style flow:
1. Operate as the business Facebook Page (not personal profile).
2. Watch Groups the Page has joined.
3. Fetch NEW posts (newest first); score; outreach strong + clear maybe.
4. Public comment as Page + try Messenger DM.
5. Dedupe via handled.jsonl.

Browser automation is intentionally stubbed / optional. Prefer agent mode:
an AI browser agent follows `agent_playbook_*` strings. Optional Playwright
scaffold can be enabled later via env credentials — never commit cookies.
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from lead_watcher.models import BusinessConfig, PlatformConfig, Post, SourceConfig
from lead_watcher.platforms.base import ManualBrowserRequired, PlatformAdapter
from lead_watcher.templates import render_comment, render_dm


class FacebookAdapter(PlatformAdapter):
    """Facebook Groups lead watcher adapter."""

    platform_type = "facebook"

    def list_watched_sources(self) -> list[SourceConfig]:
        return list(self.platform_config.sources)

    def fetch_new_posts(
        self,
        since: Optional[datetime] = None,
    ) -> list[Post]:
        """
        Fetch new group posts.

        Without LIVE credentials this raises ManualBrowserRequired with a
        playbook an agent can follow. Set LEAD_WATCHER_FB_AUTOMATION=1 and
        provide session via env only in private deployments (never commit).
        """
        if os.environ.get("LEAD_WATCHER_FB_AUTOMATION") == "1":
            return self._playwright_fetch(since)

        since_note = since.isoformat() if since else "last run / handled log"
        sources = self.list_watched_sources()
        lines = [
            "# Facebook scan playbook",
            f"Identity: {self.platform_config.identity_name or 'Business Page'}",
            f"Only consider posts newer than: {since_note}",
            "Order: newest first. Cap by config max_outreach_per_run.",
            "Do NOT invent feed content. Skip already-handled URLs.",
            "",
            "Sources:",
        ]
        for s in sources:
            lines.append(f"- {s.name}: {s.url}")
        lines.extend(
            [
                "",
                "For each NEW post:",
                "1. Capture url, author, full text, group name.",
                "2. Score with lead_watcher.matcher.score_post.",
                "3. If strong or clear maybe → prepare comment + DM via templates.",
                "4. Comment as the Page; attempt Messenger; log to handled.jsonl.",
            ]
        )
        raise ManualBrowserRequired(
            "Facebook feed fetch requires browser/agent mode "
            "(set LEAD_WATCHER_FB_AUTOMATION=1 only with private credentials).",
            playbook="\n".join(lines),
        )

    def _playwright_fetch(self, since: Optional[datetime]) -> list[Post]:
        """
        Optional Playwright scaffold.

        TODO: implement authenticated group-feed scraping when credentials
        are supplied via environment in a secured runner. Stub returns [].
        """
        # Intentionally no real scraping here — keeps the open repo clean.
        _ = since
        # Placeholder for future:
        # from playwright.sync_api import sync_playwright
        # cookies = os.environ.get("FB_SESSION_COOKIES")  # never commit
        return []

    def post_comment(self, post: Post, text: str) -> bool:
        if os.environ.get("LEAD_WATCHER_FB_AUTOMATION") == "1":
            # TODO: Playwright comment-as-Page
            raise NotImplementedError(
                "Playwright comment posting not implemented; use agent playbook."
            )
        raise ManualBrowserRequired(
            "Facebook comment requires browser/agent mode.",
            playbook=self.agent_playbook_comment(post, text),
        )

    def send_dm(self, post: Post, text: str) -> tuple[bool, str]:
        if os.environ.get("LEAD_WATCHER_FB_AUTOMATION") == "1":
            raise NotImplementedError(
                "Playwright Messenger DM not implemented; use agent playbook."
            )
        raise ManualBrowserRequired(
            "Facebook Messenger DM requires browser/agent mode.",
            playbook=self.agent_playbook_dm(post, text),
        )

    def agent_playbook_scan(self) -> str:
        sources = "\n".join(
            f"  - {s.name}: {s.url}" for s in self.list_watched_sources()
        ) or "  (none configured)"
        biz = self.business_config.business_name
        return f"""# Facebook Lead Watch — {biz}

## Identity
Switch to Page: **{self.platform_config.identity_name or biz}**
(Do not comment as a personal profile.)

## Groups
{sources}

## Steps (unattended, newest first)
1. Open each group → filter/sort by Recent / New posts.
2. Collect only posts not in data/handled.jsonl.
3. Score each with matcher (strong / maybe / skip).
4. For strong + clear maybe (in-scope trade):
   - Post public comment as Page (use render_comment).
   - Try Messenger DM (use render_dm); note if message requests blocked.
5. Append HandledRecord to handled.jsonl.
6. Stop at max_outreach_per_run ({self.business_config.max_outreach_per_run}).
7. If no matches: stay quiet (no invented activity report).

## Never
- Invent feed posts
- Re-comment handled URLs
- Share credentials or cookies in chat logs
"""

    def agent_playbook_comment(self, post: Post, text: str) -> str:
        return f"""# Facebook comment as Page
1. Open {post.url}
2. Ensure identity is Page: {self.platform_config.identity_name or self.business_config.business_name}
3. Post this comment exactly (edit only for platform length limits):

{text}

4. Confirm comment visible; record success.
"""

    def agent_playbook_dm(self, post: Post, text: str) -> str:
        return f"""# Facebook Messenger DM
1. From post {post.url}, open author's profile / Message button.
2. If messaging is blocked (privacy / not friends), note and skip — do not spam.
3. Send:

{text}

4. Record dm_sent true/false and dm_note.
"""

    def prepare_outreach_texts(
        self, post: Post, need: str
    ) -> tuple[str, str]:
        """Helper: comment + DM text from business templates."""
        comment = render_comment(
            self.business_config,
            need=need,
            author=post.author,
            group=post.group,
        )
        dm = render_dm(
            self.business_config,
            need=need,
            author=post.author,
            group=post.group,
        )
        return comment, dm


# Re-export for typing convenience
__all__ = ["FacebookAdapter"]
