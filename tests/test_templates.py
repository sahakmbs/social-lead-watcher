"""Template rendering tests."""

from __future__ import annotations

from lead_watcher.templates import render_comment, render_dm, safe_format


def test_render_comment_placeholders(home_services_config):
    text = render_comment(home_services_config, need="vinyl siding", author="Pat")
    assert "Cascade Home Pros" in text
    assert "vinyl siding" in text
    assert "(555) 123-4567" in text
    assert "https://example.com" in text


def test_render_dm(home_services_config):
    text = render_dm(home_services_config, need="deck", author="Jordan")
    assert "Jordan" in text
    assert "deck" in text
    assert "Cascade Home Pros" in text


def test_safe_format_unknown_key():
    assert safe_format("Hello {name} {missing}", {"name": "World"}) == "Hello World"


def test_empty_template(home_services_config):
    home_services_config.comment_template = ""
    # Falls back to built-in default
    text = render_comment(home_services_config, need="roof")
    assert "roof" in text
    assert home_services_config.business_name in text
