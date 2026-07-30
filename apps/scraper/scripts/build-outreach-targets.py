#!/usr/bin/env python3
"""Rank hiring companies as outreach targets for the adjacent-talent pitch.

WHY THIS EXISTS. The board's monetization is employers paying to post roles open
to adjacent candidates (CLAUDE.md). The corpus already names 46,836 companies that
are demonstrably hiring — a prospect list nobody had to buy, pre-qualified by the
only signal that matters. What it does NOT contain is contact emails: a scan of all
209,228 raw postings found 668 distinct addresses, and the most common are
accommodations@, candidateaccommodations@ and talentdata.privacy@ — statutory ADA
and data-subject channels. Those are never outreach targets. Contact discovery is a
paid, per-domain step (docs/28) run against the SHORTLIST this script produces, not
against the whole corpus.

THE RANKING. A company is worth an email when we can tell it something true that it
does not know: that a role it has open is reachable by people holding a different
title, and we can name them. That is exactly what the emitted graph measures, so
the score is built from it rather than from firmographics:

  reach    how many distinct origin occupations reach this company's roles at
           real readiness, and the best readiness among them. This is the pitch.
  volume   how many adjacent roles the company has open (log-damped — a company
           with 40 openings is not 40x the prospect of one with 1).
  age      days the oldest adjacent role has been open. Staleness is pain, and
           pain is why someone answers. Capped so an abandoned post can't win.

Every component is emitted alongside the total so a target can be argued with.

EXCLUSIONS. Government (USAJOBS, VA, National Guard) cannot buy a job-post, so it
is dropped rather than ranked — it would otherwise dominate on volume alone
(Veterans Health Administration is the single largest poster in the corpus).

COMPLIANCE. Germany (UWG s7) requires prior consent for B2B email and Canada
(CASL) requires express or implied consent. Companies whose postings are only in
those countries are emitted with mail_ok=False so the console can refuse to queue
them. Everything else carries its countries so the operator can see what they are
sending into.

  python3 apps/scraper/scripts/build-outreach-targets.py   # from repo root

Writes packages/data/outreach/targets.json — deliberately NOT under
apps/web/public/, which is world-readable. The admin console imports it
server-side.
"""
import json, os, re, math, collections, datetime, glob

RAW  = 'apps/scraper/data/postings_raw.ndjson'
NORM = 'apps/scraper/data/postings.ndjson'
GEN  = 'packages/data/generated'
TAX  = 'packages/data/taxonomy/occupations.json'
OUT  = 'packages/data/outreach/targets.json'

EMIT_TOP   = 1200   # rows written for the console; the count of all scored is reported
MIN_READY  = 40     # an origin below this readiness is not a pitch, it is a stretch
AGE_CAP    = 120    # days; beyond this a posting is likely stale, not urgent

# Prior consent required for B2B email — do not queue.
NO_MAIL_COUNTRIES = {'DE', 'CA'}

# Consent countries also inferred from the LOCATION string, because the normalized
# country field is often absent and loosening the block let obvious cases through:
# "Saskatchewan Health Authority" ranked 6th and mailable on the run before this.
# CASL is CAD $10M and UWG s7 is EUR 300k, so a missed country is not a cheap miss.
CONSENT_LOC = re.compile(
    r'\b(canada|canadian|ontario|quebec|british columbia|alberta|saskatchewan|manitoba|'
    r'nova scotia|new brunswick|newfoundland|toronto|montreal|vancouver|calgary|'
    r'edmonton|ottawa|winnipeg|halifax|saskatoon|regina|mississauga|brampton|'
    r'germany|german|deutschland|berlin|munich|munchen|hamburg|frankfurt|cologne|koeln|'
    r'stuttgart|dusseldorf|duesseldorf|leipzig|dortmund|bremen|dresden|hannover|'
    r'nuremberg|nurnberg)\b'
    r'|,\s*(on|qc|bc|ab|sk|mb|ns|nb|nl|pe)\s*(,|$)', re.I)

