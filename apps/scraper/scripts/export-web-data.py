#!/usr/bin/env python3
"""Export generated route data + taxonomy into apps/web/public/data/.

Run from the repo root after `npm run scrape -- emit`:
  python3 apps/scraper/scripts/export-web-data.py

Writes:
  {slug}.json          per-origin graph payload (only origins with routes)
  origins.json         all 148 occupations for the typeahead (ok flag + synonyms)
  skill-profiles.json  top-20 skill shares per occupation (floors applied) for personalization
  occ-meta.json        title/field/cluster/desc/salary/demand/remote/license per occupation
  skills-meta.json     skill id -> display name
  skill-cooccur.json   copied from packages/data/generated
"""
import json, glob, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
GEN = os.path.join(ROOT, 'packages/data/generated')
TAX = os.path.join(ROOT, 'packages/data/taxonomy')
OUT = os.path.join(ROOT, 'apps/web/public/data')
AGG = os.path.join(ROOT, 'apps/scraper/data/aggregates.json')
SKIP = {'index.json', 'skill-cooccur.json', 'demand-adjacency.json', 'reddit-transitions.json'}

MIN_COUNT = 30      # match the adjacency destination floors
MIN_DEN = 0.5

def to_data(g):
    roles = [{'id': r['id'], 'desc': r.get('desc', ''), 'title': r['title'], 'field': r.get('field', ''),
              'match': r['match'], 'salary': r.get('salary') or '—', 'demand': r.get('demand', ''),
              'remote': r.get('remote', ''), 'time': r.get('time', ''), 'have': r.get('have', []),
              'learn': r.get('learn', []), 'fit': r.get('fit'), 'capability': r.get('capability'),
              'mobility': r.get('mobility'), 'mobility_source': r.get('mobility_source'),
              'mobility_eu': r.get('mobility_eu'), 'kind': r.get('kind'), 'cluster': r.get('cluster'),
              'license': r.get('license')} for r in g['roles']]
    def kid(k):
        out = {'t': k['t'], 'm': k['m'], 'slug': k.get('slug'), 'gap': k.get('gap', [])}
        via = k.get('via')
        if via and via.get('readiness_after') is not None:
            out['after'] = via['readiness_after']
        return out
    nxt = {r['id']: [kid(k) for k in g.get('next', {}).get(r['id'], [])] for r in g['roles']}
    o = g['origin']
    return {'originLabel': o['title'], 'originSlug': o['slug'], 'field': o.get('field', ''),
            'postings': o.get('postings', 0), 'salary': o.get('salary'), 'roles': roles, 'next': nxt,
            'cross': g.get('cross', []), 'bridges': g.get('bridges', [])}

def fmt_sal(p25, p75):
    if not p25 or not p75: return None
    k = lambda v: f'${round(v / 5000) * 5}k'
    return f'{k(p25)}–{k(p75)}'

def demand(c):
    return 'High' if c >= 300 else 'Moderate' if c >= 75 else 'Low'

def main():
    os.makedirs(OUT, exist_ok=True)
    occ = json.load(open(os.path.join(TAX, 'occupations.json')))['occupations']
    skills = {s['id']: s['name'] for s in json.load(open(os.path.join(TAX, 'skills.json')))['skills']}
    agg = json.load(open(AGG))['roles']
    fresh = {o['slug']: o for o in json.load(open(os.path.join(GEN, 'index.json')))['origins']}

    n = 0
    for f in glob.glob(os.path.join(GEN, '*.json')):
        if os.path.basename(f) in SKIP: continue
        g = json.load(open(f))
        if g.get('insufficient') or not g.get('roles'): continue
        d = to_data(g)
        json.dump(d, open(os.path.join(OUT, f"{d['originSlug']}.json"), 'w'), ensure_ascii=False)
        n += 1

    index = []
    for o in occ:
        fo = fresh.get(o['slug'], {})
        index.append({'slug': o['slug'], 'title': o['title'], 'field': o.get('field', ''),
                      'postings': fo.get('postings', 0), 'ok': bool(fo) and not fo.get('insufficient'),
                      'syn': [s.lower() for s in (o.get('synonyms', []) + o.get('exactOnly', []))][:14]})
    index.sort(key=lambda x: (not x['ok'], -x['postings']))
    json.dump({'origins': index}, open(os.path.join(OUT, 'origins.json'), 'w'), ensure_ascii=False)

    profiles, meta = {}, {}
    for o in occ:
        slug = o['slug']; a = agg.get(slug)
        if not a or a['count'] < MIN_COUNT: continue
        tops = {t['id']: t['share'] for t in a.get('top_skills', [])}
        den = sum(tops.values())
        if len(tops) < 5 or den < MIN_DEN: continue
        profiles[slug] = {'s': tops, 'den': round(den, 4)}
        meta[slug] = {'title': o['title'], 'field': o.get('field', ''), 'cluster': o.get('cluster'),
                      'desc': o.get('desc', ''), 'salary': fmt_sal(a.get('salary_p25'), a.get('salary_p75')),
                      'demand': demand(a['count']), 'remote': f"{round(a.get('remote_share', 0) * 100)}%",
                      'postings': a['count'], 'license': o.get('license')}
    json.dump({'profiles': profiles}, open(os.path.join(OUT, 'skill-profiles.json'), 'w'))
    json.dump({'meta': meta}, open(os.path.join(OUT, 'occ-meta.json'), 'w'))
    json.dump({'names': skills}, open(os.path.join(OUT, 'skills-meta.json'), 'w'))
    shutil.copy(os.path.join(GEN, 'skill-cooccur.json'), os.path.join(OUT, 'skill-cooccur.json'))

    # initial architect payload baked into the app bundle
    g = json.load(open(os.path.join(GEN, 'architect.json')))
    d = to_data(g)
    with open(os.path.join(ROOT, 'apps/web/src/lib/data.js'), 'w') as fh:
        fh.write('// Initial origin (Architect); other origins load from /data/{slug}.json.\n')
        fh.write('// Regenerate with: python3 apps/scraper/scripts/export-web-data.py\n')
        fh.write('export const DATA = ' + json.dumps(d, ensure_ascii=False) + ';\n')

    print(f'{n} origin files · {len(index)} in typeahead ({sum(1 for i in index if i["ok"])} ok) · {len(profiles)} rankable profiles')

if __name__ == '__main__':
    sys.exit(main())
