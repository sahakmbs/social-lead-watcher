"""Platform adapters for Social Lead Watcher."""

from __future__ import annotations

from typing import TYPE_CHECKING

from lead_watcher.platforms.base import (
    ManualBrowserRequired,
    PlatformAdapter,
    get_adapter,
)

if TYPE_CHECKING:
    from lead_watcher.models import BusinessConfig, PlatformConfig

__all__ = [
    "ManualBrowserRequired",
    "PlatformAdapter",
    "get_adapter",
    "load_adapters",
]


def load_adapters(
    config: "BusinessConfig",
) -> list[PlatformAdapter]:
    """Instantiate adapters for each platform entry in config."""
    adapters: list[PlatformAdapter] = []
    for pcfg in config.platforms:
        adapters.append(get_adapter(pcfg, config))
    return adapters
