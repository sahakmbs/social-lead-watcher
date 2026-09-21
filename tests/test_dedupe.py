"""Handled JSONL store tests."""

from __future__ import annotations

from lead_watcher.dedupe import HandledStore
from lead_watcher.models import HandledRecord


def test_already_handled_and_append(tmp_path):
    path = tmp_path / "handled.jsonl"
    store = HandledStore(path)
    assert store.already_handled("https://example.com/p/1") is False

    rec = HandledRecord(
        ts="2026-09-21T12:00:00Z",
        group="Test Group",
        post_url="https://example.com/p/1",
        author="Alex",
        snippet="Looking for siding...",
        comment_posted=True,
        comment_text="Hi!",
        dm_sent=False,
        dm_note="blocked",
        classification="strong",
        reason="in_scope: siding",
    )
    store.append(rec)
    assert store.already_handled("https://example.com/p/1") is True

    # Reload from disk
    store2 = HandledStore(path)
    store2.load()
    assert store2.already_handled("https://example.com/p/1") is True

    records = list(store2.iter_records())
    assert len(records) == 1
    assert records[0].author == "Alex"
    assert records[0].reason == "in_scope: siding"


def test_append_dict(tmp_path):
    path = tmp_path / "handled.jsonl"
    store = HandledStore(path)
    store.append(
        {
            "ts": "2026-09-21T12:00:00Z",
            "group": "G",
            "post_url": "https://example.com/p/2",
            "author": "Sam",
            "snippet": "x",
            "comment_posted": False,
            "comment_text": "",
            "dm_sent": False,
            "dm_note": "",
            "classification": "maybe",
        }
    )
    assert store.already_handled("https://example.com/p/2")