# Not prospects. Aggregators and job boards are where the postings CAME from — "Reed"
# ranked 6th on the first run, which is a data artefact (Reed-sourced rows sometimes
# carry the aggregator as the employer) and also a competitor. Staffing and RPO firms
# resell the same candidates we would be introducing, so they are flagged rather than
# pitched; they surfaced high (Robert Half 1st, Targeted Talent 8th) purely on volume.
AGGREGATOR = re.compile(
    r'^(reed|adzuna|indeed|linkedin|ziprecruiter|glassdoor|monster|totaljobs|careerjet|'
    r'jooble|neuvoo|talent\.com|jobrapido|simplyhired|snagajob|themuse|remoteok|'
    r'remotive|himalayas|jobicy|arbeitnow|getonboard|get on board|workable|greenhouse|'
    r'lever|ashby|smartrecruiters|recruitee|usajobs)\b', re.I)
STAFFING = re.compile(
    r'\b(robert half|randstad|adecco|manpower|kelly services|hays|michael page|'
    r'aerotek|insight global|teksystems|kforce|apex systems|cybercoders|motion recruitment|'
    r'targeted talent|talent solutions|staffing|recruitment agency|recruiting agency|'
    r'rpo\b|headhunt|staff aug)\b', re.I)

# Government and military: cannot buy a job post.
GOV = re.compile(
    r'\b(veterans health|veterans affairs|national guard|army|navy|air force|marine corps|'
    r'department of|dept\.? of|u\.?s\.? government|federal|internal revenue|'
    r'social security admin|state of |county of |city of |bureau of |office of |'
    r'military treatment|defense health|indian health)\b', re.I)

# ATS host -> the company slug in the URL. greenhouse.io/figma tells us "figma"
# far more reliably than title-casing the company string does.
ATS = {
    'greenhouse':      re.compile(r'greenhouse\.io/([^/?#]+)'),
    'lever':           re.compile(r'lever\.co/([^/?#]+)'),
    'ashby':           re.compile(r'ashbyhq\.com/([^/?#]+)'),
    'smartrecruiters': re.compile(r'smartrecruiters\.com/([^/?#]+)'),
    'workable':        re.compile(r'workable\.com/([^/?#]+)'),
    'recruitee':       re.compile(r'recruitee\.com/([^/?#]+)'),
}
LEGAL = re.compile(
    r'\b(inc|llc|l\.l\.c|ltd|limited|gmbh|s\.?a\.?r\.?l|b\.?v|n\.?v|plc|corp|corporation|'
    r'co|company|group|holdings|holding|sas|sa|ag|ab|oy|as|aps|spa|srl|pty|pte)\b\.?', re.I)


# ATS slugs arrive all-lowercase ("databricks", "stripe"), so the console showed a
# mix of "databricks" and "Amazon". Same map and rule as build-jobs.py.
BRAND_CASE = {'openai': 'OpenAI', 'elevenlabs': 'ElevenLabs', 'gitlab': 'GitLab',
              'mongodb': 'MongoDB', 'doordash': 'DoorDash', 'sofi': 'SoFi',
              'clickhouse': 'ClickHouse', 'posthog': 'PostHog', 'duckduckgo': 'DuckDuckGo',
              'hashicorp': 'HashiCorp', 'digitalocean': 'DigitalOcean', 'nerdwallet': 'NerdWallet',
              'betterup': 'BetterUp', 'pagerduty': 'PagerDuty', 'wework': 'WeWork',
              'cockroachlabs': 'Cockroach Labs', 'jobandtalent': 'Job&Talent'}


def display_company(name):
    if name.lower() in BRAND_CASE:
        return BRAND_CASE[name.lower()]
    if name == name.lower():
        return ' '.join(w.capitalize() for w in name.split())
    return name


def name_domain(s):
    """"Oura Health Ltd" -> ourahealth.com. Same guess fetch-logos.mjs makes."""
    g = LEGAL.sub('', str(s).lower().replace('&', 'and'))
    g = re.sub(r'[^a-z0-9]', '', g)
    return g + '.com' if g else None


