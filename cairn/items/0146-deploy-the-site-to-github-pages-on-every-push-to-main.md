---
id: 146
uid: 8c342cc2-97a6-4476-93d7-87a078017165
title: Deploy the site to GitHub Pages on every push to main
type: chore
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 103
- 145
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: tooling
effort: s
---

## Acceptance criteria

- [ ] `.github/workflows/pages.yml` builds `apps/site` and deploys it on every push to `main`, in its own workflow file so it never conflicts with CI changes
- [x] The base path matches the decision in 0145, and every internal link and asset works under it, asserted by a link check on the built output
- [ ] A failed deploy fails visibly; the last good deploy stays up

## 2026-10-03

pages.yml is its own workflow, so CI changes never touch it. It runs on push to main and on workflow_dispatch, with concurrency group pages and cancel-in-progress false: a newer push waits for the deploy in flight and is never cut off half way. The build job runs pnpm build (the packages, then the site from their dist, with SITE_URL=https://oddurs.github.io and SITE_BASE=/rockaway/ as 0145 decided), then the link check, configure-pages and upload-pages-artifact. The deploy job has the only pages: write and id-token: write permissions, in the github-pages environment. A failed build or link check stops the run before an artifact exists. The run goes red on the commit and Pages keeps serving the last good deploy.

## 2026-10-03

Link check: scripts/check-links.ts reads every built page and stylesheet. Every href, src, island component-url and renderer-url, and every url() in a stylesheet or a <style> block (never in page text, so a code sample mentioning url() isn't a link) must land on a file the build made, under the base. A link to an anchor needs that id on the target page. Other origins are not fetched, so a slow third-party server can't fail a deploy. The site test runs it on both the /rockaway/ and the / build. Unit tests prove it catches a missing file, a link outside the base and a missing anchor.

## 2026-10-03

Criteria 1 and 3 stay unticked until the workflow has deployed for real. That needs 0145 (Pages enabled with GitHub Actions as the source, done by the owner) and this branch merged. Tick 1 after the first green deploy is live at oddurs.github.io/rockaway/. Tick 3 after confirming that a run which fails before upload leaves the previous deploy serving.
