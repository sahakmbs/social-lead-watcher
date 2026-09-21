"""Keyword / geo / scope scoring — pure functions, no I/O."""

from __future__ import annotations

import re
from typing import Iterable

from lead_watcher.models import BusinessConfig, Classification, MatchResult, Post


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _find_matches(haystack: str, needles: Iterable[str]) -> list[str]:
    """Return needles that appear as substrings (case-insensitive)."""
    h = _normalize(haystack)
    found: list[str] = []
    for n in needles:
        n_norm = _normalize(n)
        if not n_norm:
            continue
        if n_norm in h:
            found.append(n)
    return found


def _request_signals(text: str) -> int:
    """Boost score when post looks like a homeowner request."""
    t = _normalize(text)
    signals = [
        r"\blooking for\b",
        r"\bneed(s|ed)?\b",
        r"\brecommend(ation|ations|ing)?\b",
        r"\banyone (know|have|use[sd]?)\b",
        r"\bhire\b",
        r"\bquote(s)?\b",
        r"\bestimate\b",
        r"\bcontractor\b",
        r"\bhelp (with|me|us)\b",
        r"\bwho (can|does|is)\b",
    ]
    score = 0
    for pat in signals:
        if re.search(pat, t):
            score += 1
    return min(score, 3)


def _extract_need(text: str, matched_in_scope: list[str]) -> str:
    if matched_in_scope:
        # Prefer longer / more specific match
        return sorted(matched_in_scope, key=len, reverse=True)[0]
    t = _normalize(text)
    m = re.search(
        r"(?:looking for|need(?:s|ed)?|help with)\s+(.{3,60}?)(?:\.|,|!|\?|$)",
        t,
    )
    if m:
        return m.group(1).strip()[:60]
    return "your project"


def score_post(post: Post | str, config: BusinessConfig) -> MatchResult:
    """
    Score a post against business scope.

    Rules (mirrors MasterFix intent):
    - skip_patterns → SKIP (contractor self-ads, looking-for-work, hourly, etc.)
    - out_of_scope hits without in_scope → SKIP
    - in_scope + request signals + optional geo → STRONG / MAYBE
    - never invent content; score only what's in the text
    """
    if isinstance(post, str):
        text = post
        post_obj = Post(url="", text=post)
    else:
        text = post.text or ""
        post_obj = post

    blob = f"{text} {post_obj.group or ''}"

    matched_skip = _find_matches(blob, config.skip_patterns)
    if matched_skip:
        return MatchResult(
            classification=Classification.SKIP,
            score=0,
            reason=f"skip_patterns: {', '.join(matched_skip)}",
            matched_skip=matched_skip,
        )

    matched_in = _find_matches(blob, config.in_scope)
    matched_out = _find_matches(blob, config.out_of_scope)
    matched_geo = _find_matches(blob, config.service_area)

    # Out of scope only (no in-scope trade) → skip
    if matched_out and not matched_in:
        return MatchResult(
            classification=Classification.SKIP,
            score=0,
            reason=f"out_of_scope: {', '.join(matched_out)}",
            matched_out_of_scope=matched_out,
        )

    score = 0
    reasons: list[str] = []

    if matched_in:
        # More specific matches weigh more
        score += 2 + min(len(matched_in), 2)
        reasons.append(f"in_scope: {', '.join(matched_in)}")

    req = _request_signals(text)
    if req:
        score += req
        reasons.append(f"request_signals={req}")

    if matched_geo:
        score += 1
        reasons.append(f"service_area: {', '.join(matched_geo)}")
    elif config.service_area and matched_in:
        # In scope but no geo mentioned — still maybe, slight penalty note
        reasons.append("no_geo_match")

    # Hard skip: clearly wrong trade language already handled; if nothing
    # in scope and weak request, skip
    if not matched_in and score < config.maybe_min_score:
        return MatchResult(
            classification=Classification.SKIP,
            score=score,
            reason="no in_scope trade and weak request signals",
            matched_out_of_scope=matched_out,
            matched_geo=matched_geo,
        )

    need = _extract_need(text, matched_in)

    if score >= config.strong_min_score and matched_in:
        cls = Classification.STRONG
    elif score >= config.maybe_min_score and (matched_in or req >= 2):
        cls = Classification.MAYBE
    else:
        cls = Classification.SKIP

    return MatchResult(
        classification=cls,
        score=score,
        reason="; ".join(reasons) if reasons else "below threshold",
        need=need if cls != Classification.SKIP else "",
        matched_in_scope=matched_in,
        matched_out_of_scope=matched_out,
        matched_geo=matched_geo,
    )


def should_outreach(match: MatchResult) -> bool:
    """Strong always; clear maybe (in_scope present) yes; skip no."""
    if match.classification == Classification.STRONG:
        return True
    if match.classification == Classification.MAYBE and match.matched_in_scope:
        return True
    return False
