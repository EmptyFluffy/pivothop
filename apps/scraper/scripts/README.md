# Scheduled accumulation run

The scrape gets better by *repetition*: every source upserts by key, so re-running only adds new postings and refreshes stale ones. The routes climb toward the ≥500-postings gate on their own if the scrape runs daily.

## What's here

- `daily-run.sh` — ingests every source, re-normalizes, re-scores, re-emits, refreshes FX on Mondays. Appends to `../data/daily-run.log`. Safe to run by hand anytime:
  ```
  bash apps/scraper/scripts/daily-run.sh
  ```
- `com.pivothop.scraper.daily.plist` — a macOS launchd agent that runs `daily-run.sh` at 07:15 local each day.

## Enable the daily schedule (one time)

Installing an auto-starting agent is a change to your machine that persists beyond any Claude session, so it's left for you to run deliberately:

```
cp apps/scraper/scripts/com.pivothop.scraper.daily.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.pivothop.scraper.daily.plist
```

Check it's registered:
```
launchctl list | grep pivothop
```

Run it once immediately to confirm it works:
```
launchctl start com.pivothop.scraper.daily
tail -f apps/scraper/data/daily-run.log
```

## Disable it

```
launchctl unload ~/Library/LaunchAgents/com.pivothop.scraper.daily.plist
rm ~/Library/LaunchAgents/com.pivothop.scraper.daily.plist
```

## Notes

- The agent runs as your user, so it reads the repo-root `.env` and writes the same local NDJSON as a manual run.
- Adzuna's free tier has a daily call quota; one `run` per day stays well inside it.
- If the Mac is asleep at 07:15, launchd runs the job once at the next wake — no missed days pile up.
