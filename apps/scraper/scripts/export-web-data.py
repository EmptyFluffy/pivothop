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

    # FairElephant: salary bands + price levels
    sal_src = os.path.join(GEN, 'salaries')
    if os.path.isdir(sal_src):
        sal_out = os.path.join(OUT, 'salaries')
        os.makedirs(sal_out, exist_ok=True)
        for f in os.listdir(sal_src):
            shutil.copy(os.path.join(sal_src, f), os.path.join(sal_out, f))
    pl = os.path.join(ROOT, 'packages/data/vendor/worldbank/price-levels.json')
    if os.path.exists(pl):
        shutil.copy(pl, os.path.join(OUT, 'price-levels.json'))

    # The adjacency field (landing cloud): whole-network nodes/edges + live stats.
    # Positions persist across rebuilds keyed by title — dots must not jump from
    # one night to the next. Only new occupations get seeded (at their neighbors'
    # centroid) and relaxed; the existing constellation stays frozen.
    CLOUD_W, CLOUD_H, CLOUD_FLOOR = 900, 520, 13
    cloud_path = os.path.join(OUT, 'cloud.json')
    cloud_prev = {}
    if os.path.exists(cloud_path):
        try:
            pc = json.load(open(cloud_path))
            cloud_prev = {t: pc['p'][i] for i, (t, _c) in enumerate(pc['n'])}
        except Exception:
            cloud_prev = {}
    adj_origins = json.load(open(os.path.join(ROOT, 'apps/scraper/data/adjacency.json')))['origins']
    nodes = sorted((o['title'], o['slug']) for o in occ if agg.get(o['slug'], {}).get('count', 0) > 0)
    nidx = {slug: i for i, (_t, slug) in enumerate(nodes)}
    epairs = {}
    for origin, dests in adj_origins.items():
        if origin not in nidx: continue
        for x in dests:
            j = nidx.get(x['dest'])
            if j is None or x['match'] < CLOUD_FLOOR: continue
            a, b = sorted((nidx[origin], j))
            if a == b: continue
            w = round(x['match'] / 100, 2)
            if w > epairs.get((a, b), 0): epairs[(a, b)] = w
    cedges = [[a, b, w] for (a, b), w in sorted(epairs.items())]
    cdeg = [0] * len(nodes)
    for a, b, _w in cedges:
        cdeg[a] += 1; cdeg[b] += 1
    import random
    rnd = random.Random(47)
    cpos, new_nodes = [], []
    for i, (title, _slug) in enumerate(nodes):
        if title in cloud_prev: cpos.append([float(cloud_prev[title][0]), float(cloud_prev[title][1])])
        else: cpos.append(None); new_nodes.append(i)
    nbrs = {i: [] for i in new_nodes}
    for a, b, w in cedges:
        if a in nbrs: nbrs[a].append((b, w))
        if b in nbrs: nbrs[b].append((a, w))
    for i in new_nodes:
        anchored = [(cpos[j], w) for j, w in nbrs[i] if cpos[j]]
        if anchored:
            sw = sum(w for _p, w in anchored) or 1
            x = sum(p[0] * w for p, w in anchored) / sw + rnd.uniform(-40, 40)
            y = sum(p[1] * w for p, w in anchored) / sw + rnd.uniform(-40, 40)
        else:
            x, y = CLOUD_W / 2 + rnd.uniform(-150, 150), CLOUD_H / 2 + rnd.uniform(-90, 90)
        cpos[i] = [x, y]
    for _step in range(160):  # relax only the new nodes against the frozen field
        for i in new_nodes:
            xi, yi = cpos[i]; fx = fy = 0.0
            for j in range(len(nodes)):
                if j == i: continue
                dx, dy = xi - cpos[j][0], yi - cpos[j][1]
                d2 = dx * dx + dy * dy + 0.01
                if d2 < 2500:
                    f = 900 / d2
                    fx += dx * f; fy += dy * f
            for j, w in nbrs[i]:
                fx += (cpos[j][0] - xi) * 0.02 * w
                fy += (cpos[j][1] - yi) * 0.02 * w
            cpos[i][0] = min(CLOUD_W - 20, max(20, xi + fx * 0.5))
            cpos[i][1] = min(CLOUD_H - 20, max(20, yi + fy * 0.5))
    cloud = {
        'p': [[round(x, 1), round(y, 1)] for x, y in cpos],
        'd': cdeg,
        'e': cedges,
        'n': [[title, agg[slug]['count']] for title, slug in nodes],
        'stats': {'occupations': len(nodes),
                  'postings': sum(agg[slug]['count'] for _t, slug in nodes),
                  'connections': len(cedges)},
    }
    json.dump(cloud, open(cloud_path, 'w'))
    print(f"cloud: {len(nodes)} dots · {len(cedges)} edges · {cloud['stats']['postings']} postings ({len(new_nodes)} newly placed)")

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
