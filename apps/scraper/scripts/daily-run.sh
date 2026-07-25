#!/bin/bash
# PivotHop daily scrape — the nightly bot (docs/23-scraper-automation.md, Phase A).
# Ingest -> normalize -> score -> emit, then THE GATE (verify: gold set, sanity,
# licensed-route honesty), and only on green: refresh the web data, rebuild the
# web app, run the link gate, auto-commit, and push — which deploys via Vercel.
# On red: keep yesterday's data, log loudly, leave a FAILED marker. The bot may
# only publish what it can defend.

set -u
REPO="/Users/carlos/Desktop/PivotHop"
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
LOG="$REPO/apps/scraper/data/daily-run.log"
MARKER="$REPO/apps/scraper/data/LAST-RUN-FAILED"
mkdir -p "$(dirname "$LOG")"

echo "===== daily-run $(date '+%Y-%m-%d %H:%M:%S %z') =====" >> "$LOG"
cd "$REPO" || { echo "repo not found" >> "$LOG"; exit 1; }

# Refresh FX once a week (Mondays) — cheap, keyless.
if [ "$(date +%u)" = "1" ]; then
  npm run --silent scrape -- fx:update >> "$LOG" 2>&1
fi

npm run --silent scrape -- run all >> "$LOG" 2>&1
STATUS=$?
npm run --silent scrape -- salaries >> "$LOG" 2>&1
npm run --silent scrape -- status >> "$LOG" 2>&1

# ── THE GATE ─────────────────────────────────────────────────────────────────
# verify runs the gold set (every fixed bug as a test), the sanity invariants,
# and the licensed-route checks. Any PROBLEM line = red = no publish.
VERIFY_OUT=$(npm run --silent scrape -- verify 2>&1)
echo "$VERIFY_OUT" >> "$LOG"
if echo "$VERIFY_OUT" | grep -q "PROBLEM"; then
  echo "GATE RED: verify reported problems — keeping yesterday's data, NOT publishing" >> "$LOG"
  date > "$MARKER"
  echo "----- exit 2 (gate red) -----" >> "$LOG"
  exit 2
fi

# ── Green: refresh the web surfaces ──────────────────────────────────────────
python3 "$REPO/apps/scraper/scripts/export-web-data.py" >> "$LOG" 2>&1 || { echo "export-web-data FAILED — aborting publish" >> "$LOG"; date > "$MARKER"; exit 2; }
python3 "$REPO/apps/scraper/scripts/build-jobs.py" >> "$LOG" 2>&1 || { echo "build-jobs FAILED (purity canary?) — aborting publish" >> "$LOG"; date > "$MARKER"; exit 2; }
python3 "$REPO/apps/scraper/scripts/build-skill-glossary.py" >> "$LOG" 2>&1 || echo "build-skill-glossary failed (non-fatal)" >> "$LOG"

# Web build + the link-integrity gate before anything is committed.
( cd "$REPO/apps/web" && npm run build >> "$LOG" 2>&1 && npm run --silent check:links >> "$LOG" 2>&1 ) || {
  echo "WEB BUILD or LINK GATE FAILED — aborting publish" >> "$LOG"; date > "$MARKER"; exit 2; }

# ── Publish: auto-commit the regenerated data, push -> Vercel deploys ────────
cd "$REPO"
git add apps/web/public/data packages/data/generated apps/web/src/lib/data.js apps/scraper/data/first-seen.json 2>> "$LOG"
CHANGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
if [ "$CHANGED" = "0" ]; then
  echo "publish: no data changes — nothing to deploy" >> "$LOG"
elif [ "$CHANGED" -gt 3000 ]; then
  echo "publish: $CHANGED files changed — implausibly large, aborting (inspect manually)" >> "$LOG"
  git reset >> "$LOG" 2>&1
  date > "$MARKER"
  exit 2
else
  N=$(node -e 'try{console.log(require("./apps/web/public/data/all-jobs.json").length)}catch{console.log("?")}')
  git commit -m "data: nightly scrape $(date +%F) (${N} board listings)" >> "$LOG" 2>&1
  git push origin main >> "$LOG" 2>&1 && echo "publish: pushed — Vercel deploying" >> "$LOG" || { echo "publish: git push FAILED" >> "$LOG"; date > "$MARKER"; exit 2; }
  # Push-notify the IndexNow engines once the deploy has had time to land.
  ( sleep 600 && node "$REPO/apps/scraper/scripts/indexnow-ping.mjs" >> "$LOG" 2>&1 ) &
fi

rm -f "$MARKER"
echo "----- exit $STATUS -----" >> "$LOG"
exit $STATUS
