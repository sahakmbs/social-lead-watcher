"""CLI entrypoint for Social Lead Watcher."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Sequence

from lead_watcher.config import ConfigError, load_config, write_example_config
from lead_watcher.dedupe import HandledStore
from lead_watcher.matcher import score_post, should_outreach
from lead_watcher.models import Classification, OutreachAction, Post
from lead_watcher.platforms import load_adapters
from lead_watcher.platforms.base import ManualBrowserRequired
from lead_watcher.templates import render_comment, render_dm, render_for_post


def cmd_score(args: argparse.Namespace) -> int:
    try:
        config = load_config(args.config)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2

    text = args.text
    if args.file:
        text = Path(args.file).read_text(encoding="utf-8")
    if not text:
        print("Provide --text or --file", file=sys.stderr)
        return 2

    post = Post(
        url=args.url or "",
        text=text,
        author=args.author or "",
        group=args.group or "",
        platform=args.platform or "",
    )
    result = score_post(post, config)
    out = {
        "classification": result.classification.value,
        "score": result.score,
        "reason": result.reason,
        "need": result.need,
        "matched_in_scope": result.matched_in_scope,
        "matched_skip": result.matched_skip,
        "matched_out_of_scope": result.matched_out_of_scope,
        "matched_geo": result.matched_geo,
        "should_outreach": should_outreach(result),
    }
    print(json.dumps(out, indent=2))
    return 0


def cmd_render_comment(args: argparse.Namespace) -> int:
    try:
        config = load_config(args.config)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2
    text = render_comment(
        config,
        need=args.need or "your project",
        author=args.author or "",
        group=args.group or "",
    )
    print(text)
    return 0


def cmd_render_dm(args: argparse.Namespace) -> int:
    try:
        config = load_config(args.config)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2
    text = render_dm(
        config,
        need=args.need or "your project",
        author=args.author or "",
        group=args.group or "",
    )
    print(text)
    return 0


def cmd_init_config(args: argparse.Namespace) -> int:
    out = Path(args.out)
    if out.exists() and not args.force:
        print(f"Refusing to overwrite {out} (pass --force)", file=sys.stderr)
        return 1
    path = write_example_config(out)
    print(f"Wrote {path}")
    return 0


def cmd_playbook(args: argparse.Namespace) -> int:
    try:
        config = load_config(args.config)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2
    adapters = load_adapters(config)
    if not adapters:
        print("No platforms configured.", file=sys.stderr)
        return 1
    for ad in adapters:
        print(ad.agent_playbook_scan())
        print()
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    """
    One cycle: load adapters → fetch posts → score → outreach (or dry-run).

    When adapters raise ManualBrowserRequired, print playbooks and exit 0
    so agent mode can continue manually.
    """
    try:
        config = load_config(args.config)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2

    store = HandledStore(args.handled or "data/handled.jsonl")
    store.load()
    adapters = load_adapters(config)
    dry_run = bool(args.dry_run)

    all_posts: list[Post] = []
    for ad in adapters:
        try:
            posts = ad.fetch_new_posts()
            all_posts.extend(posts)
        except ManualBrowserRequired as e:
            print(f"[{ad.platform_type}] Agent mode required: {e}")
            if e.playbook:
                print(e.playbook)
            if not args.allow_partial:
                return 0
        except NotImplementedError as e:
            print(f"[{ad.platform_type}] Not implemented: {e}")

    # Newest first if created_at present (ISO strings sort ok enough)
    all_posts.sort(key=lambda p: p.created_at or "", reverse=True)

    outreach_count = 0
    actions: list[OutreachAction] = []

    for post in all_posts:
        if not post.url:
            continue
        if store.already_handled(post.url):
            continue
        match = score_post(post, config)
        if not should_outreach(match):
            continue
        if outreach_count >= config.max_outreach_per_run:
            break

        comment, dm = render_for_post(config, post, match.need or "your project")
        action = OutreachAction(
            post=post,
            match=match,
            comment_text=comment,
            dm_text=dm,
            dry_run=dry_run,
        )

        if dry_run:
            action.dm_note = "dry-run"
            print(
                json.dumps(
                    {
                        "dry_run": True,
                        "classification": match.classification.value,
                        "post_url": post.url,
                        "need": match.need,
                        "comment": comment,
                        "dm": dm,
                    },
                    indent=2,
                )
            )
        else:
            # Attempt via matching adapter
            adapter = next(
                (a for a in adapters if a.platform_type == (post.platform or a.platform_type)),
                adapters[0] if adapters else None,
            )
            if adapter is None:
                print("No adapter for outreach", file=sys.stderr)
                break
            try:
                action.comment_posted = adapter.post_comment(post, comment)
            except ManualBrowserRequired as e:
                print(e.playbook or str(e))
                action.comment_posted = False
                action.dm_note = "agent_comment_required"
            try:
                sent, note = adapter.send_dm(post, dm)
                action.dm_sent = sent
                action.dm_note = note
            except ManualBrowserRequired as e:
                print(e.playbook or str(e))
                action.dm_sent = False
                action.dm_note = action.dm_note or "agent_dm_required"

            if args.record:
                store.mark_from_outreach(action)

        actions.append(action)
        outreach_count += 1

    if not actions and not all_posts:
        # Quiet when nothing to do in automation mode
        pass
    summary = {
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "posts_seen": len(all_posts),
        "outreach": outreach_count,
        "dry_run": dry_run,
    }
    print(json.dumps(summary))
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="lead_watcher",
        description="Universal Social Lead Watcher — score, render, run cycles",
    )
    sub = p.add_subparsers(dest="command", required=True)

    sp = sub.add_parser("score", help="Score post text against config")
    sp.add_argument("--config", required=True)
    sp.add_argument("--text", default="")
    sp.add_argument("--file", default="")
    sp.add_argument("--url", default="")
    sp.add_argument("--author", default="")
    sp.add_argument("--group", default="")
    sp.add_argument("--platform", default="")
    sp.set_defaults(func=cmd_score)

    sp = sub.add_parser("render-comment", help="Render public comment template")
    sp.add_argument("--config", required=True)
    sp.add_argument("--need", default="")
    sp.add_argument("--author", default="")
    sp.add_argument("--group", default="")
    sp.set_defaults(func=cmd_render_comment)

    sp = sub.add_parser("render-dm", help="Render DM template")
    sp.add_argument("--config", required=True)
    sp.add_argument("--need", default="")
    sp.add_argument("--author", default="")
    sp.add_argument("--group", default="")
    sp.set_defaults(func=cmd_render_dm)

    sp = sub.add_parser("init-config", help="Write a starter business.yaml")
    sp.add_argument("--out", default="config/business.yaml")
    sp.add_argument("--force", action="store_true")
    sp.set_defaults(func=cmd_init_config)

    sp = sub.add_parser("playbook", help="Print agent playbooks for configured platforms")
    sp.add_argument("--config", required=True)
    sp.set_defaults(func=cmd_playbook)

    sp = sub.add_parser("run", help="Run one fetch/score/outreach cycle")
    sp.add_argument("--config", required=True)
    sp.add_argument("--handled", default="data/handled.jsonl")
    sp.add_argument("--dry-run", action="store_true")
    sp.add_argument(
        "--record",
        action="store_true",
        help="Append to handled.jsonl after outreach attempts",
    )
    sp.add_argument(
        "--allow-partial",
        action="store_true",
        help="Continue if some adapters require agent mode",
    )
    sp.set_defaults(func=cmd_run)

    return p


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
