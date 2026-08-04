#!/usr/bin/env python3
"""Swiss official wage bands from the BFS Lohnstrukturerhebung (LSE).

WHY THIS SOURCE. Swiss job ads famously do not post pay — 0 of 31,096 Job-Room
ads carry a salary — so posted-salary bands can never exist for CH. The Swiss
dossier (docs/32) chose the anchor instead: the federal wage-structure survey,
official, public, per occupation group and percentile. For Swiss credibility
"the federal statistics say" beats "N postings state pay".

WHAT IT FETCHES. STAT-TAB cube px-x-0304010000_205: standardized gross monthly
wage (full-time equivalent, 13th salary pro-rata included) by ISCO-08 occupation
group x percentile (P10/P25/median/P75/P90), Switzerland total, all ages, all
genders, latest survey year. One request, ~240 cells.

HOW IT JOINS. Our taxonomy already carries slug -> ISCO-08 4-digit
(isco-crosswalk.json, built for the EU mobility join); the LSE publishes at
2-digit groups, so the join is first-two-digits — honest but coarser than the
occupation, and the UI says so ("the federal band for the whole group").

Output: apps/web/public/data/salaries-ch.json. Wired into daily-run/ci-run
weekly-cheap: the survey updates every two years, so the nightly cost is one
cached request. Run manually: python3 apps/scraper/scripts/build-salary-ch.py
"""
import json
import ssl
import subprocess
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CUBE = "px-x-0304010000_205"
API = f"https://www.pxweb.bfs.admin.ch/api/v1/de/{CUBE}/{CUBE}.px"
UA = {"User-Agent": "PivotHopScraper/0.1 (contact: hello@pivothop.com)", "Content-Type": "application/json"}
OUT = REPO / "apps/web/public/data/salaries-ch.json"
XWALK = REPO / "packages/data/taxonomy/isco-crosswalk.json"

def fetch(url, body=None):
    """urllib first; fall back to curl when the local Python lacks CA certs
    (the framework build on macOS ships without them — CI is unaffected)."""
    try:
        ctx = None
        try:
            import certifi  # noqa: PLC0415
            ctx = ssl.create_default_context(cafile=certifi.where())
        except ImportError:
            pass
        req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers=UA)
        with urllib.request.urlopen(req, timeout=45, context=ctx) as r:
            return json.loads(r.read().decode("utf-8-sig"))
    except Exception:
        cmd = ["curl", "-s", "--max-time", "45", "-H", f"User-Agent: {UA['User-Agent']}"]
        if body is not None:
            cmd += ["-X", "POST", "-H", "Content-Type: application/json", "-d", json.dumps(body)]
        cmd.append(url)
        out = subprocess.run(cmd, capture_output=True, check=True).stdout
        return json.loads(out.decode("utf-8-sig"))

meta = fetch(API)
dims = {v["code"]: v for v in meta["variables"]}
year = max(dims["Jahr"]["values"])                                # latest survey
groups = dict(zip(dims["Berufsgruppe"]["values"], dims["Berufsgruppe"]["valueTexts"]))
PCTL = {"1": "p50", "2": "p10", "3": "p25", "4": "p75", "5": "p90"}

data = fetch(API, {
    "query": [
        {"code": "Jahr", "selection": {"filter": "item", "values": [year]}},
        {"code": "Grossregion", "selection": {"filter": "item", "values": ["-1"]}},
        {"code": "Lebensalter", "selection": {"filter": "item", "values": ["-1"]}},
        {"code": "Geschlecht", "selection": {"filter": "item", "values": ["-1"]}},
    ],
    "response": {"format": "json"},
})

bands: dict = {}
for row in data["data"]:
    _, _, grp, _, _, pc = row["key"]
    val = row["values"][0]
    if val in ("...", '"..."', ".", "-"):     # BFS suppression markers
        continue
    label = groups.get(grp, grp)
    # keep 2-digit ISCO groups + the total; drop 1-digit majors (too coarse to join)
    code = grp if grp == "-1" else (grp[:2] if len(grp) >= 2 else None)
    if grp != "-1" and len(grp) != 2:
        continue
    bands.setdefault(grp, {"label_de": label.lstrip("> ").strip(), "month": {}})
    bands[grp]["month"][PCTL[pc]] = int(float(val))

total = bands.pop("-1", None)
# drop groups the BFS suppressed below full percentiles
bands = {k: v for k, v in bands.items() if len(v["month"]) == 5}

xwalk = json.loads(XWALK.read_text())["map"]
by_slug = {}
for slug, isco4 in xwalk.items():
    if not isco4:
        continue
    g = str(isco4)[:2]
    if g in bands:
        by_slug[slug] = g

out = {
    "updated": __import__("datetime").date.today().isoformat(),
    "year": int(year),
    "source": {
        "name": f"BFS Lohnstrukturerhebung (LSE) {year}",
        "cube": CUBE,
        "url": "https://www.bfs.admin.ch/bfs/de/home/statistiken/arbeit-erwerb/loehne-erwerbseinkommen-arbeitskosten.html",
        "note": "Standardisierter monatlicher Bruttolohn, Vollzeitäquivalent, 13. Monatslohn anteilig enthalten. Schweiz gesamt, alle Altersgruppen, alle Geschlechter.",
    },
    "total": total,
    "groups": bands,
    "by_slug": by_slug,
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
print(f"salaries-ch: LSE {year}, {len(bands)} ISCO groups with full bands, {len(by_slug)} occupations joined -> {OUT.name}")
print(f"  CH total median CHF {total['month']['p50']:,}/Monat" if total else "  (no total)")
