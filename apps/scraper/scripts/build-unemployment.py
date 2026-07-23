#!/usr/bin/env python3
"""Build the per-occupation unemployment rate lookup for the salary board.

Source: BLS CPS Household Data Annual Averages Table 25b (2025), unemployment
rate by detailed occupation, vendored at packages/data/vendor/cps-unemployment/
cpsaat25b.csv. The table carries no SOC code, so occupations are joined by title
(a curated map for the ones we surface, plus a normalized-title fallback).

Output: packages/data/vendor/cps-unemployment/rates.json
  { "year": 2025, "slugs": { "software-engineer": {"rate": 3.3, "label": "Software developers"} } }

Run from repo root: python3 apps/scraper/scripts/build-unemployment.py
"""
import csv, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
VENDOR = os.path.join(ROOT, 'packages/data/vendor/cps-unemployment')
TAX = os.path.join(ROOT, 'packages/data/taxonomy/occupations.json')

# Curated slug -> exact CPS occupation_label (verified against cpsaat25b). These
# are the occupations we display or are likely to; the rest fall back to a
# normalized-title match.
OVERRIDE = {
    'software-engineer': 'Software developers',
    'data-scientist': 'Other mathematical science occupations',
    'registered-nurse': 'Registered nurses',
    'accountant': 'Accountants and auditors',
    'product-manager': 'Marketing managers',
    'ux-designer': 'Web and digital interface designers',
    'ux-researcher': 'Web and digital interface designers',
    'marketing-manager': 'Marketing managers',
    'graphic-designer': 'Graphic designers',
    'interior-designer': 'Interior designers',
    'lawyer': 'Lawyers',
    'paralegal': 'Paralegals and legal assistants',
    'management-consultant': 'Management analysts',
    'business-analyst': 'Management analysts',
    'financial-analyst': 'Financial and investment analysts',
    'data-analyst': 'Other mathematical science occupations',
    'data-engineer': 'Database administrators and architects',
    'database-administrator': 'Database administrators and architects',
    'machine-learning-engineer': 'Software developers',
    'ai-engineer': 'Software developers',
    'frontend-developer': 'Software developers',
    'backend-developer': 'Software developers',
    'mobile-developer': 'Software developers',
    'qa-engineer': 'Software quality assurance analysts and testers',
    'solutions-architect': 'Software developers',
    'registered-dietitian': 'Dietitians and nutritionists',
    'dietitian': 'Dietitians and nutritionists',
    'physical-therapist': 'Physical therapists',
    'pharmacist': 'Pharmacists',
    'teacher': 'Elementary and middle school teachers',
    'social-worker': 'Social workers',
    'civil-engineer': 'Civil engineers',
    'mechanical-engineer': 'Mechanical engineers',
    'electrical-engineer': 'Electrical and electronics engineers',
    'architect': 'Architects, except landscape and naval',
    'project-manager': 'Project management specialists',
}


def norm(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    s = re.sub(r'\bengineers?\b', 'engineer', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def rate_val(x):
    x = (x or '').strip()
    if x in ('', '-', '–', '—', '(1)'):
        return None
    try:
        return round(float(x), 1)
    except ValueError:
        return None


def main():
    rows = list(csv.DictReader(open(os.path.join(VENDOR, 'cpsaat25b.csv'))))
    by_label = {}
    by_norm = {}
    for r in rows:
        lab = (r.get('occupation_label') or '').strip()
        rate = rate_val(r.get('unemployment_rate'))
        if not lab or rate is None:
            continue
        by_label[lab] = rate
        by_norm.setdefault(norm(lab), (rate, lab))

    occ = json.load(open(TAX))['occupations']
    out, matched, fell_back = {}, 0, 0
    for o in occ:
        slug, title = o['slug'], o['title']
        rate = label = None
        if slug in OVERRIDE and OVERRIDE[slug] in by_label:
            label = OVERRIDE[slug]; rate = by_label[label]; matched += 1
        else:
            # normalized-title fallback: exact, then singular, then our title as a
            # prefix of a CPS label (e.g. "Accountant" -> "Accountants and auditors")
            nt = norm(title)
            hit = by_norm.get(nt) or by_norm.get(nt + 's') or by_norm.get(re.sub(r's$', '', nt))
            if not hit:
                for nl, (rr, ll) in by_norm.items():
                    if nl.startswith(nt + ' ') or nl == nt:
                        hit = (rr, ll); break
            if hit:
                rate, label = hit[0], hit[1]; fell_back += 1
        if rate is not None:
            out[slug] = {'rate': rate, 'label': label}

    os.makedirs(VENDOR, exist_ok=True)
    json.dump({'year': 2025, 'slugs': out}, open(os.path.join(VENDOR, 'rates.json'), 'w'))
    print(f'unemployment: {len(out)} occupations ({matched} curated, {fell_back} title-matched)')
    for slug in ('software-engineer', 'data-scientist', 'registered-nurse', 'accountant', 'product-manager', 'ux-designer'):
        print(f'  {slug}: {out.get(slug)}')


if __name__ == '__main__':
    main()
