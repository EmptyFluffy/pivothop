#!/usr/bin/env python3
"""Build FairElephant's official salary anchors into packages/data/vendor/.

Inputs (public domain / open):
  - BLS OEWS May 2024 national + state Excel files (US wage percentiles by SOC)
    pass their directory via --oews DIR (files: national_M2024_dl.xlsx, state_M2024_dl.xlsx)
  - World Bank API (keyless): PPP conversion factors + official FX -> price level index

Outputs:
  packages/data/vendor/oews/wages.json      {soc: {US:{p10,p25,p50,p75,p90,emp}, states:{XX:{...}}}}
  packages/data/vendor/worldbank/price-levels.json  {ISO2: {ppp, fx, price_level, year}}
  + ATTRIBUTION.md in each
"""
import json, os, re, sys, zipfile
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
TAX = os.path.join(ROOT, 'packages/data/taxonomy/occupations.json')
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

def our_socs():
    occ = json.load(open(TAX))['occupations']
    socs = {}
    for o in occ:
        s = o.get('soc')
        if s:
            socs.setdefault(s.split('.')[0], []).append(o['slug'])
    return socs

def iter_xlsx_rows(path):
    z = zipfile.ZipFile(path)
    try:
        shared = [(''.join(t.text or '' for t in si.iter(NS + 't')))
                  for si in ET.parse(z.open('xl/sharedStrings.xml')).getroot()]
    except KeyError:
        shared = []
    sheet = [n for n in z.namelist() if re.match(r'xl/worksheets/sheet1\.xml', n)][0]
    for ev, el in ET.iterparse(z.open(sheet)):
        if el.tag == NS + 'row':
            vals = []
            for c in el:
                v = c.find(NS + 'v')
                if v is None:
                    vals.append('')
                elif c.get('t') == 's':
                    vals.append(shared[int(v.text)])
                else:
                    vals.append(v.text)
            yield vals
            el.clear()

def num(x):
    if x in ('', '*', '#', None): return None
    try: return round(float(x))
    except ValueError: return None

def parse_oews(path, socs, want_states):
    header = None
    out = {}
    for row in iter_xlsx_rows(path):
        if header is None:
            header = {h: i for i, h in enumerate(row)}
            gi = lambda r, k: r[header[k]] if header.get(k) is not None and header[k] < len(r) else ''
            continue
        occ = gi(row, 'OCC_CODE')
        if occ not in socs: continue
        if gi(row, 'O_GROUP') not in ('detailed', ''): continue
        rec = {'p10': num(gi(row, 'A_PCT10')), 'p25': num(gi(row, 'A_PCT25')),
               'p50': num(gi(row, 'A_MEDIAN')), 'p75': num(gi(row, 'A_PCT75')),
               'p90': num(gi(row, 'A_PCT90')), 'emp': num(gi(row, 'TOT_EMP'))}
        if rec['p50'] is None: continue
        if want_states:
            st = gi(row, 'PRIM_STATE')
            if st and st != 'US':
                out.setdefault(occ, {})[st] = rec
        else:
            out[occ] = rec
    return out

def fetch_worldbank():
    import subprocess
    def grab(ind):
        url = f'https://api.worldbank.org/v2/country/all/indicator/{ind}?format=json&per_page=400&date=2023'
        raw = subprocess.run(['curl', '-s', url], capture_output=True, timeout=90).stdout
        data = json.loads(raw)
        return {row['country']['id']: row['value'] for row in data[1] if row['value'] is not None}
    ppp = grab('PA.NUS.PPP')
    fx = grab('PA.NUS.FCRF')
    out = {}
    for iso2, p in ppp.items():
        f = fx.get(iso2) or (1.0 if iso2 == 'US' else None)
        # euro-area members report no FCRF; EMU rate covers them
        if f is None and iso2 in ('DE','FR','ES','IT','NL','AT','BE','PT','IE','FI','GR','LU','SK','SI','EE','LV','LT','CY','MT'):
            f = fx.get('XC')
        if not f: continue
        out[iso2] = {'ppp': round(p, 4), 'fx': round(f, 4),
                     'price_level': round(p / f, 4), 'year': 2023}
    return out

def main():
    oews_dir = sys.argv[sys.argv.index('--oews') + 1] if '--oews' in sys.argv else None
    socs = our_socs()
    print(f'{len(socs)} distinct SOC codes across taxonomy')

    if oews_dir:
        nat = parse_oews(os.path.join(oews_dir, 'oesm24nat/national_M2024_dl.xlsx'), socs, False)
        st = parse_oews(os.path.join(oews_dir, 'oesm24st/state_M2024_dl.xlsx'), socs, True)
        wages = {soc: {'US': nat.get(soc), 'states': st.get(soc, {})} for soc in socs if nat.get(soc)}
        os.makedirs(os.path.join(ROOT, 'packages/data/vendor/oews'), exist_ok=True)
        json.dump({'source': 'BLS OEWS May 2024', 'wages': wages},
                  open(os.path.join(ROOT, 'packages/data/vendor/oews/wages.json'), 'w'))
        with open(os.path.join(ROOT, 'packages/data/vendor/oews/ATTRIBUTION.md'), 'w') as f:
            f.write('# BLS OEWS\n\nOccupational Employment and Wage Statistics, May 2024.\n'
                    'U.S. Bureau of Labor Statistics. Public domain (US federal work).\n'
                    'https://www.bls.gov/oes/  Annual wage percentiles by SOC, national and by state.\n')
        cov = sum(1 for s in wages if wages[s].get('states'))
        print(f'oews: {len(wages)} SOCs with national bands, {cov} with state bands')

    wb = fetch_worldbank()
    os.makedirs(os.path.join(ROOT, 'packages/data/vendor/worldbank'), exist_ok=True)
    json.dump({'source': 'World Bank ICP', 'levels': wb},
              open(os.path.join(ROOT, 'packages/data/vendor/worldbank/price-levels.json'), 'w'))
    with open(os.path.join(ROOT, 'packages/data/vendor/worldbank/ATTRIBUTION.md'), 'w') as f:
        f.write('# World Bank price levels\n\nPPP conversion factors (PA.NUS.PPP) and official\n'
                'exchange rates (PA.NUS.FCRF), 2023. World Bank Open Data, CC BY 4.0.\n'
                'price_level = PPP / FX (US = 1.0).\n')
    print(f'worldbank: {len(wb)} countries with price levels')

if __name__ == '__main__':
    main()
