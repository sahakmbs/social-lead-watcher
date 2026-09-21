"""Abstract platform adapter interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from lead_watcher.models import BusinessConfig, PlatformConfig, Post, SourceConfig


class ManualBrowserRequired(RuntimeError):
    """
    Raised when an action cannot be automated and needs an AI/browser agent.

    Carry `.playbook` with step-by-step instructions the agent can follow.
    """

    def __init__(self, message: str, playbook: str = ""):
        super().__init__(message)
        self.playbook = playbook


class PlatformAdapter(ABC):
    """Common interface for Facebook, Nextdoor, Craigslist, Reddit, etc."""

    platform_type: str = "base"

    def __init__(
        self,
        platform_config: "PlatformConfig",
        business_config: "BusinessConfig",
    ):
        self.platform_config = platform_config
        self.business_config = business_config

    @abstractmethod
    def list_watched_sources(self) -> list["SourceConfig"]:
        """Return configured sources (groups, subs, search URLs, ...)."""

    @abstractmethod
    def fetch_new_posts(
        self,
        since: Optional[datetime] = None,
    ) -> list["Post"]:
        """
        Fetch candidate posts newer than `since`.

        May raise NotImplementedError or ManualBrowserRequired when
        automation is unavailable (agent-driven mode).
        """

    @abstractmethod
    def post_comment(self, post: "Post", text: str) -> bool:
        """Post a public comment. Return True if successful."""

    @abstractmethod
    def send_dm(self, post: "Post", text: str) -> tuple[bool, str]:
        """
        Try to DM the author. Return (sent, note).
        note explains failure or partial success.
        """

    def agent_playbook_scan(self) -> str:
        """Human/AI-agent instructions for one scan cycle."""
        return (
            f"Scan {self.platform_type} sources for new homeowner posts, "
            "score with lead_watcher.matcher, outreach on strong/clear maybe."
        )

    def agent_playbook_comment(self, post: "Post", text: str) -> str:
        return f"On {self.platform_type}, open {post.url} and post comment:\n{text}"

    def agent_playbook_dm(self, post: "Post", text: str) -> str:
        return f"On {self.platform_type}, message author of {post.url}:\n{text}"


def get_adapter(
    platform_config: "PlatformConfig",
    business_config: "BusinessConfig",
) -> PlatformAdapter:
    """Factory: map platform type string → adapter class."""
    from lead_watcher.platforms.craigslist import CraigslistAdapter
    from lead_watcher.platforms.facebook import FacebookAdapter
    from lead_watcher.platforms.nextdoor import NextdoorAdapter
    from lead_watcher.platforms.reddit import RedditAdapter

    registry: dict[str, type[PlatformAdapter]] = {
        "facebook": FacebookAdapter,
        "fb": FacebookAdapter,
        "nextdoor": NextdoorAdapter,
        "craigslist": CraigslistAdapter,
        "cl": CraigslistAdapter,
        "reddit": RedditAdapter,
    }
    key = (platform_config.type or "").lower().strip()
    cls = registry.get(key)
    if cls is None:
        raise ValueError(
            f"Unknown platform type {platform_config.type!r}. "
            f"Known: {', '.join(sorted(set(registry)))}"
        )
    return cls(platform_config, business_config)
