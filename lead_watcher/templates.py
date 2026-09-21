"""Render comment and DM templates from business config."""

from __future__ import annotations

import re
from typing import Any, Mapping

from lead_watcher.models import BusinessConfig, Post


# Placeholders agents / templates may use
KNOWN_KEYS = (
    "business_name",
    "voice",
    "website",
    "phone",
    "email",
    "license_note",
    "need",
    "author",
    "cta",
    "group",
    "service_area",
)


def _default_cta(config: BusinessConfig) -> str:
    if config.phone and config.website:
        return "Happy to send a free estimate — text or call anytime."
    if config.phone:
        return "Happy to send a free estimate — give us a call."
    if config.website:
        return "Happy to send a free estimate — visit our site to reach out."
    return "Happy to help with a free estimate."


def build_context(
    config: BusinessConfig,
    *,
    need: str = "",
    author: str = "",
    group: str = "",
    cta: str | None = None,
    extra: Mapping[str, Any] | None = None,
) -> dict[str, str]:
    """Build string context for template formatting."""
    ctx: dict[str, str] = {
        "business_name": config.business_name or "",
        "voice": config.voice or "",
        "website": config.website or "",
        "phone": config.phone or "",
        "email": config.email or "",
        "license_note": config.license_note or "",
        "need": need or "your project",
        "author": author or "there",
        "group": group or "",
        "service_area": ", ".join(config.service_area) if config.service_area else "",
        "cta": cta if cta is not None else _default_cta(config),
    }
    if extra:
        for k, v in extra.items():
            ctx[str(k)] = "" if v is None else str(v)
    return ctx


_PLACEHOLDER_RE = re.compile(r"\{([a-zA-Z_][a-zA-Z0-9_]*)\}")


def safe_format(template: str, context: Mapping[str, str]) -> str:
    """
    Format with {placeholders}; unknown keys become empty string
    (never raise KeyError for missing optional fields).
    """
    if not template:
        return ""

    def repl(m: re.Match[str]) -> str:
        key = m.group(1)
        return context.get(key, "")

    return _PLACEHOLDER_RE.sub(repl, template).strip()


def render_comment(
    config: BusinessConfig,
    *,
    need: str = "",
    author: str = "",
    group: str = "",
    cta: str | None = None,
    extra: Mapping[str, Any] | None = None,
) -> str:
    tpl = config.comment_template or (
        "Hi! We're {business_name} — happy to help with {need}. "
        "Reach us at {phone} or {website}. {cta}"
    )
    return safe_format(
        tpl, build_context(config, need=need, author=author, group=group, cta=cta, extra=extra)
    )


def render_dm(
    config: BusinessConfig,
    *,
    need: str = "",
    author: str = "",
    group: str = "",
    cta: str | None = None,
    extra: Mapping[str, Any] | None = None,
) -> str:
    tpl = config.dm_template or (
        "Hi {author}, saw your post about {need}. "
        "{business_name} can help. {phone} | {website}. {cta}"
    )
    return safe_format(
        tpl, build_context(config, need=need, author=author, group=group, cta=cta, extra=extra)
    )


def render_for_post(
    config: BusinessConfig,
    post: Post,
    need: str,
) -> tuple[str, str]:
    """Return (comment_text, dm_text) for a matched post."""
    comment = render_comment(
        config, need=need, author=post.author, group=post.group
    )
    dm = render_dm(config, need=need, author=post.author, group=post.group)
    return comment, dm
