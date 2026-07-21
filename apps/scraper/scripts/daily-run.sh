#!/bin/bash
# PivotHop daily scrape — accumulation run for the launchd agent (or manual use).
# Ingests every source, re-normalizes, re-scores, re-emits, and refreshes the FX
# snapshot weekly. Upserts by key, so re-runs only add and refresh — never duplicate.
# Output is appended to data/daily-run.log; the launchd plist points here.

set -u
REPO="/Users/carlos/Desktop/PivotHop"
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
LOG="$REPO/apps/scraper/data/daily-run.log"
mkdir -p "$(dirname "$LOG")"

echo "===== daily-run $(date '+%Y-%m-%d %H:%M:%S %z') =====" >> "$LOG"
cd "$REPO" || { echo "repo not found" >> "$LOG"; exit 1; }

# Refresh FX once a week (Mondays) — cheap, keyless.
if [ "$(date +%u)" = "1" ]; then
  npm run --silent scrape -- fx:update >> "$LOG" 2>&1
fi

npm run --silent scrape -- run all >> "$LOG" 2>&1
STATUS=$?
npm run --silent scrape -- status >> "$LOG" 2>&1
# keep the web app's public data in sync with the fresh emit
python3 "$REPO/apps/scraper/scripts/export-web-data.py" >> "$LOG" 2>&1 || echo "export-web-data failed (non-fatal)" >> "$LOG"
echo "----- exit $STATUS -----" >> "$LOG"
exit $STATUS
