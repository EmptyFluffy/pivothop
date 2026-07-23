#!/usr/bin/env python3
"""Backfill the job board from the scrape.

Joins the normalized postings (occupation tag, role_id, USD salary) with the
raw postings (company, location, description), keeps only re-displayable
sources (company-direct ATS boards, remote-job APIs, public-domain USAJOBS),
dedups, sorts freshest-first, and caps per occupation.

Aggregator sources whose terms restrict re-display (Adzuna, Reed) are excluded
here; they feed the salary aggregates only, never the board. Every listing
links back to the original posting to apply.

  python3 apps/scraper/scripts/build-jobs.py    # from repo root

Writes:
  apps/web/public/data/jobs/{role_id}.json         light rows for one occupation
  apps/web/public/data/all-jobs.json               light rows, every occupation (global search)
  apps/web/public/data/jobs-detail/{role_id}.json  id -> {desc} (detail pages, build-time read)
  apps/web/public/data/jobs-index.json             role_id -> count
"""
import json, os, collections, hashlib

RAW = 'apps/scraper/data/postings_raw.ndjson'
NORM = 'apps/scraper/data/postings.ndjson'
OUT = 'apps/web/public/data/jobs'
DETAIL = 'apps/web/public/data/jobs-detail'
ALL = 'apps/web/public/data/all-jobs.json'
INDEX = 'apps/web/public/data/jobs-index.json'
# Sources whose terms allow re-display with attribution + link-back.
OK = {'greenhouse', 'usajobs', 'ashby', 'lever', 'himalayas', 'arbeitnow',
      'themuse', 'smartrecruiters', 'jobicy', 'remoteok', 'remotive'}
CAP = 40         # freshest N per occupation
FLOOR = 3        # skip occupations with fewer than this (no board)
DESC_CAP = 7000  # chars of description on the detail page

def num(v):
    try:
        return int(float(v)) if v not in (None, '', 'None') else None
    except (ValueError, TypeError):
        return None

def display_company(name):
    """ATS slugs often arrive all-lowercase ('coinbase'); title-case those.
    Mixed-case names (IBM, McKinsey & Company) pass through untouched."""
    if name == name.lower():
        return ' '.join(w.capitalize() for w in name.split())
    return name

def jid(url):
    return hashlib.sha1(url.encode()).hexdigest()[:10]

# 1. Raw index by (source, external_id) for company / location / description.
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
desc_byocc = collections.defaultdict(dict)
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
    _id = jid(url)
    byocc[role].append({
        'id': _id,
        'occ': role,
        'title': title[:120],
        'company': display_company(company)[:80],
        'location': (r.get('location') or '').strip()[:60] or ('Remote' if remote else ''),
        'remote': remote,
        'smin': num(d.get('salary_usd_min')),
        'smax': num(d.get('salary_usd_max')),
        'url': url,
        'source': s,
        'posted': (str(d.get('posted_at') or ''))[:10],
    })
    desc = (r.get('description_text') or '').strip()
    if desc:
        desc_byocc[role][_id] = desc[:DESC_CAP]

# 3. Freshest-first, capped, floored.
for d in (OUT, DETAIL):
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith('.json'):
            os.remove(os.path.join(d, f))
index, all_rows = {}, []
for role, jobs in byocc.items():
    jobs.sort(key=lambda j: j['posted'] or '', reverse=True)
    jobs = jobs[:CAP]
    if len(jobs) < FLOOR:
        continue
    json.dump(jobs, open(f'{OUT}/{role}.json', 'w'), ensure_ascii=False)
    kept = {j['id'] for j in jobs}
    details = {i: {'desc': t} for i, t in desc_byocc[role].items() if i in kept}
    json.dump(details, open(f'{DETAIL}/{role}.json', 'w'), ensure_ascii=False)
    index[role] = len(jobs)
    # global search rows: drop the outbound URL (only detail pages need it; it is
    # the heaviest field) — browse links internally via occ + id.
    all_rows.extend({k: v for k, v in j.items() if k != 'url'} for j in jobs)
all_rows.sort(key=lambda j: j['posted'] or '', reverse=True)
json.dump(all_rows, open(ALL, 'w'), ensure_ascii=False)
json.dump(index, open(INDEX, 'w'), ensure_ascii=False)
size_kb = os.path.getsize(ALL) // 1024
print(f"emitted {len(index)} occupation boards, {len(all_rows)} listings, all-jobs.json {size_kb}KB")
with_desc = sum(1 for role in index for _ in json.load(open(f'{DETAIL}/{role}.json')))
print(f"detail descriptions: {with_desc} of {len(all_rows)}")