def load_inbound():
    """dest occupation -> [{origin, match, kind}] from every emitted origin's ring 1.

    roles[] in a generated file IS the ring-1 route set for that origin, and each
    entry carries `match` (origin-relative skill readiness) — the same number the
    graph draws — plus `kind`, which is 'lateral' inside one industry cluster and
    'pivot' across them. Reading it back gives, per destination, the list of titles
    whose holders can actually reach it.
    """
    inbound = collections.defaultdict(list)
    for p in glob.glob(os.path.join(GEN, '*.json')):
        try:
            d = json.load(open(p, encoding='utf-8'))
        except (ValueError, OSError):
            continue
        origin = (d.get('origin') or {}).get('id') or (d.get('origin') or {}).get('slug')
        if not origin or not isinstance(d.get('roles'), list):
            continue
        for r in d['roles']:
            dest, m = r.get('id'), r.get('match')
            if not dest or dest == origin or not isinstance(m, (int, float)) or m < MIN_READY:
                continue
            # LICENCE GATE — the dental-hygienist lesson, applied to outreach. A high
            # skill match does not shorten a credential. Registered Nurse covers 82% of
            # what a Nurse Practitioner posting asks for, but an NP needs a graduate
            # degree and APRN certification, so telling a hospital its 107 NP openings
            # are fillable from adjacent talent is simply false. Roles whose licence is
            # `required` are therefore not outreach-pitchable at all: they are dropped
            # from inbound, so they neither get pitched nor inflate a company's adjacent
            # count. `partial` stays — a ServSafe cert is not a barrier, so Cook -> Chef
            # remains a real pitch.
            if (r.get('license') or {}).get('req') == 'required':
                continue
            inbound[dest].append({'origin': origin, 'match': int(m),
                                  'kind': r.get('kind') or 'pivot'})
    for v in inbound.values():
        v.sort(key=lambda x: -x['match'])
    return inbound


