"""Facebook craft / reply uniqueness tests."""

from __future__ import annotations

from lead_watcher.matcher import score_post, should_outreach
from lead_watcher.models import Classification
from lead_watcher.reply import craft_replies, detect_tone, pick_best_comment
from lead_watcher.summarize import activity_one_liner, daily_rollup, sanitize_activity_for_export


def test_craft_strong_lead_unique_comments(home_services_config):
    text = (
        "Looking for a vinyl siding contractor in Seattle — "
        "need recommendations for a full re-side."
    )
    crafted = craft_replies(home_services_config, text)
    assert crafted.classification == Classification.STRONG
    assert crafted.should_outreach is True
    assert crafted.need
    assert len(crafted.comments) >= 2
    bodies = [c.comment for c in crafted.comments]
    assert len(set(bodies)) == len(bodies), "comment variants must be unique"
    assert crafted.dm
    assert "Cascade" in crafted.dm or "555" in crafted.dm or "example.com" in crafted.dm
    best = pick_best_comment(crafted)
    assert best in bodies


def test_craft_skip_no_spam(home_services_config):
    text = "Experienced roofer looking for work, available hourly in Seattle"
    crafted = craft_replies(home_services_config, text)
    assert crafted.classification == Classification.SKIP
    assert crafted.should_outreach is False
    assert crafted.comments == []
    assert crafted.dm == ""


def test_craft_strategies_differ_by_tone(home_services_config):
    urgent = "URGENT — roof leaking ASAP need contractor in Bellevue today"
    recs = "Anyone know a good deck builder? Looking for recommendations near Kirkland"
    assert detect_tone(urgent) == "urgent"
    assert detect_tone(recs) == "asking_recs"
    c1 = craft_replies(home_services_config, urgent)
    c2 = craft_replies(home_services_config, recs)
    if c1.comments and c2.comments:
        assert c1.comments[0].strategy != c2.comments[0].strategy or c1.comments[0].comment != c2.comments[0].comment


def test_matcher_contractor_self_ad(home_services_config):
    text = "Available for siding jobs — taking new clients, DM for rates"
    result = score_post(text, home_services_config)
    assert result.classification == Classification.SKIP
    assert should_outreach(result) is False


def test_matcher_strong_with_referral_language(home_services_config):
    text = "Can anyone recommend a kitchen remodel contractor in King County? Inbox open."
    result = score_post(text, home_services_config)
    assert result.classification in (Classification.STRONG, Classification.MAYBE)
    assert result.matched_in_scope
    assert should_outreach(result) is True


def test_activity_one_liner():
    line = activity_one_liner(
        {
            "action": "comment_posted",
            "need": "vinyl siding",
            "group": "Contractors of Seattle",
            "platform": "facebook",
        }
    )
    assert "Commented" in line
    assert "vinyl siding" in line
    assert "Contractors of Seattle" in line


def test_daily_rollup_and_sanitize():
    events = [
        {
            "ts": "2099-01-01T10:00:00Z",
            "action": "lead_found",
            "need": "deck",
            "platform": "facebook",
            "author": "SECRET_NAME",
            "postSnippet": "private text",
        },
        {
            "ts": "2099-01-01T11:00:00Z",
            "action": "comment_posted",
            "need": "deck",
            "group": "Homeowners NW",
        },
        {"ts": "2099-01-01T12:00:00Z", "action": "dm_sent", "need": "deck"},
    ]
    roll = daily_rollup(events, day="2099-01-01")
    assert "1 lead" in roll
    assert "1 comment" in roll
    assert "1 DM" in roll
    clean = sanitize_activity_for_export(events)
    assert "author" not in clean[0]
    assert "postSnippet" not in clean[0]
    assert clean[0]["summary"]
