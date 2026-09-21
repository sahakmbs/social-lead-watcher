"""Load and validate business YAML configuration."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from lead_watcher.models import BusinessConfig, PlatformConfig, SourceConfig


class ConfigError(ValueError):
    """Raised when config is missing, malformed, or incomplete."""


REQUIRED_FIELDS = ("business_name",)


def _require_str(data: dict[str, Any], key: str, path: str = "") -> str:
    loc = f"{path}.{key}" if path else key
    if key not in data or data[key] is None:
        raise ConfigError(f"Missing required field: {loc}")
    val = data[key]
    if not isinstance(val, str):
        raise ConfigError(f"Field {loc} must be a string, got {type(val).__name__}")
    return val


def _as_str_list(data: dict[str, Any], key: str, default: list[str] | None = None) -> list[str]:
    raw = data.get(key, default if default is not None else [])
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ConfigError(f"Field {key} must be a list of strings")
    out: list[str] = []
    for i, item in enumerate(raw):
        if not isinstance(item, str):
            raise ConfigError(f"Field {key}[{i}] must be a string")
        out.append(item)
    return out


def _parse_sources(raw: Any, platform_idx: int) -> list[SourceConfig]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ConfigError(f"platforms[{platform_idx}].sources must be a list")
    sources: list[SourceConfig] = []
    for j, s in enumerate(raw):
        if not isinstance(s, dict):
            raise ConfigError(f"platforms[{platform_idx}].sources[{j}] must be a mapping")
        name = s.get("name") or s.get("title") or f"source-{j}"
        url = s.get("url") or ""
        if not isinstance(name, str) or not isinstance(url, str):
            raise ConfigError(
                f"platforms[{platform_idx}].sources[{j}] name/url must be strings"
            )
        sources.append(SourceConfig(name=name, url=url))
    return sources


def _parse_platforms(raw: Any) -> list[PlatformConfig]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ConfigError("platforms must be a list")
    platforms: list[PlatformConfig] = []
    known = {"type", "identity_name", "sources"}
    for i, p in enumerate(raw):
        if not isinstance(p, dict):
            raise ConfigError(f"platforms[{i}] must be a mapping")
        ptype = p.get("type")
        if not ptype or not isinstance(ptype, str):
            raise ConfigError(f"platforms[{i}].type is required and must be a string")
        identity = p.get("identity_name") or ""
        if not isinstance(identity, str):
            raise ConfigError(f"platforms[{i}].identity_name must be a string")
        sources = _parse_sources(p.get("sources"), i)
        extra = {k: v for k, v in p.items() if k not in known}
        platforms.append(
            PlatformConfig(
                type=ptype.lower().strip(),
                identity_name=identity,
                sources=sources,
                extra=extra,
            )
        )
    return platforms


def parse_business_dict(data: dict[str, Any]) -> BusinessConfig:
    """Validate a dict and return BusinessConfig. Raises ConfigError."""
    if not isinstance(data, dict):
        raise ConfigError("Config root must be a mapping")

    for key in REQUIRED_FIELDS:
        _require_str(data, key)

    business_name = data["business_name"].strip()
    if not business_name:
        raise ConfigError("business_name must not be empty")

    max_outreach = data.get("max_outreach_per_run", 3)
    if not isinstance(max_outreach, int) or max_outreach < 0:
        raise ConfigError("max_outreach_per_run must be a non-negative integer")

    strong_min = data.get("strong_min_score", 4)
    maybe_min = data.get("maybe_min_score", 2)
    if not isinstance(strong_min, int) or not isinstance(maybe_min, int):
        raise ConfigError("strong_min_score and maybe_min_score must be integers")

    return BusinessConfig(
        business_name=business_name,
        voice=str(data.get("voice") or ""),
        website=str(data.get("website") or ""),
        phone=str(data.get("phone") or ""),
        email=str(data.get("email") or ""),
        license_note=str(data.get("license_note") or ""),
        service_area=_as_str_list(data, "service_area"),
        in_scope=_as_str_list(data, "in_scope"),
        out_of_scope=_as_str_list(data, "out_of_scope"),
        skip_patterns=_as_str_list(data, "skip_patterns"),
        comment_template=str(data.get("comment_template") or ""),
        dm_template=str(data.get("dm_template") or ""),
        max_outreach_per_run=max_outreach,
        schedule_hint=str(data.get("schedule_hint") or "every 5 minutes"),
        platforms=_parse_platforms(data.get("platforms")),
        strong_min_score=strong_min,
        maybe_min_score=maybe_min,
        raw=dict(data),
    )


def load_config(path: str | Path) -> BusinessConfig:
    """Load YAML from path and validate."""
    p = Path(path)
    if not p.exists():
        raise ConfigError(f"Config file not found: {p}")
    try:
        text = p.read_text(encoding="utf-8")
    except OSError as e:
        raise ConfigError(f"Cannot read config {p}: {e}") from e

    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as e:
        raise ConfigError(f"Invalid YAML in {p}: {e}") from e

    if data is None:
        raise ConfigError(f"Config file is empty: {p}")

    return parse_business_dict(data)


DEFAULT_COMMENT_TEMPLATE = (
    "Hi! We're {business_name} — happy to help with {need}. "
    "You can reach us at {phone} or {website}. {cta}"
)

DEFAULT_DM_TEMPLATE = (
    "Hi {author}, saw your post about {need}. "
    "{business_name} can help. Phone: {phone} | {website}. {cta}"
)


def example_config_dict() -> dict[str, Any]:
    """Return a starter config dict (placeholders only)."""
    return {
        "business_name": "Acme Home Services",
        "voice": "friendly, professional, concise",
        "website": "https://example.com",
        "phone": "(555) 000-0000",
        "email": "leads@example.com",
        "license_note": "Licensed & insured (replace with your license #)",
        "service_area": ["Seattle", "Bellevue", "Tacoma", "King County"],
        "in_scope": [
            "vinyl siding",
            "roofing",
            "remodel",
            "kitchen remodel",
            "bathroom remodel",
            "deck",
            "fence",
            "windows",
            "gutters",
        ],
        "out_of_scope": [
            "landscaping only",
            "cleaning",
            "moving",
            "appliance repair",
        ],
        "skip_patterns": [
            "looking for work",
            "hiring myself out",
            "I'm a contractor",
            "hourly",
            "$/hr",
            "per hour",
            "subcontract",
            "need crew",
        ],
        "comment_template": DEFAULT_COMMENT_TEMPLATE,
        "dm_template": DEFAULT_DM_TEMPLATE,
        "max_outreach_per_run": 3,
        "schedule_hint": "every 5 minutes",
        "strong_min_score": 4,
        "maybe_min_score": 2,
        "platforms": [
            {
                "type": "facebook",
                "identity_name": "Acme Home Services Page",
                "sources": [
                    {
                        "name": "Local Homeowners Group",
                        "url": "https://www.facebook.com/groups/example",
                    }
                ],
            }
        ],
    }


def write_example_config(out_path: str | Path) -> Path:
    """Write a starter business.yaml (does not overwrite without force)."""
    p = Path(out_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    body = yaml.safe_dump(
        example_config_dict(),
        default_flow_style=False,
        sort_keys=False,
        allow_unicode=True,
    )
    header = (
        "# Social Lead Watcher — business config\n"
        "# Replace placeholders before production use.\n"
        "# See config/business.example.yaml for full comments.\n\n"
    )
    p.write_text(header + body, encoding="utf-8")
    return p
