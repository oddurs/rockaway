---
id: 146
uid: 8c342cc2-97a6-4476-93d7-87a078017165
title: Deploy the site to GitHub Pages on every push to main
type: chore
status: backlog
milestone: site
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
- [ ] The base path matches the decision in 0145, and every internal link and asset works under it, asserted by a link check on the built output
- [ ] A failed deploy fails visibly; the last good deploy stays up
