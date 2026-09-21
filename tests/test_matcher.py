"""Matcher strong / maybe / skip fixtures."""

from __future__ import annotations

from lead_watcher.matcher import score_post, should_outreach
from lead_watcher.models import Classification, Post


def test_strong_vinyl_siding_seattle(home_services_config):
    text = (
        "Looking for a vinyl siding contractor in Seattle — "
        "need recommendations for a full re-side, preferably licensed."
    )
    result = score_post(text, home_services_config)
    assert result.classification == Classification.STRONG
    assert "vinyl siding" in [m.lower() for m in result.matched_in_scope] or any(
        "siding" in m.lower() for m in result.matched_in_scope
    )
    assert should_outreach(result) is True
    assert result.need


def test_maybe_remodel_no_geo(home_services_config):
    text = "Anyone have a recommendation for a kitchen remodel?"
    result = score_post(text, home_services_config)
    assert result.classification in (Classification.STRONG, Classification.MAYBE)
    assert result.matched_in_scope
    assert should_outreach(result) is True


def test_skip_looking_for_work(home_services_config):
    text = (
        "Experienced roofer looking for work in Seattle — "
        "available hourly or by the job."
    )
    result = score_post(text, home_services_config)
    assert result.classification == Classification.SKIP
    assert result.matched_skip
    assert should_outreach(result) is False


def test_skip_hourly_self_ad(home_services_config):
    text = "I'm a contractor looking for siding jobs, $45/hr, need crew too"
    # "looking for work" style + hourly + need crew
    result = score_post(text, home_services_config)
    assert result.classification == Classification.SKIP
    assert should_outreach(result) is False


def test_skip_out_of_scope_lawn(home_services_config):
    text = "Looking for lawn care recommendations in Bellevue this week"
    result = score_post(text, home_services_config)
    assert result.classification == Classification.SKIP
    assert result.matched_out_of_scope


def test_skip_unrelated(home_services_config):
    text = "Does anyone know a good pizza place open late?"
    result = score_post(text, home_services_config)
    assert result.classification == Classification.SKIP
    assert should_outreach(result) is False


def test_score_post_object(home_services_config):
    post = Post(
        url="https://facebook.com/groups/x/posts/1",
        text="Need a deck builder in King County — please recommend a contractor",
        author="Jane",
        group="Homeowners",
    )
    result = score_post(post, home_services_config)
    assert result.classification in (Classification.STRONG, Classification.MAYBE)
    assert "deck" in result.need.lower() or result.matched_in_scope