def main():
    tax = json.load(open(TAX, encoding='utf-8'))['occupations']
    titles = {o['slug']: o['title'] for o in tax}
    fields = {o['slug']: (o.get('field') or 'Other') for o in tax}
    inbound = load_inbound()
    gated = sorted(o['slug'] for o in json.load(open(TAX, encoding='utf-8'))['occupations']
                   if (o.get('license') or {}).get('req') == 'required')
    print(f'inbound adjacency: {len(inbound)} occupations reachable at >={MIN_READY}% readiness')
    print(f'  licence-gated and therefore NOT pitchable: {len(gated)} occupations '
          f'({", ".join(gated[:6])}{"…" if len(gated) > 6 else ""})')

    # (source, external_id) -> company / url, from the raw store.
    raw = {}
    for line in open(RAW, encoding='utf-8'):
        try:
            r = json.loads(line)
        except ValueError:
            continue
        co = r.get('company') or r.get('company_name') or r.get('employer')
        if co:
            raw[(r.get('source'), str(r.get('external_id')))] = (
                str(co).strip(), r.get('url') or '', str(r.get('location') or ''))

    today = datetime.date.today()
    comp = collections.defaultdict(lambda: {
        'postings': 0, 'adjacent': 0, 'occs': collections.Counter(),
        'countries': collections.Counter(), 'sources': collections.Counter(),
        'oldest': None, 'urls': [], 'raw_names': collections.Counter(),
        'loc_consent': 0, 'loc_other': 0,
    })

    for line in open(NORM, encoding='utf-8'):
        try:
            r = json.loads(line)
        except ValueError:
            continue
        hit = raw.get((r.get('source'), str(r.get('external_id'))))
        if not hit:
            continue
        name, url, loc = hit
        if GOV.search(name) or AGGREGATOR.match(name.strip()):
            continue
        key = re.sub(r'[^a-z0-9]', '', LEGAL.sub('', name.lower()))
        if not key:
            continue
        c = comp[key]
        c['postings'] += 1
        c['raw_names'][name] += 1
        occ = r.get('role_id')
        if occ and occ in inbound:
            c['adjacent'] += 1
            c['occs'][occ] += 1
        if r.get('country'):
            c['countries'][r['country']] += 1
        if r.get('source'):
            c['sources'][r['source']] += 1
        if url and len(c['urls']) < 3:
            c['urls'].append(url)
        # Also classify by location text, so a company with no country field but a
        # Toronto or Berlin address still trips the consent block below.
        if loc.strip():
            if CONSENT_LOC.search(loc):
                c['loc_consent'] += 1
            else:
                c['loc_other'] += 1
        pa = r.get('posted_at')
        if pa:
            try:
                d = datetime.date.fromisoformat(str(pa)[:10])
                if c['oldest'] is None or d < c['oldest']:
                    c['oldest'] = d
            except ValueError:
                pass

    rows = []
    for key, c in comp.items():
        if not c['adjacent']:
            continue                      # nothing to pitch: no adjacent-reachable role
        name = display_company(c['raw_names'].most_common(1)[0][0])

        # THE PITCH. Not simply the highest-readiness pair — that selects for the most
        # OBVIOUS adjacency, which is worthless in an email. Ranking by raw match put
        # "Account Executive -> Sales Representative, 89%" on almost every row: two
        # near-synonymous jobs, and a claim any hiring manager would answer with
        # "obviously". The email only earns a reply if it says something they don't
        # already know, so a cross-cluster route ('pivot') outranks a same-cluster one
        # ('lateral') regardless of readiness, and lateral is only the pitch when the
        # company has nothing else. Architect -> BIM Manager is a finding; Account
        # Executive -> Sales Rep is a tautology.
        # Within kind, rank by readiness WEIGHTED BY THIS COMPANY'S OPENINGS for that
        # destination. Readiness alone made every broad hirer receive the same email:
        # the globally-best pivot pair exists inside all of them, so Amazon and
        # Accenture both drew "Product Designer -> Design Technologist" while Amazon
        # had 325 adjacent roles open and Stantec — an AEC firm, the launch vertical —
        # got pitched product design instead of the architecture roles it was filling.
        # Weighting by openings makes the pitch the company's actual volume problem,
        # and diversifies the campaign as a side effect.
        best = None
        best_w = -1.0
        origins = set()
        pivots = 0
        for occ, n_open in c['occs'].items():
            for e in inbound[occ]:
                origins.add(e['origin'])
                is_pivot = e['kind'] == 'pivot'
                if is_pivot:
                    pivots += 1
                w = e['match'] * (1 + math.log(n_open))
                cand = {'occ': occ, 'origin': e['origin'], 'match': e['match'],
                        'kind': e['kind'], 'openings': n_open}
                if best is None:
                    best, best_w = cand, w
                    continue
                # A cross-industry pitch still outranks a same-industry one outright —
                # an obvious adjacency is not worth sending at any volume.
                better_kind = is_pivot and best['kind'] != 'pivot'
                same_kind_better = (is_pivot == (best['kind'] == 'pivot')) and w > best_w
                if better_kind or same_kind_better:
                    best, best_w = cand, w
        if not best:
            continue

        age = (today - c['oldest']).days if c['oldest'] else 0
        age = max(0, min(age, AGE_CAP))

        # A cross-cluster pitch is worth more than a same-cluster one at equal
        # readiness, because it is the only kind that tells the employer something.
        reach  = best['match'] + 4 * min(len(origins), 10) + (12 if best['kind'] == 'pivot' else 0)
        volume = 14 * math.log1p(c['adjacent'])
        agepts = 25 * (age / AGE_CAP)
        score  = round(reach + volume + agepts, 1)

        countries = [k for k, _ in c['countries'].most_common()]
        # Three states, not two. An UNKNOWN country is not Germany: blocking on missing
        # data locked 14,817 of 25,858 companies (57%) on the first run, which is not
        # caution, it is a broken tool. Only a company posting exclusively from a
        # prior-consent country is locked; unknown is allowed and labelled so the
        # operator can see what they are deciding.
        country_known = bool(countries)
        if country_known:
            mail_ok = not (set(countries) <= NO_MAIL_COUNTRIES)
        else:
            # No country field: fall back to the location text. Block only when every
            # location we could read points at a consent country — a company with both
            # a Toronto and a New York office is reachable at the New York one.
            mail_ok = not (c['loc_consent'] > 0 and c['loc_other'] == 0)

        # Domain candidates, never asserted as fact — the ATS slug when the posting
        # came from a company-hosted board, plus the name guess. Resolution proper
        # is the provider's job, on the shortlist only.
        cands = []
        for u in c['urls']:
            for src, rx in ATS.items():
                m = rx.search(u)
                if m and m.group(1).lower() not in ('embed', 'jobs'):
                    d = re.sub(r'[^a-z0-9-]', '', m.group(1).lower()) + '.com'
                    if d not in cands:
                        cands.append(d)
        ng = name_domain(name)
        if ng and ng not in cands:
            cands.append(ng)

        # Facets for the console (2026-07-30). `field` is the dominant industry
        # among the company's adjacent openings, straight from the taxonomy.
        # `scale` is corpus footprint, NOT headcount — a company with 100+ open
        # roles in a 236k corpus is a giant whose inbox we will never reach, and
        # the operator wants to filter those out, so the honest proxy is enough.
        fld = collections.Counter()
        for o, n_open in c['occs'].items():
            fld[fields.get(o, 'Other')] += n_open
        field = fld.most_common(1)[0][0] if fld else 'Other'
        scale = 'major' if c['postings'] >= 100 else 'mid' if c['postings'] >= 20 else 'small'

        rows.append({
            'key': key,
            'company': name,
            'field': field,
            'scale': scale,
            'score': score,
            'why': {'reach': round(reach, 1), 'volume': round(volume, 1), 'age': round(agepts, 1)},
            'open_roles': c['postings'],
            'adjacent_roles': c['adjacent'],
            'days_open': age,
            'pitch': {
                'role': titles.get(best['occ'], best['occ']),
                'role_slug': best['occ'],
                'from': titles.get(best['origin'], best['origin']),
                'from_slug': best['origin'],
                'readiness': best['match'],
                'pool': len(origins),
                'kind': best['kind'],          # 'pivot' = cross-industry, the interesting case
                'openings': best['openings'],  # how many of THIS role the company has open
            },
            'staffing': bool(STAFFING.search(name)),
            'country_known': country_known,
            'top_occupations': [{'slug': s, 'title': titles.get(s, s), 'n': n}
                                for s, n in c['occs'].most_common(4)],
            'countries': countries[:4],
            'mail_ok': mail_ok,
            'sources': [k for k, _ in c['sources'].most_common(3)],
            'domain_candidates': cands[:3],
        })

    rows.sort(key=lambda r: -r['score'])
    blocked = sum(1 for r in rows if not r['mail_ok'])
    pivots = sum(1 for r in rows[:EMIT_TOP] if r['pitch']['kind'] == 'pivot')
    staff = sum(1 for r in rows[:EMIT_TOP] if r['staffing'])
    out = {
        'generated': today.isoformat(),
        'scored': len(rows),
        'emitted': min(EMIT_TOP, len(rows)),
        'blocked_by_consent': blocked,
        'min_readiness': MIN_READY,
        'note': ('Company names and public posting URLs only — no personal data. '
                 'Contact discovery is a separate, licensed, per-domain step run on '
                 'this shortlist. mail_ok=false means prior consent is required in '
                 'every country this company posts from (DE/CA).'),
        'targets': rows[:EMIT_TOP],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    kb = os.path.getsize(OUT) // 1024
    print(f'outreach: {len(rows):,} companies scored, top {out["emitted"]:,} emitted '
          f'({blocked:,} consent-blocked) -> {OUT} ({kb}KB)')
    distinct = len({(r['pitch']['from_slug'], r['pitch']['role_slug']) for r in rows[:EMIT_TOP]})
    print(f'  of the emitted: {pivots:,} lead with a cross-industry pitch, {staff:,} flagged staffing, '
          f'{distinct:,} distinct pitches')
    for r in rows[:12]:
        p = r['pitch']
        print(f'  {r["score"]:>6}  {r["company"][:24]:<25} {r["adjacent_roles"]:>3} adj  '
              f'{p["from"][:17]:<18}-> {p["role"][:19]:<20} {p["readiness"]}% x{p["openings"]:<3} {p["kind"][:5]}')


if __name__ == '__main__':
    main()
