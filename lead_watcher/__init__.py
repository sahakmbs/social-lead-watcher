"""Universal Social Lead Watcher — config-driven lead scoring and outreach."""

__version__ = "0.1.0"

from lead_watcher.models import (
    BusinessConfig,
    Classification,
    HandledRecord,
    MatchResult,
    OutreachAction,
    PlatformConfig,
    Post,
)

__all__ = [
    "BusinessConfig",
    "Classification",
    "HandledRecord",
    "MatchResult",
    "OutreachAction",
    "PlatformConfig",
    "Post",
    "__version__",
]
