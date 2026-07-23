#!/usr/bin/env python3
"""Backfill the job board from the scrape.

Joins the normalized postings (which carry the occupation tag, role_id, and
USD salary) with the raw postings (company, location, description), keeps only
re-displayable sources (company-direct ATS boards, remote-job APIs, and public
-domain USAJOBS), dedups, sorts freshest-first, and caps per occupation.

Aggregator sources whose terms restrict re-display (Adzuna, Reed) are excluded
here; they feed the salary aggregates only, never the board. Every listing
links back to the original posting to apply.

  python3 apps/scraper/scripts/build-jobs.py    # from repo root

Writes apps/web/public/data/jobs/{role_id}.json and jobs-index.json.
"""
import json, os, collections

RAW = 'apps/scraper/data/postings_raw.ndjson'
NORM = 'apps/scraper/data/postings.ndjson'
OUT = 'apps/web/public/data/jobs'
INDEX = 'apps/web/public/data/jobs-index.json'
# Sources whose terms allow re-display with attribution + link-back.
OK = {'greenhouse', 'usajobs', 'ashby', 'lever', 'himalayas', 'arbeitnow',
      'themuse', 'smartrecruiters', 'jobicy', 'remoteok', 'remotive'}
CAP = 40        # freshest N per occupation
FLOOR = 3       # skip occupations with fewer than this (no board)

def num(v):
    try:
        return int(float(v)) if v not in (None, '', 'None') else None
    except (ValueError, TypeError):
        return None

# 1. Raw index by (source, external_id) for company / location.
raw = {}
for line in open(RAW):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    if d.get('source') in OK:
        raw[(d['source'], str(d.get('external_id')))] = d

# 2. Build listings from the normalized rows (they carry role_id + USD salary).
byocc = collections.defaultdict(list)
seen_url, seen_ct = set(), set()
for line in open(NORM):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    s = d.get('source')
    if s not in OK:
        continue
    role, url = d.get('role_id'), d.get('url')
    if not role or not url or url in seen_url:
        continue
    r = raw.get((s, str(d.get('external_id'))), {})
    company = (r.get('company') or '').strip()
    if not company or company.lower() in ('none', 'n/a', 'confidential'):
        continue  # a board card needs a named employer
    title = (r.get('title') or d.get('title_raw') or '').strip()
    ct = (company.lower(), title.lower())
    if not title or ct in seen_ct:
        continue
    seen_url.add(url); seen_ct.add(ct)
    remote = str(d.get('remote_flag')) == 'True'
    byocc[role].append({
        'title': title[:120],
        'company': company[:80],
        'location': (r.get('location') or '').strip()[:60] or ('Remote' if remote else ''),
        'remote': remote,
        'smin': num(d.get('salary_usd_min')),
        'smax': num(d.get('salary_usd_max')),
        'url': url,
        'source': s,
        'posted': (str(d.get('posted_at') or ''))[:10],
    })

# 3. Freshest-first, capped, floored.
os.makedirs(OUT, exist_ok=True)
# clear stale per-occupation files
for f in os.listdir(OUT):
    if f.endswith('.json'):
        os.remove(os.path.join(OUT, f))
index = {}
for role, jobs in byocc.items():
    jobs.sort(key=lambda j: j['posted'] or '', reverse=True)
    jobs = jobs[:CAP]
    if len(jobs) < FLOOR:
        continue
    json.dump(jobs, open(f'{OUT}/{role}.json', 'w'), ensure_ascii=False)
    index[role] = len(jobs)
json.dump(index, open(INDEX, 'w'), ensure_ascii=False)
print(f"emitted {len(index)} occupation boards, {sum(index.values())} listings")
print("top:", sorted(index.items(), key=lambda x: -x[1])[:8])
