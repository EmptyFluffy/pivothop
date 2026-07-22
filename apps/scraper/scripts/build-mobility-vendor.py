#!/usr/bin/env python3
"""Build the mobility vendor files from public-domain government sources.

Inputs (both blocked to curl at the live host by Akamai; the Internet Archive
raw-bytes URLs below serve the identical files and are the reliable path —
verified July 2026, see docs/18-mobility-data-catalog.md):

  1. BLS Employment Projections workbook (occupation.xlsx, 2024-34 vintage),
     sheet "Table 1.10": occupational separations — per-SOC annual labor force
     exit rate, occupational TRANSFER rate, and openings. Public domain (BLS).
  2. DOL OASP CTOT "CPS/SIPP Transitions" public-use CSV: 43,350 person-level
     observed occupation transitions (SIPP 2020 panel + CPS), survey-weighted
     (`reweight`), SOC-2018 hybrid codes. US-government work product published
     for public use. NOTE: the Emsi/Lightcast-derived CTOT files are NOT built
     here — redistribution license unresolved; they stay local-only.

Outputs:
  packages/data/vendor/bls-ep/separations.json
  packages/data/vendor/ctot/cps-sipp-transitions.json.gz
  + ATTRIBUTION.md in each

Run from the repo root: python3 apps/scraper/scripts/build-mobility-vendor.py
Raw files are cached in apps/scraper/cache/govdata/ (downloaded on first run).
"""
import csv, gzip, json, os, re, subprocess, sys, zipfile
from collections import defaultdict
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
VENDOR = os.path.join(ROOT, 'packages/data/vendor')
CACHE = os.path.join(ROOT, 'apps/scraper/cache/govdata')
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

BLS_URL = ('https://web.archive.org/web/20260612175342id_/'
           'https://www.bls.gov/emp/ind-occ-matrix/occupation.xlsx')
CTOT_URL = ('https://web.archive.org/web/20221017211231id_/'
            'https://www.dol.gov/sites/dolgov/files/OASP/evaluation/pdf/CPS-SIPP_dataset.csv')


def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f'fetching {os.path.basename(dest)} …')
    subprocess.run(['curl', '-sL', '--fail', '-o', dest, url], check=True)
    return dest


def sheet_rows_by_name(path, want_name):
    """Iterate rows of the sheet with the given display name (order shifts
    between BLS vintages — never select by position)."""
    z = zipfile.ZipFile(path)
    wb = ET.parse(z.open('xl/workbook.xml')).getroot()
    rels = ET.parse(z.open('xl/_rels/workbook.xml.rels')).getroot()
    rid_to_target = {r.get('Id'): r.get('Target') for r in rels}
    target = None
    for sh in wb.iter(NS + 'sheet'):
        if sh.get('name') == want_name:
            rid = sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            target = rid_to_target[rid]
    if not target:
        raise SystemExit(f'sheet "{want_name}" not found in {path}')
    if not target.startswith('xl/'):
        target = 'xl/' + target
    try:
        shared = [(''.join(t.text or '' for t in si.iter(NS + 't')))
                  for si in ET.parse(z.open('xl/sharedStrings.xml')).getroot()]
    except KeyError:
        shared = []
    for _ev, el in ET.iterparse(z.open(target)):
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


def fnum(x):
    if x in ('', None, '—', '-'):
        return None
    try:
        return float(x)
    except ValueError:
        return None


