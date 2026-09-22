"""Generate unique comment + DM variants — never identical spam."""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Literal

from lead_watcher.models import BusinessConfig, Classification, MatchResult, Post
from lead_watcher.templates import _default_cta, build_context, render_comment, render_dm, safe_format

Strategy = Literal["helpful_expert", "short_cta", "question_led", "social_proof"]

STRATEGIES: tuple[Strategy, ...] = (
    "helpful_expert",
    "short_cta",
    "question_led",
    "social_proof",
)


@dataclass
class CraftedReply:
    strategy: Strategy
    comment: str
    reason: str


@dataclass
class CraftResult:
    classification: Classification
    score: int
    need: str
    reason: str
    tone: str
    comments: list[CraftedReply]
    dm: str
    should_outreach: bool


def detect_tone(text: str) -> str:
    """Heuristic post tone for strategy selection."""
    t = (text or "").lower()
    if re.search(r"\burgent\b|\basap\b|\btoday\b|\bemergency\b|\bleaking\b", t):
        return "urgent"
    if re.search(r"\brecommend|\banyone know|\bwho (do|should)|referral", t):
        return "asking_recs"
    if re.search(r"\bquote|\bestimate|\bbudget|\bcost|\bprice", t):
        return "shopping"
    if re.search(r"\bhelp\b|\bneed\b|\blooking for\b", t):
        return "help_request"
    return "neutral"


def _pick_strategies(tone: str, n: int = 3) -> list[Strategy]:
    """Order strategies by post tone; return up to n unique ones."""
    preferred: dict[str, list[Strategy]] = {
        "urgent": ["short_cta", "helpful_expert", "question_led"],
        "asking_recs": ["social_proof", "helpful_expert", "question_led"],
        "shopping": ["helpful_expert", "short_cta", "social_proof"],
        "help_request": ["question_led", "helpful_expert", "short_cta"],
        "neutral": ["helpful_expert", "question_led", "short_cta"],
    }
    order = preferred.get(tone, preferred["neutral"])
    # Rotate slightly by tone hash so same tone still varies across posts
    return list(order[:n])


def _variant_seed(text: str, strategy: str) -> int:
    h = hashlib.sha256(f"{text}|{strategy}".encode()).hexdigest()
    return int(h[:8], 16)


def _area_phrase(config: BusinessConfig) -> str:
    if not config.service_area:
        return "the area"
    if len(config.service_area) == 1:
        return config.service_area[0]
    return f"{config.service_area[0]} / {config.service_area[1]}"


def _license_bit(config: BusinessConfig) -> str:
    if config.license_note:
        return f" ({config.license_note})"
    return ""


def _contact_bit(config: BusinessConfig) -> str:
    parts = [p for p in (config.phone, config.website) if p]
    if len(parts) == 2:
        return f"{parts[0]} or {parts[1]}"
    if parts:
        return parts[0]
    return "a message here"


COMMENT_BANK: dict[Strategy, list[str]] = {
    "helpful_expert": [
        "Hey — we do {need} for homeowners around {_area}. Happy to walk through options and what a solid scope looks like. {_contact}{_license}.",
        "We've handled plenty of {need} jobs nearby. If useful, we can share what typically drives cost/timeline — {_contact}.",
        "{business_name} here — local crew for {need}. Glad to give a straight read on scope before you decide. {_contact}.",
    ],
    "short_cta": [
        "Local {need} help available — free estimate: {_contact}.",
        "We can help with {need}. {_contact} for a quick quote.",
        "{business_name} — {need}, {_area}. {_cta}",
    ],
    "question_led": [
        "What size/scope are you thinking for the {need}? We work {_area} and can usually suggest next steps if you share a couple details.",
        "Is this a repair or full replace on the {need}? Happy to advise either way — {_contact}.",
        "Timing-wise, when do you want the {need} done? We can check availability and send a free estimate: {_contact}.",
    ],
    "social_proof": [
        "Neighbors around {_area} bring us {need} projects pretty often — happy to help if you want a second opinion. {_contact}{_license}.",
        "We're {business_name}{_license}. Homeowners message us for {need} all the time — glad to take a look. {_contact}.",
        "Local licensed crew ({business_name}) — {need} is in our wheelhouse. {_cta}",
    ],
}

