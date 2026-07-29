#!/usr/bin/env bash
# Nightly gated pipeline for GitHub Actions (docs/23 Phase B). Portable twin of
# daily-run.sh: relative paths, CI git identity, publish = git push (Vercel's Git
# integration deploys the push). The gates are identical to the laptop bot's:
#   - verify: gold set (67) + sanity invariants + licensed-route checks
#   - build-jobs: purity canary (licensed boards >30% cross-tier titles -> fail)
#   - web build + check:links: internal link-integrity gate
# Any red gate -> exit non-zero, nothing published, last-good data stays live.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

# FX snapshot weekly (Mondays), cheap + keyless.
if [ "$(date +%u)" = "1" ]; then npm run --silent scrape -- fx:update || true; fi

# Board nightly, graph weekly — same split as daily-run.sh. Adjacency is
# computed over a large accumulated corpus and barely moves; re-emitting nightly
# shuffled route numbers for no reader benefit and made the sitemap's
# "changed today" signal meaningless.
npm run --silent scrape -- ingest all || echo "::warning::ingest exited non-zero (continuing to the gate)"
npm run --silent scrape -- normalize  || echo "::warning::normalize exited non-zero"
npm run --silent scrape -- aggregate  || echo "::warning::aggregate exited non-zero"
if [ "$(date +%u)" = "1" ] || [ "${FORCE_GRAPH:-0}" = "1" ]; then
  echo "graph: weekly rescore (Monday, or FORCE_GRAPH=1)"
  npm run --silent scrape -- score || echo "::warning::score exited non-zero"
  npm run --silent scrape -- emit  || echo "::warning::emit exited non-zero"
else
  echo "graph: held — adjacency re-scores Mondays (FORCE_GRAPH=1 to override)"
fi
npm run --silent scrape -- salaries || true
npm run --silent scrape -- status || true

# ── THE GATE ──────────────────────────────────────────────────────────────────
npm run --silent scrape -- verify > /tmp/verify.txt 2>&1; VRC=$?
cat /tmp/verify.txt
if [ "$VRC" -ne 0 ] || grep -q "PROBLEM" /tmp/verify.txt; then
  echo "::error::gate RED — verify failed; keeping last-good data, not publishing"; exit 2
fi

# ── green: refresh the web surfaces ─────────────────────────────────────────────
python3 apps/scraper/scripts/export-web-data.py      || { echo "::error::export-web-data failed"; exit 2; }
node    apps/scraper/scripts/fetch-logos.mjs          || echo "::warning::fetch-logos failed (non-fatal)"
python3 apps/scraper/scripts/build-jobs.py           || { echo "::error::build-jobs failed (purity canary?)"; exit 2; }
# Order matters: build-skill-icons writes skill-marks.json, which
# build-skill-glossary folds into its entries. Reversed, a lexicon addition
# ships markless chips for a day. build-lastmod must run last of the data
# steps and before the web build, since sitemap.ts reads lastmod.json.
node    apps/scraper/scripts/build-skill-icons.mjs    || echo "::warning::build-skill-icons failed (non-fatal)"
python3 apps/scraper/scripts/build-skill-glossary.py || echo "::warning::build-skill-glossary failed (non-fatal)"
# Outreach target list (docs/28) — NOT non-fatal: the admin console imports
# packages/data/outreach/targets.json at build time, so a missing file fails the build.
python3 apps/scraper/scripts/build-outreach-targets.py || { echo "::error::build-outreach-targets failed"; exit 2; }
python3 apps/scraper/scripts/build-lastmod.py        || echo "::warning::build-lastmod failed (non-fatal)"

# web build + link-integrity gate before anything is committed
( cd apps/web && npm run build && npm run --silent check:links ) || { echo "::error::web build or link gate failed"; exit 2; }

# ── publish: commit the regenerated data, push (Vercel deploys) ──────────────────
# Vercel (Hobby) only auto-deploys commits AUTHORED by the account owner —
# a bot identity gets "Deployment was blocked". So the nightly commit carries
# the owner identity; bot commits are identified by their "data:" message.
git config user.name  "Carlos Alvarez"
git config user.email "vinocouralvarez@gmail.com"
# packages/data/fx holds the weekly FX snapshot (fx:update, Mondays) — a tracked
# file outside the data dirs; without it the Monday rebase aborts on a dirty tree.
git add apps/web/public/data packages/data/generated packages/data/outreach packages/data/fx apps/web/src/lib/data.js
# Belt-and-suspenders: stage any OTHER tracked modification (future writers) so the
# rebase never fails on a dirty tree. -u touches tracked files only — never the
# stray untracked ones (__pycache__, scratch) we must not commit.
git add -u
CHANGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
if [ "$CHANGED" = "0" ]; then echo "no data changes — nothing to publish"; exit 0; fi
if [ "$CHANGED" -gt 3000 ]; then echo "::error::implausible diff ($CHANGED files) — aborting, inspect manually"; git reset -q; exit 2; fi
N=$(node -e 'try{console.log(require("./apps/web/public/data/all-jobs.json").length)}catch{console.log("?")}')
git commit -q -m "data: nightly scrape $(date +%F) (${N} board listings)"
# Rebase onto any commits that landed during the run (docs pushes, the laptop bot)
# before pushing, so the publish never fails on a moved remote. A real conflict
# (both bots regenerating the same files) exits red rather than force-anything.
git pull --rebase origin main || { echo "::error::rebase before push failed — not publishing"; exit 2; }
git push
echo "published $CHANGED files (${N} listings) — Vercel deploying"

# push-notify IndexNow (best-effort; engines queue and re-crawl after the deploy lands)
node apps/scraper/scripts/indexnow-ping.mjs || echo "::warning::indexnow ping failed (non-fatal)"
