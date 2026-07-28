#!/usr/bin/env python3
"""Per-page lastmod dates, advanced only when a page's content actually changed.

The sitemap used to stamp every data-driven URL with the build time, so all
1,800+ pages claimed to change at the same instant every night. Google discounts
lastmod it cannot trust, and "everything changed again" is the textbook example
— which cost us the one crawl-prioritisation signal we control, and burned crawl
budget re-fetching pages that had not moved.

This hashes the data behind each URL, compares it to the previous run, and only
moves the date when the hash moves. Unchanged pages keep their old date, so
"changed today" means something. Pages whose change date cannot be computed
honestly get no lastmod at all — an absent signal beats a wrong one.

Writes apps/web/public/data/lastmod.json ({url_path: "YYYY-MM-DD"}) plus a
sibling hash file. Run after build-jobs.py, before `next build`.

  python3 apps/scraper/scripts/build-lastmod.py [--today YYYY-MM-DD]
"""
import hashlib
import json
import os
import sys
import datetime

WEB = 'apps/web/public/data'
GEN = 'packages/data/generated'
OUT = os.path.join(WEB, 'lastmod.json')
HASHES = os.path.join(WEB, 'lastmod-hashes.json')

today = datetime.date.today().isoformat()
if '--today' in sys.argv:
    today = sys.argv[sys.argv.index('--today') + 1]


def digest(*paths):
    """Stable hash of one or more data files; None if none exist."""
    h = hashlib.sha1()
    seen = False
    for p in paths:
        try:
            with open(p, 'rb') as fh:
                h.update(fh.read())
            seen = True
        except FileNotFoundError:
            continue
    return h.hexdigest()[:16] if seen else None


def main():
    hashes = {}

    # Occupation job boards: the listing set for that occupation. If no new job
    # arrived and none dropped, the file is byte-identical and the date holds.
    jobs_dir = os.path.join(WEB, 'jobs')
    for f in sorted(os.listdir(jobs_dir)) if os.path.isdir(jobs_dir) else []:
        if f.endswith('.json'):
            occ = f[:-5]
            d = digest(os.path.join(jobs_dir, f))
            if d:
                hashes[f'/jobs/{occ}'] = d

    # Route and origin pages: the emitted per-origin file they render from.
    if os.path.isdir(GEN):
        for f in sorted(os.listdir(GEN)):
            if not f.endswith('.json') or f in ('index.json', 'skill-cooccur.json', 'demand-adjacency.json'):
                continue
            origin = f[:-5]
            path_ = os.path.join(GEN, f)
            d = digest(path_)
            if not d:
                continue
            hashes[f'/routes/{origin}'] = d
            hashes[f'/salary/{origin}'] = d
            # Pair pages (/routes/<origin>-to-<dest>) render from the same
            # origin file, so they share its change date rather than going
            # undated — which would drop 250+ real pages out of the signal.
            try:
                for role in (json.load(open(path_)).get('roles') or []):
                    if role.get('id'):
                        hashes[f'/routes/{origin}-to-{role["id"]}'] = d
            except (json.JSONDecodeError, OSError):
                pass

    # Hubs genuinely re-list changing counts every run, so a nightly date is
    # honest here — but only when the underlying corpus actually moved.
    corpus = digest(os.path.join(WEB, 'all-jobs.json'))
    if corpus:
        for u in ('/', '/jobs', '/jobs/browse', '/adjacency-index'):
            hashes[u] = corpus
    profiles = digest(os.path.join(WEB, 'skill-profiles.json'), os.path.join(WEB, 'origins.json'))
    if profiles:
        for u in ('/routes', '/salary', '/compare'):
            hashes[u] = profiles
    gloss = digest(os.path.join(WEB, 'skills-glossary.json'))
    if gloss:
        hashes['/glossary'] = gloss

    try:
        prev_hashes = json.load(open(HASHES))
    except (FileNotFoundError, json.JSONDecodeError):
        prev_hashes = {}
    try:
        prev_dates = json.load(open(OUT))
    except (FileNotFoundError, json.JSONDecodeError):
        prev_dates = {}

    dates, changed, held = {}, [], 0
    for url, h in hashes.items():
        if prev_hashes.get(url) == h and url in prev_dates:
            dates[url] = prev_dates[url]
            held += 1
        else:
            dates[url] = today
            changed.append(url)

    json.dump(dates, open(OUT, 'w'), sort_keys=True)
    json.dump(hashes, open(HASHES, 'w'), sort_keys=True)
    first_run = not prev_hashes
    print(f'lastmod: {len(dates)} urls — {len(changed)} changed, {held} held'
          + (' (first run: everything dated today)' if first_run else ''))
    if not first_run and changed:
        print('  changed: ' + ', '.join(sorted(changed)[:6]) + (' …' if len(changed) > 6 else ''))


if __name__ == '__main__':
    main()
