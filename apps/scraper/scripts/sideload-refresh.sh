#!/bin/bash
# Laptop sideload refresh: ANE and Careerjet are the two sources bound to a
# residential IP (the ANE government portal times out from datacenter runners,
# and the Careerjet key is allow-listed to the home IP), so this is the one
# scrape step that still runs on the laptop. The nightly CI run absorbs the
# committed sideload files before normalize.
#
# Scope is deliberately narrow. The retired 2026 launchd bot swept the whole
# tree with `git add -A` and raced CI pushes; this job stages ONLY the two
# sideload files, bails if the index already holds staged work, and runs six
# hours before the CI cron (20:15 local = 02:15 UTC vs CI at ~08:15 UTC).
#
# Installed via ~/Library/LaunchAgents/com.pivothop.sideload.plist — see
# docs/33-studio-sourcing.md. Logs land in ~/Library/Logs/pivothop-sideload.log.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1

echo "=== sideload-refresh $(date -u +%FT%TZ) ==="

# Never bury someone's staged work inside an automated commit.
if ! git diff --cached --quiet; then
  echo "index has staged changes — refusing to run"
  exit 1
fi

# Land on top of CI's latest data commit; offline or conflicted, try tomorrow.
git fetch origin main || { echo "fetch failed (offline?) — skipping"; exit 1; }
git pull --rebase --autostash origin main || { git rebase --abort 2>/dev/null; echo "rebase failed — skipping"; exit 1; }

npm run --silent scrape -- ingest ane
npm run --silent scrape -- ingest careerjet
node apps/scraper/scripts/sideload.mjs --export ane
node apps/scraper/scripts/sideload.mjs --export careerjet

git add apps/scraper/sideload/ane.ndjson apps/scraper/sideload/careerjet.ndjson
if git diff --cached --quiet; then
  echo "sideloads unchanged — nothing to commit"
  exit 0
fi
git commit -m "data: laptop sideload refresh (ane + careerjet)"
git push origin main || { git pull --rebase --autostash origin main && git push origin main; }
echo "=== done $(date -u +%FT%TZ) ==="
