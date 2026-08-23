#!/usr/bin/env python3
"""Admin studio registry: every studio the fleet has ever admitted, with every
posting the direct scraper currently holds for it — UNTRIMMED.

The public board shows 165 direct listings; the corpus holds 778. The gap is
board caps, occupation floors, and postings whose titles don't map to a covered
occupation. This surface exists so the founder can read the whole catch, per
studio, including the studios that currently post nothing (a fleet studio with
zero jobs is still a studio we watch — the registry only grows; removal is a
manual config edit, never this script's call).

Reads: config/direct-companies.json + direct-companies-auto.json (the registry)
       data/postings_raw.ndjson, source=direct (the catch)
Writes: apps/web/public/data/admin-studios.json (noindex admin page reads it)
"""
import json, os, sys, datetime

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
CONFIG = os.path.join(ROOT, 'apps/scraper/config')
RAW = os.path.join(ROOT, 'apps/scraper/data/postings_raw.ndjson')
OUT = os.path.join(ROOT, 'apps/web/public/data/admin-studios.json')


def read(p, fb):
    try:
        with open(p) as f:
            return json.load(f)
    except Exception:
        return fb


curated = read(os.path.join(CONFIG, 'direct-companies.json'), {'companies': []})['companies']
auto = read(os.path.join(CONFIG, 'direct-companies-auto.json'), {'companies': []})['companies']

# The registry. Curated first (they were vetted by hand), then auto by most
# recently admitted, so the newest discoveries sit where the founder looks.
studios = {}
for c in curated:
    studios[c['name']] = {'name': c['name'], 'careers': c.get('careers', ''), 'tier': 'curated',
                          'admitted': c.get('admitted'), 'jobs': []}
for c in auto:
    if c['name'] not in studios:
        studios[c['name']] = {'name': c['name'], 'careers': c.get('careers', ''), 'tier': 'auto',
                              'admitted': c.get('admitted'), 'jobs': []}

# The catch. Company on a direct posting is the fleet name verbatim (direct.js
# stamps it from config), so exact match is the join.
unmatched = 0
if os.path.exists(RAW):
    with open(RAW) as f:
        for line in f:
            try:
                j = json.loads(line)
            except Exception:
                continue
            if j.get('source') != 'direct':
                continue
            s = studios.get(j.get('company'))
            if s is None:
                unmatched += 1
                continue
            s['jobs'].append({
                'title': j.get('title'),
                'url': j.get('url') or j.get('external_id'),
                'location': j.get('location') or '',
                'smin': j.get('salary_min'), 'smax': j.get('salary_max'),
                'currency': j.get('currency'),
                'posted': j.get('posted_at'),
            })

rows = sorted(studios.values(), key=lambda s: (s['tier'] != 'curated', -(len(s['jobs'])), s['name'].lower()))
njobs = sum(len(s['jobs']) for s in rows)
out = {
    'generated': datetime.date.today().isoformat(),
    'studios': rows,
    'totals': {'studios': len(rows), 'curated': len(curated), 'auto': len(auto),
               'jobs': njobs, 'unmatched': unmatched},
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w') as f:
    json.dump(out, f, separators=(',', ':'))
print(f"admin-studios: {len(rows)} studios ({len(curated)} curated + {len(auto)} auto), "
      f"{njobs} postings, {unmatched} unmatched-company postings")