DM_BANK = [
    "Hi {author} — saw your post about {need}. {business_name} can help in {_area}. {_contact}. {_cta}",
    "Hey {author}, re: {need}. We're a local crew ({business_name}){_license}. Free estimate: {_contact}.",
    "Hi {author}, happy to help with {need}. Quickest path is {_contact} — {business_name}.",
]


def _fill(template: str, config: BusinessConfig, *, need: str, author: str) -> str:
    ctx = build_context(config, need=need, author=author)
    ctx["_area"] = _area_phrase(config)
    ctx["_license"] = _license_bit(config)
    ctx["_contact"] = _contact_bit(config)
    ctx["_cta"] = _default_cta(config)
    # Also allow bare keys used in bank
    return safe_format(template, ctx).strip()


def craft_comments(
    config: BusinessConfig,
    *,
    text: str,
    need: str,
    author: str = "",
    n: int = 3,
) -> list[CraftedReply]:
    """Return n unique comment variants (different strategies / phrasings)."""
    tone = detect_tone(text)
    strategies = _pick_strategies(tone, n=n)
    out: list[CraftedReply] = []
    seen: set[str] = set()

    for strategy in strategies:
        bank = COMMENT_BANK[strategy]
        idx = _variant_seed(text, strategy) % len(bank)
        # Try a few rotations to avoid duplicates
        comment = ""
        for offset in range(len(bank)):
            candidate = _fill(bank[(idx + offset) % len(bank)], config, need=need, author=author)
            key = re.sub(r"\s+", " ", candidate.lower())
            if key not in seen and len(candidate) > 20:
                comment = candidate
                seen.add(key)
                break
        if not comment:
            # Fallback to config template once
            comment = render_comment(config, need=need, author=author)
            key = re.sub(r"\s+", " ", comment.lower())
            if key in seen:
                comment = f"{comment} Happy to answer questions."
            seen.add(re.sub(r"\s+", " ", comment.lower()))
        out.append(
            CraftedReply(
                strategy=strategy,
                comment=comment,
                reason=f"tone={tone}; strategy={strategy}",
            )
        )
    return out


def craft_dm(
    config: BusinessConfig,
    *,
    text: str,
    need: str,
    author: str = "",
) -> str:
    bank = DM_BANK
    idx = _variant_seed(text, "dm") % len(bank)
    return _fill(bank[idx], config, need=need or "your project", author=author or "there")


def craft_replies(
    config: BusinessConfig,
    post: Post | str,
    match: MatchResult | None = None,
    *,
    n_comments: int = 3,
) -> CraftResult:
    """Full craft: classification context + comment options + one DM."""
    from lead_watcher.matcher import score_post, should_outreach

    if isinstance(post, str):
        post_obj = Post(url="", text=post)
        text = post
    else:
        post_obj = post
        text = post.text or ""

    if match is None:
        match = score_post(post_obj, config)

    need = match.need or "your project"
    tone = detect_tone(text)
    comments: list[CraftedReply] = []
    dm = ""

    if match.classification != Classification.SKIP and should_outreach(match):
        comments = craft_comments(
            config,
            text=text,
            need=need,
            author=post_obj.author,
            n=n_comments,
        )
        dm = craft_dm(config, text=text, need=need, author=post_obj.author)
    elif match.classification != Classification.SKIP:
        # Maybe without clear outreach — still offer drafts for human review
        comments = craft_comments(
            config,
            text=text,
            need=need,
            author=post_obj.author,
            n=min(2, n_comments),
        )
        dm = craft_dm(config, text=text, need=need, author=post_obj.author)

    return CraftResult(
        classification=match.classification,
        score=match.score,
        need=need if match.classification != Classification.SKIP else "",
        reason=match.reason,
        tone=tone,
        comments=comments,
        dm=dm,
        should_outreach=should_outreach(match),
    )


def pick_best_comment(crafted: CraftResult) -> str:
    """First comment is already tone-ordered best."""
    if crafted.comments:
        return crafted.comments[0].comment
    return ""
