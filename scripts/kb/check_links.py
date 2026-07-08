#!/usr/bin/env python3
"""Valida links internos (relativos) nos .md da KB e no CLAUDE.md.

Uso:
    python3 scripts/kb/check_links.py        # exit 1 se houver link quebrado

Ignora links externos (http/https/mailto), âncoras puras (#...) e o fragmento
(#secao) dos links relativos — verifica apenas se o ARQUIVO alvo existe.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def md_files():
    seen = set()
    for base in ("CLAUDE.md", "docs"):
        p = os.path.join(ROOT, base)
        if os.path.isfile(p) and p.endswith(".md"):
            if p not in seen:
                seen.add(p)
                yield p
        elif os.path.isdir(p):
            for dirpath, _, files in os.walk(p):
                for f in files:
                    if f.endswith(".md"):
                        fp = os.path.join(dirpath, f)
                        if fp not in seen:
                            seen.add(fp)
                            yield fp


def check():
    broken = []
    for md in md_files():
        with open(md, encoding="utf-8") as fh:
            text = fh.read()
        for m in LINK.finditer(text):
            target = m.group(1).strip()
            if target.startswith(("http://", "https://", "mailto:", "tel:", "#")):
                continue
            path = target.split("#", 1)[0].split("?", 1)[0]
            if not path:
                continue
            resolved = os.path.normpath(os.path.join(os.path.dirname(md), path))
            if not os.path.exists(resolved):
                broken.append((os.path.relpath(md, ROOT), target))
    return broken


if __name__ == "__main__":
    broken = check()
    if broken:
        print("Links internos quebrados na KB:")
        for md, t in broken:
            print(f"  {md} -> {t}")
        sys.exit(1)
    print("OK: nenhum link interno quebrado.")
