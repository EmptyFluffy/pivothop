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

# ── Cold-cache corpus restore ────────────────────────────────────────────────
# The Actions cache carries postings_raw.ndjson between runs, but a cold or
# evicted cache left the cloud building on its own thin history — 81,309 raw
# against the laptop's 260,519 — and since both bots commit the same paths,
# whichever finished last published. That made the site's numbers depend on a
# race. The seed release holds the laptop's full corpus so a cold start is a
# download, not a restart from zero. Also the only off-laptop copy: before it,
# 511MB of accumulated history lived on one machine and was gitignored.
#
# Threshold not existence: a truncated or half-written cache restore is worse
# than none, because it looks like data. Under 50MB is not a real corpus.
SEED_TAG="corpus-seed-2026-07-31"
RAW="apps/scraper/data/postings_raw.ndjson"
mkdir -p apps/scraper/data
RAW_MB=$( [ -f "$RAW" ] && echo $(( $(wc -c < "$RAW") / 1048576 )) || echo 0 )
if [ "$RAW_MB" -lt 50 ]; then
  echo "corpus: ${RAW_MB}MB on disk — restoring from seed release $SEED_TAG"
  gh release download "$SEED_TAG" -p 'postings_raw.ndjson.gz' -O /tmp/seed-raw.gz --clobber \
    && gunzip -c /tmp/seed-raw.gz > "$RAW" \
    && echo "corpus: restored $(( $(wc -c < "$RAW") / 1048576 ))MB"
  # The ledger is what keeps posting ages repost-proof; restoring the corpus
  # without it would make every seeded posting look first-seen today.
  if [ ! -s apps/scraper/data/first-seen.json ]; then
    gh release download "$SEED_TAG" -p 'first-seen.json.gz' -O /tmp/seed-fs.gz --clobber \
      && gunzip -c /tmp/seed-fs.gz > apps/scraper/data/first-seen.json \
      && echo "corpus: first-seen ledger restored"
  fi
else
  echo "corpus: ${RAW_MB}MB from cache — no seed needed"
fi

# FX snapshot weekly (Mondays), cheap + keyless.
if [ "$(date +%u)" = "1" ]; then npm run --silent scrape -- fx:update || true; fi

# Board nightly, graph weekly — same split as daily-run.sh. Adjacency is
# computed over a large accumulated corpus and barely moves; re-emitting nightly
# shuffled route numbers for no reader benefit and made the sitemap's
# "changed today" signal meaningless.
# Prospector: drains the firm queue, auto-admits careers pages that pass the
# wave rules (same-domain + careers-ish URL; ATS hits held for manual namesake
# checks). The top-up refills the queue from OpenStreetMap when it runs shallow
# (below 900 untried, 6 regions a night), region-rotated and deduped against
# the whole fleet, so discovery never silently stops when the hand-built queue
# drains — which it was ten nights from doing when the top-up landed
# (2026-08-21). 300/night on 6 concurrent pages is ~5 min of the run; the
# laptop bot is retired, so this is the only discovery stream left. Both steps
# non-fatal: a broken prospect run must never cost the night's scrape.
node apps/scraper/scripts/prospect-topup.mjs || echo "::warning::prospect-topup failed (non-fatal)"
PROSPECT_PER_NIGHT="${PROSPECT_PER_NIGHT:-300}" node apps/scraper/scripts/prospect.mjs || echo "::warning::prospect failed (non-fatal)"
# Sundays: re-try the transient-failure pool (429s, DNS blips, detector misses —
# 96 firms deep when this landed). Without it a studio lost to one bad night is
# lost permanently; RETRYABLE in prospect.mjs already excludes settled outcomes.
if [ "$(date +%u)" = "7" ]; then
  RETRY=1 PROSPECT_PER_NIGHT="${PROSPECT_PER_NIGHT:-300}" node apps/scraper/scripts/prospect.mjs || echo "::warning::prospect retry pass failed (non-fatal)"
fi
npm run --silent scrape -- ingest all || echo "::warning::ingest exited non-zero (continuing to the gate)"
# Absorb tracked sideload snapshots (careerjet: IP-bound to the founder's
# machine, exported there, committed; see scripts/sideload.mjs).
node apps/scraper/scripts/sideload.mjs || echo "::warning::sideload failed (non-fatal)"
npm run --silent scrape -- normalize  || echo "::warning::normalize exited non-zero"
npm run --silent scrape -- aggregate  || echo "::warning::aggregate exited non-zero"
# Graph re-scores weekly (Mondays) — but ALSO whenever adjacency.json is absent.
# That second condition is not belt-and-braces, it is required: score writes
# adjacency.json into the gitignored data dir, so on a fresh CI checkout a
# non-Monday run skipped score, never produced the file, and export-web-data
# died on it. The laptop never saw this because the file persists locally.
# Missing input -> rebuild it, whatever day it is.
if [ "$(date +%u)" = "1" ] || [ "${FORCE_GRAPH:-0}" = "1" ] || [ ! -f apps/scraper/data/adjacency.json ]; then
  echo "graph: rescoring (Monday, FORCE_GRAPH=1, or adjacency.json missing)"
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
# The founder's untrimmed per-studio view (/admin/studios). Non-fatal.
python3 apps/scraper/scripts/build-admin-studios.py  || echo "::warning::build-admin-studios failed (non-fatal)"
# Order matters: build-skill-icons writes skill-marks.json, which
# build-skill-glossary folds into its entries. Reversed, a lexicon addition
# ships markless chips for a day. build-lastmod must run last of the data
# steps and before the web build, since sitemap.ts reads lastmod.json.
node    apps/scraper/scripts/build-skill-icons.mjs    || echo "::warning::build-skill-icons failed (non-fatal)"
python3 apps/scraper/scripts/build-skill-glossary.py || echo "::warning::build-skill-glossary failed (non-fatal)"
# Swiss official wage bands (BFS LSE): one cached request, survey updates biennially.
python3 apps/scraper/scripts/build-salary-ch.py     || echo "::warning::build-salary-ch failed (non-fatal — yesterday's BFS bands stay)"
# Outreach target list (docs/28) — NOT non-fatal: the admin console imports
# packages/data/outreach/targets.json at build time, so a missing file fails the build.
python3 apps/scraper/scripts/build-outreach-targets.py || { echo "::error::build-outreach-targets failed"; exit 2; }
python3 apps/scraper/scripts/build-lastmod.py        || echo "::warning::build-lastmod failed (non-fatal)"

# web build + link-integrity gate before anything is committed
( cd apps/web && PAGE_GRACE_WRITE=1 npm run build && npm run --silent check:links && node scripts/report-check.mjs ) || { echo "::error::web build, link gate or report gold set failed"; exit 2; }

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