def build_bls():
    path = fetch(BLS_URL, os.path.join(CACHE, 'occupation.xlsx'))
    rows = list(sheet_rows_by_name(path, 'Table 1.10'))
    title = rows[0][0] if rows and rows[0] else ''
    m = re.search(r'projected (\d{4})[–-](\d{2,4})', title)
    vintage = f'{m.group(1)}-{m.group(2)}' if m else 'unknown'
    socs, total = {}, None
    for r in rows[2:]:
        if len(r) < 10:
            continue
        name, code, kind = r[0], r[1], r[2]
        if not re.match(r'^\d{2}-\d{4}$', str(code)):
            continue
        entry = {
            'title': name,
            'exit': fnum(r[7]),       # labor force exit rate, annual avg %
            'transfer': fnum(r[8]),   # occupational transfer rate, annual avg %
            'total': fnum(r[9]),      # total separations rate, annual avg %
            'openings': fnum(r[13]) if len(r) > 13 else None,  # thousands
        }
        if code == '00-0000':
            total = entry
        elif kind == 'Line item':
            socs[code] = entry
    out_dir = os.path.join(VENDOR, 'bls-ep')
    os.makedirs(out_dir, exist_ok=True)
    json.dump({'source': f'BLS Employment Projections, Table 1.10 ({title.strip()})',
               'vintage': vintage, 'url': BLS_URL, 'all_occupations': total, 'socs': socs},
              open(os.path.join(out_dir, 'separations.json'), 'w'))
    with open(os.path.join(out_dir, 'ATTRIBUTION.md'), 'w') as fh:
        fh.write(f"""# BLS Employment Projections — Table 1.10

Occupational separations and openings, projected {vintage}: per-SOC annual
average labor force exit rate, occupational transfer rate, total separations
rate, and occupational openings. {len(socs)} detailed occupations.

- Producer: U.S. Bureau of Labor Statistics, Employment Projections program.
- Retrieved via Internet Archive raw-bytes mirror (live host blocks scripted
  clients): {BLS_URL}
- License: BLS-published material is in the public domain (U.S. government work).
- The occupational transfer rate is the share of workers projected to LEAVE the
  occupation for a different occupation in an average year — a per-origin base
  rate with no destination breakdown. Destinations come from the flow sources.
""")
    print(f'bls-ep: {len(socs)} detailed SOCs, vintage {vintage} '
          f"(all-occ transfer {total['transfer']}%, exit {total['exit']}%)")
    return socs


def build_ctot():
    path = fetch(CTOT_URL, os.path.join(CACHE, 'cps_sipp.csv'))
    pairs = defaultdict(lambda: [0.0, 0])  # (from, to) -> [weight sum, n]
    n_rows = 0
    for row in csv.DictReader(open(path)):
        src, dst = row.get('soc_SRCE', ''), row.get('soc_DEST', '')
        if not src or not dst or src == dst:
            continue
        w = fnum(row.get('reweight')) or 0.0
        if w <= 0:
            continue
        p = pairs[(src, dst)]
        p[0] += w
        p[1] += 1
        n_rows += 1
    out_dir = os.path.join(VENDOR, 'ctot')
    os.makedirs(out_dir, exist_ok=True)
    payload = {
        'source': 'DOL OASP, Career Trajectories and Occupational Transitions (CTOT) — CPS/SIPP Transitions public-use dataset (Dec 2021)',
        'url': CTOT_URL,
        'unit': 'survey-weighted person transitions, aggregated by (soc_SRCE, soc_DEST); w = summed reweight, n = unweighted count',
        'note': 'origin occupations restricted to mid-level (beyond HS, below bachelor’s); destinations unrestricted; SOC-2018 hybrid codes at detailed/broad/masked (X) levels',
        'pairs': [[f, t, round(w, 4), n] for (f, t), (w, n) in sorted(pairs.items())],
    }
    with gzip.open(os.path.join(out_dir, 'cps-sipp-transitions.json.gz'), 'wt') as fh:
        json.dump(payload, fh)
    with open(os.path.join(out_dir, 'ATTRIBUTION.md'), 'w') as fh:
        fh.write(f"""# DOL CTOT — CPS/SIPP Transitions (public use)

Observed occupation-to-occupation transitions from the Career Trajectories and
Occupational Transitions study (DOL Office of the Assistant Secretary for
Policy, December 2021): person-level CPS + SIPP records with survey weights,
aggregated here to SOC-pair weight/count cells ({len(pairs)} pairs from
{n_rows} usable person transitions).

- Producer: U.S. Department of Labor, OASP (a U.S. government work published
  as a public-use dataset; the underlying surveys are Census Bureau products).
- Retrieved via Internet Archive raw-bytes mirror (the live DOL listing was
  removed between 2022 and 2026): {CTOT_URL}
- Scope caveat: ORIGIN occupations are restricted to "mid-level" (beyond high
  school, below a four-year degree). Destinations are unrestricted. Treat as
  corroboration for covered origins, never as evidence of absence.
- The separate Emsi/Lightcast-derived CTOT files are deliberately NOT vendored:
  their commercial-redistribution license is unresolved (see docs/18).
""")
    print(f'ctot: {len(pairs)} SOC pairs from {n_rows} person transitions')


if __name__ == '__main__':
    build_bls()
    build_ctot()
    sys.exit(0)
