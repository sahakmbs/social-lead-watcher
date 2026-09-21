"""Config load / validation tests."""

from __future__ import annotations

from pathlib import Path

import pytest

from lead_watcher.config import ConfigError, load_config, parse_business_dict


def test_load_home_services_example():
    root = Path(__file__).resolve().parents[1]
    cfg = load_config(root / "config/examples/home-services.yaml")
    assert cfg.business_name == "Cascade Home Pros"
    assert cfg.platforms[0].type == "facebook"
    assert cfg.platforms[0].sources


def test_missing_business_name():
    with pytest.raises(ConfigError):
        parse_business_dict({"phone": "1"})


def test_invalid_platforms_type():
    with pytest.raises(ConfigError):
        parse_business_dict({"business_name": "X", "platforms": "facebook"})
