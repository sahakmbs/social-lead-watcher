"""Shared fixtures."""

from __future__ import annotations

import pytest

from lead_watcher.config import parse_business_dict
from lead_watcher.models import BusinessConfig


@pytest.fixture
def home_services_config() -> BusinessConfig:
    return parse_business_dict(
        {
            "business_name": "Cascade Home Pros",
            "website": "https://example.com",
            "phone": "(555) 123-4567",
            "email": "hello@example.com",
            "license_note": "Licensed sample",
            "service_area": ["Seattle", "Bellevue", "King County"],
            "in_scope": [
                "vinyl siding",
                "siding",
                "roofing",
                "kitchen remodel",
                "remodel",
                "deck",
            ],
            "out_of_scope": ["lawn care", "moving company", "house cleaning"],
            "skip_patterns": [
                "looking for work",
                "hourly",
                "$/hr",
                "per hour",
                "need crew",
                "I'm a contractor looking",
            ],
            "comment_template": (
                "Hi! We're {business_name} — happy to help with {need}. "
                "{phone} | {website}. {cta}"
            ),
            "dm_template": (
                "Hi {author}, re: {need}. {business_name} — {phone} | {website}."
            ),
            "max_outreach_per_run": 3,
            "strong_min_score": 4,
            "maybe_min_score": 2,
            "platforms": [
                {
                    "type": "facebook",
                    "identity_name": "Cascade Home Pros Page",
                    "sources": [
                        {
                            "name": "Test Group",
                            "url": "https://www.facebook.com/groups/test",
                        }
                    ],
                }
            ],
        }
    )
