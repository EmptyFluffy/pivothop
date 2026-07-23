#!/usr/bin/env python3
"""Build the OEWS annual wage history (the salary-board trend line).

Parses the BLS OEWS national files for 2019-2024 (SOC-2018 native, so no
crosswalk needed; a clean window that spans before/after the AI wave) into a
compact per-SOC, per-year table. 2016-2018 are SOC-2010 and skipped to avoid
crosswalk noise. Files are the public-domain OEWS national releases, recovered
via Internet Archive (bls.gov blocks scripted clients); raw copies are vendored
under packages/data/vendor/oews-history/ for reproducibility.

Output: packages/data/vendor/oews-history/national.json
  { "years": [2019,...,2024], "socs": { "15-1255": { "2019": {p25,p50,p75,emp}, ... } } }

Run from repo root: python3 apps/scraper/scripts/build-salary-history.py [--src DIR]
"""
import json, os, re, sys, zipfile
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
VENDOR = os.path.join(ROOT, 'packages/data/vendor/oews-history')
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
YEARS = [2019, 2020, 2021, 2022, 2023, 2024]
CAP = 208000  # OEWS suppresses very high annual wages as "#"; treat as the cap


def _colidx(ref):
    # 'A'->0, 'B'->1, ... 'AA'->26 from a cell reference like 'AB12'
    letters = re.match(r'[A-Z]+', ref or '').group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def rows(xlsx):
    z = zipfile.ZipFile(xlsx)
    shared = []
    try:
        shared = [(''.join(t.text or '' for t in si.iter(NS + 't')))
                  for si in ET.parse(z.open('xl/sharedStrings.xml')).getroot()]
    except KeyError:
        pass
    sheet = [n for n in z.namelist() if re.match(r'xl/worksheets/sheet1\.xml', n)][0]
    for _ev, el in ET.iterparse(z.open(sheet)):
        if el.tag == NS + 'row':
            # Respect each cell's column reference — XLSX omits empty cells, so
            # positional append would shift a sparse row (this is what corrupted
            # the 2019 long-schema file).
            cells = {}
            maxi = -1
            for c in el:
                i = _colidx(c.get('r', ''))
                v = c.find(NS + 'v')
                cells[i] = '' if v is None else (shared[int(v.text)] if c.get('t') == 's' else v.text)
                maxi = max(maxi, i)
            yield [cells.get(i, '') for i in range(maxi + 1)]
            el.clear()


def num(x):
    if x in ('', '*', None):
        return None
    if x == '#':
        return CAP
    try:
        return round(float(str(x).replace(',', '')))
    except ValueError:
        return None


def parse_year(path):
    it = rows(path)
    header = [h.strip().lower() for h in next(it)]
    idx = {name: header.index(name) for name in header}
    ci = idx.get('occ_code'); og = idx.get('o_group'); grp = idx.get('group')
    gi = og if og is not None else grp
    p25 = idx.get('a_pct25'); med = idx.get('a_median'); p75 = idx.get('a_pct75'); emp = idx.get('tot_emp')
    out = {}
    for r in it:
        if ci is None or ci >= len(r):
            continue
        code = (r[ci] or '').strip()
        if not re.match(r'^\d{2}-\d{4}$', code):
            continue
        if gi is not None and gi < len(r) and (r[gi] or '').strip().lower() not in ('detailed', ''):
            continue
        cell = {'p25': num(r[p25]) if p25 is not None else None,
                'p50': num(r[med]) if med is not None else None,
                'p75': num(r[p75]) if p75 is not None else None,
                'emp': num(r[emp]) if emp is not None else None}
        if cell['p50'] is not None:
            out[code] = cell
    return out


def main():
    src = VENDOR
    if '--src' in sys.argv:
        src = sys.argv[sys.argv.index('--src') + 1]
    socs = {}
    got = []
    for y in YEARS:
        cands = [os.path.join(src, f'national_M{y}.xlsx'),
                 os.path.join(src, f'national_M{y}_dl.xlsx')]
        path = next((c for c in cands if os.path.exists(c)), None)
        if not path:
            print(f'  {y}: file not found, skipped')
            continue
        yd = parse_year(path)
        got.append(y)
        for code, cell in yd.items():
            socs.setdefault(code, {})[str(y)] = cell
        print(f'  {y}: {len(yd)} detailed occupations')
    os.makedirs(VENDOR, exist_ok=True)
    json.dump({'years': got, 'socs': socs}, open(os.path.join(VENDOR, 'national.json'), 'w'))
    with open(os.path.join(VENDOR, 'ATTRIBUTION.md'), 'w') as fh:
        fh.write(f"""# BLS OEWS annual national wage history

Occupational Employment and Wage Statistics national files, May {got[0]}-{got[-1]},
25th/50th/75th annual wage percentiles and employment per detailed SOC-2018
occupation. The salary-board trend line.

- Producer: U.S. Bureau of Labor Statistics. Public domain.
- Retrieved via Internet Archive raw-bytes mirrors (bls.gov blocks scripted
  clients). Raw national_M{{year}}.xlsx files vendored alongside this file.
- SOC-2018 native ({got[0]}+); 2016-2018 (SOC-2010) intentionally excluded to
  avoid crosswalk noise. "#" (suppressed high wage) treated as the {CAP} cap.
""")
    print(f'oews-history: {len(socs)} SOCs across {got}')


if __name__ == '__main__':
    main()
