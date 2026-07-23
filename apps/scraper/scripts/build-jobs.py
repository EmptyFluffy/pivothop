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
import json, os, collections, hashlib, html, re

RAW = 'apps/scraper/data/postings_raw.ndjson'
NORM = 'apps/scraper/data/postings.ndjson'
OUT = 'apps/web/public/data/jobs'
DETAIL = 'apps/web/public/data/jobs-detail'
ALL = 'apps/web/public/data/all-jobs.json'
INDEX = 'apps/web/public/data/jobs-index.json'
# Sources whose terms allow re-display with attribution + link-back.
OK = {'greenhouse', 'usajobs', 'ashby', 'lever', 'himalayas', 'arbeitnow',
      'themuse', 'smartrecruiters', 'jobicy', 'remoteok', 'remotive'}
CAP = 60         # freshest N per occupation
FLOOR = 3        # skip occupations with fewer than this (no board)
DESC_CAP = 7000  # chars of description on the detail page

def num(v):
    try:
        return int(float(v)) if v not in (None, '', 'None') else None
    except (ValueError, TypeError):
        return None

# Brands whose casing simple title-casing gets wrong.
BRAND_CASE = {'openai': 'OpenAI', 'elevenlabs': 'ElevenLabs', 'gitlab': 'GitLab',
              'mongodb': 'MongoDB', 'doordash': 'DoorDash', 'sofi': 'SoFi',
              'clickhouse': 'ClickHouse', 'posthog': 'PostHog', 'duckduckgo': 'DuckDuckGo',
              'hashicorp': 'HashiCorp', 'digitalocean': 'DigitalOcean', 'nerdwallet': 'NerdWallet',
              'betterup': 'BetterUp', 'pagerduty': 'PagerDuty', 'wework': 'WeWork',
              'cockroachlabs': 'Cockroach Labs', 'jobandtalent': 'Job&Talent'}
def display_company(name):
    """ATS slugs often arrive all-lowercase ('coinbase'); title-case those,
    with a map for brands whose casing title-casing gets wrong (OpenAI)."""
    if name.lower() in BRAND_CASE:
        return BRAND_CASE[name.lower()]
    if name == name.lower():
        return ' '.join(w.capitalize() for w in name.split())
    return name

def jid(url):
    return hashlib.sha1(url.encode()).hexdigest()[:10]

_BLOCK_END = re.compile(r'</(p|div|ul|ol|h[1-6]|section|table|tr)>|<br\s*/?>', re.I)
_LI = re.compile(r'<li[^>]*>', re.I)
_TAG = re.compile(r'<[^>]+>')
def clean_desc(text):
    """Some sources (Greenhouse) ship the description as entity-escaped HTML.
    Unescape, turn block ends into newlines and list items into bullets, strip
    the rest of the tags, and tidy the whitespace into readable paragraphs."""
    t = html.unescape(html.unescape(text))          # twice: &amp;nbsp; style double-escapes
    t = _BLOCK_END.sub('\n\n', t)
    t = _LI.sub('\n· ', t)
    t = _TAG.sub(' ', t)
    t = t.replace(' ', ' ').replace('\r', '')
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r' *\n *', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

# Industry-standard job-description sections (summary / responsibilities /
# qualifications / benefits and their common aliases). A short line matching one
# of these stems, or any short line ending in a colon, is treated as a heading.
_HEAD_STEMS = re.compile(
    r'\b(responsibilit|what you.?ll do|what you will do|your (role|mission|impact|day)|the role\b|'
    r'about (the role|this role|you|us|the (team|position|company|job))|qualification|requirement|'
    r'who you are|what (we.?re|we are) looking|looking for|must have|nice to have|bonus point|'
    r'preferred|what you.?ll bring|what you bring|skills? (and|&) experience|your experience|'
    r'benefit|perk|what we offer|we offer|why (join|you.?ll love|work)|compensation|salary|pay range|'
    r'duties|overview|summary|our (culture|values|mission)|the team\b|interview process|how to apply|'
    r'education|experience required)', re.I)
def to_sections(text, cap):
    """Split cleaned text into [{h, t}] sections on detected headings."""
    sections, cur_h, cur = [], None, []
    def flush():
        t = '\n'.join(cur).strip()
        if t:
            sections.append({'h': cur_h, 't': t})
    used = 0
    for line in text.split('\n'):
        s = line.strip()
        if used >= cap:
            break
        is_head = (0 < len(s) <= 64 and not s.startswith('·')
                   and (_HEAD_STEMS.search(s) or s.endswith(':')))
        if is_head:
            flush()
            cur_h, cur = s.rstrip(':').strip(), []
        else:
            cur.append(line)
            used += len(line)
    flush()
    return sections[:12] if sections else ([{'h': None, 't': text[:cap]}] if text else [])

# Recognizable employers for the launch featured strip (only those actually in
# the corpus are used; salary-stated and freshest preferred, max two roles each).
FEATURED_COMPANIES = {'coinbase', 'airbnb', 'databricks', 'cloudflare', 'datadog', 'mongodb',
                      'pinterest', 'reddit', 'robinhood', 'vercel', 'stripe', 'figma', 'notion',
                      'webflow', 'airtable', 'gusto', 'anthropic', 'duolingo', 'affirm', 'plaid',
                      'openai', 'palantir', 'spotify', 'canva', 'discord', 'peloton', 'rivian',
                      'instacart', 'doordash', 'lyft', 'elevenlabs', 'linear', 'ramp', 'mercury',
                      'supabase', 'retool', 'grammarly', 'gitlab', 'dropbox', 'asana'}
FEATURED_CAP = 12

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
    desc = clean_desc(r.get('description_text') or '')
    if desc:
        desc_byocc[role][_id] = to_sections(desc, DESC_CAP)

# 3. Freshest-first, capped, floored.
for d in (OUT, DETAIL):
    os.makedirs(d, exist_ok=True)
    for f in os.listdir(d):
        if f.endswith('.json'):
            os.remove(os.path.join(d, f))
# Trim and cap first; flag featured on the originals; then write everything,
# so the per-occupation files, the global file, and the strip all agree.
kept_byocc = {}
for role, jobs in byocc.items():
    jobs.sort(key=lambda j: j['posted'] or '', reverse=True)
    jobs = jobs[:CAP]
    if len(jobs) >= FLOOR:
        kept_byocc[role] = jobs

# Featured strip: recognizable employers, salary-stated first, freshest,
# max two per company. Flag the original rows and emit the strip.
featured, per_co = [], collections.Counter()
candidates = [j for jobs in kept_byocc.values() for j in jobs if j['company'].lower() in FEATURED_COMPANIES]
candidates.sort(key=lambda j: (bool(j['smin'] or j['smax']), j['posted'] or ''), reverse=True)
for j in candidates:
    co = j['company'].lower()
    if per_co[co] >= 2 or len(featured) >= FEATURED_CAP:
        continue
    per_co[co] += 1
    j['featured'] = True
    featured.append(j)
json.dump([{k: v for k, v in j.items() if k != 'url'} for j in featured],
          open('apps/web/public/data/featured-jobs.json', 'w'), ensure_ascii=False)

index, all_rows = {}, []
for role, jobs in kept_byocc.items():
    json.dump(jobs, open(f'{OUT}/{role}.json', 'w'), ensure_ascii=False)
    kept = {j['id'] for j in jobs}
    details = {i: secs for i, secs in desc_byocc[role].items() if i in kept}
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
