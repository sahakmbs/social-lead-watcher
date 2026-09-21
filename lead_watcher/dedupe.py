"""JSONL handled-log store — prevent double-commenting."""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

from lead_watcher.models import HandledRecord, OutreachAction


class HandledStore:
    """
    Append-only JSONL store keyed by post_url.

    Thread-safe enough for a single process (RLock around read/write).
    """

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self._lock = threading.RLock()
        self._urls: set[str] = set()
        self._loaded = False

    def _ensure_parent(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> None:
        with self._lock:
            self._urls = set()
            if self.path.exists():
                with self.path.open("r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            obj = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        url = obj.get("post_url") or obj.get("url")
                        if url:
                            self._urls.add(str(url))
            self._loaded = True

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()

    def already_handled(self, url: str) -> bool:
        with self._lock:
            self._ensure_loaded()
            return url in self._urls

    def append(self, record: HandledRecord | dict) -> None:
        if isinstance(record, HandledRecord):
            data = record.to_dict()
            url = record.post_url
        else:
            data = dict(record)
            url = str(data.get("post_url") or "")
        if not url:
            raise ValueError("HandledRecord must include post_url")

        line = json.dumps(data, ensure_ascii=False)
        with self._lock:
            self._ensure_loaded()
            self._ensure_parent()
            with self.path.open("a", encoding="utf-8") as f:
                f.write(line + "\n")
            self._urls.add(url)

    def mark_from_outreach(
        self,
        action: OutreachAction,
        *,
        ts: Optional[str] = None,
    ) -> HandledRecord:
        """Build + append a HandledRecord from an OutreachAction."""
        if ts is None:
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        snippet = (action.post.text or "")[:200]
        rec = HandledRecord(
            ts=ts,
            group=action.post.group or "",
            post_url=action.post.url,
            author=action.post.author or "",
            snippet=snippet,
            comment_posted=action.comment_posted,
            comment_text=action.comment_text,
            dm_sent=action.dm_sent,
            dm_note=action.dm_note,
            classification=action.match.classification.value,
            reason=action.match.reason or None,
        )
        self.append(rec)
        return rec

    def iter_records(self) -> Iterable[HandledRecord]:
        if not self.path.exists():
            return
        with self.path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield HandledRecord.from_dict(json.loads(line))
                except (json.JSONDecodeError, TypeError, KeyError):
                    continue
