"""Core data models for Social Lead Watcher."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class Classification(str, Enum):
    STRONG = "strong"
    MAYBE = "maybe"
    SKIP = "skip"


@dataclass
class SourceConfig:
    """A watched feed/group/subreddit/etc."""

    name: str
    url: str


@dataclass
class PlatformConfig:
    """One social platform the business watches."""

    type: str  # facebook | nextdoor | craigslist | reddit | ...
    identity_name: str = ""
    sources: list[SourceConfig] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class BusinessConfig:
    """Validated business + outreach configuration."""

    business_name: str
    voice: str = ""
    website: str = ""
    phone: str = ""
    email: str = ""
    license_note: str = ""
    service_area: list[str] = field(default_factory=list)
    in_scope: list[str] = field(default_factory=list)
    out_of_scope: list[str] = field(default_factory=list)
    skip_patterns: list[str] = field(default_factory=list)
    comment_template: str = ""
    dm_template: str = ""
    max_outreach_per_run: int = 3
    schedule_hint: str = "every 5 minutes"
    platforms: list[PlatformConfig] = field(default_factory=list)
    # Optional scoring weights / thresholds
    strong_min_score: int = 4
    maybe_min_score: int = 2
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


@dataclass
class Post:
    """A social post candidate for scoring/outreach."""

    url: str
    text: str
    author: str = ""
    group: str = ""
    platform: str = ""
    created_at: Optional[str] = None
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class MatchResult:
    """Scoring outcome for a post."""

    classification: Classification
    score: int
    reason: str
    need: str = ""  # short phrase describing the homeowner need
    matched_in_scope: list[str] = field(default_factory=list)
    matched_skip: list[str] = field(default_factory=list)
    matched_out_of_scope: list[str] = field(default_factory=list)
    matched_geo: list[str] = field(default_factory=list)


@dataclass
class OutreachAction:
    """Planned or executed outreach for a matched post."""

    post: Post
    match: MatchResult
    comment_text: str = ""
    dm_text: str = ""
    comment_posted: bool = False
    dm_sent: bool = False
    dm_note: str = ""
    dry_run: bool = False


@dataclass
class HandledRecord:
    """One line in handled.jsonl — mirrors MasterFix shape."""

    ts: str
    group: str
    post_url: str
    author: str
    snippet: str
    comment_posted: bool
    comment_text: str
    dm_sent: bool
    dm_note: str
    classification: str
    reason: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "ts": self.ts,
            "group": self.group,
            "post_url": self.post_url,
            "author": self.author,
            "snippet": self.snippet,
            "comment_posted": self.comment_posted,
            "comment_text": self.comment_text,
            "dm_sent": self.dm_sent,
            "dm_note": self.dm_note,
            "classification": self.classification,
        }
        if self.reason is not None:
            d["reason"] = self.reason
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> HandledRecord:
        return cls(
            ts=str(data.get("ts", "")),
            group=str(data.get("group", "")),
            post_url=str(data.get("post_url", "")),
            author=str(data.get("author", "")),
            snippet=str(data.get("snippet", "")),
            comment_posted=bool(data.get("comment_posted", False)),
            comment_text=str(data.get("comment_text", "")),
            dm_sent=bool(data.get("dm_sent", False)),
            dm_note=str(data.get("dm_note", "")),
            classification=str(data.get("classification", "")),
            reason=data.get("reason"),
        )
