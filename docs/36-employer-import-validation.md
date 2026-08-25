# Employer import validation

Date: 2026-08-24

The employer posting flow accepts either an existing public job URL or a job created from scratch. Both paths terminate in the same editable PivotHop form and the same reviewed submission queue.

## Native ATS paths

PivotHop uses public, documented job-posting feeds when the pasted URL exposes a stable ATS board and posting identifier:

- Greenhouse Job Board API: public GET endpoints; `GET /v1/boards/{board_token}/jobs/{job_id}`.
- Lever Postings API: public specific-posting endpoint; `GET /v0/postings/{site}/{posting-id}`.
- Ashby Public Job Posting API: `GET /posting-api/job-board/{job-board-name}?includeCompensation=true`, then match the exact `jobUrl`.

These are preferred over page scraping because they are the public interfaces the ATS vendors provide for careers/job-board use.

References:
- https://developer.greenhouse.io/job-board.html
- https://github.com/lever/postings-api/blob/master/README.md
- https://developers.ashbyhq.com/docs/public-job-posting-api

## Universal fallback

For Workday, SmartRecruiters, custom careers sites and other public pages, PivotHop fetches the public page and reads Schema.org `JobPosting` JSON-LD when present. That is the same structured vocabulary exposed to search engines such as Google Jobs.

If neither an ATS feed nor `JobPosting` data can be read, the employer can paste the existing description. The client parser extracts likely title, salary, summary, responsibilities, qualifications and matching skills. Nothing imported is treated as immutable; the employer reviews and edits every field before submitting.

## Security posture

The URL fetcher:
- accepts HTTPS only;
- resolves hostnames and rejects loopback, link-local and private-network addresses;
- revalidates every redirect target instead of blindly following redirects;
- caps redirects;
- times out slow pages;
- caps HTML read size;
- never follows the imported page's application form or submits data to the source ATS.

Free listings are stored as `pending_review`, not instantly made public. This keeps the early-access board from becoming an anonymous spam endpoint while payment/account infrastructure is still being completed.
