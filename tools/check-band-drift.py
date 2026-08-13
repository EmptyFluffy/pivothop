"""Catch salary bands quoted in editorial prose that have drifted from the corpus.

The FAQ and body copy in routes-data.tsx and salary-data.tsx quote bands as prose
("55,000 to 89,000 dollars"). Those are hand-written; the bands on the same page are
computed from packages/data/generated. Every nightly scrape moves the computed value
and the prose stays put, so the page ends up contradicting itself. That is the one
thing this site cannot afford, since the whole claim is that the numbers are measured.

Run: python3 tools/check-band-drift.py     (exit 1 if anything drifted)
Occupations the heuristic cannot identify from the sentence are reported separately;
those need a human, usually because the sentence compares two roles at once."""
import json, re, glob, os, sys

GEN = '/Users/carlos/PivotHop/packages/data/generated'
SRC = '/Users/carlos/PivotHop/apps/web/src/app'

# every role's computed band, keyed by lowercased title
bands = {}
for fp in glob.glob(os.path.join(GEN, '*.json')):
    try: d = json.load(open(fp))
    except Exception: continue
    for r in d.get('roles', []):
        b = r.get('salary_band')
        if isinstance(b, list) and len(b) >= 2 and r.get('title'):
            # compare against the band as DISPLAYED (nearest 1k, same as the salary string),
            # because a reader contradicts what they can see, not the raw float
            bands.setdefault(r['title'].strip().lower(),
                             (round(b[0] / 1000) * 1000, round(b[-1] / 1000) * 1000))

print(f'computed bands available for {len(bands)} occupations\n')

CLAIM = re.compile(r'([\d]{2,3}),000 to ([\d]{2,3}),000 dollar')
issues, checked = [], 0
for f in ['routes/routes-data.tsx', 'salary/salary-data.tsx']:
    path = os.path.join(SRC, f)
    for i, line in enumerate(open(path, encoding='utf-8'), 1):
        m = CLAIM.search(line)
        if not m: continue
        lo, hi = int(m.group(1)) * 1000, int(m.group(2)) * 1000
        # the occupation this sentence is about: first known title mentioned
        ctx = line.lower()
        hit = None
        for title in sorted(bands, key=len, reverse=True):
            if len(title) > 5 and title in ctx:
                hit = title; break
        checked += 1
        if not hit:
            issues.append((f, i, f'{lo//1000}k-{hi//1000}k', 'NO MATCHING OCCUPATION IN SENTENCE', ''))
            continue
        clo, chi = bands[hit]
        dl, dh = abs(lo - clo) / clo, abs(hi - chi) / chi
        if dl > 0.02 or dh > 0.02:
            issues.append((f, i, f'{lo//1000}k-{hi//1000}k', f'{hit}: computed {clo//1000}k-{chi//1000}k',
                           f'drift {dl:.0%}/{dh:.0%}'))

print(f'checked {checked} band claims, {len(issues)} disagree with the corpus:\n')
for f, i, claim, comp, drift in issues:
    print(f'  {f}:{i}\n     claims {claim}  |  {comp}  {drift}')
sys.exit(1 if issues else 0)
