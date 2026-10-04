---
id: 145
uid: 9904b1b8-3cbd-4a08-8855-8a35aa8e917b
title: Enable GitHub Pages for the repository
type: chore
status: done
milestone: site
labels:
- needs-owner
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: tooling
effort: s
---

**Needs the human owner.** An agent cannot change repository settings.

## Acceptance criteria

- [x] Pages is enabled for `oddurs/rockaway` with GitHub Actions as the source
- [x] The `github-pages` environment allows deployments from `main`
- [x] A decision recorded here: the site lives at `oddurs.github.io/rockaway`, or at a custom domain (if so, the DNS records are set and HTTPS is enforced)

## 2026-10-03

Enabled by the CTO via the API on 2026-10-03: Actions as the source, default domain; a custom domain stays the owner's call. Verified through the API on the same day: build_type workflow, html_url https://oddurs.github.io/rockaway/, https_enforced true, no CNAME. The github-pages environment uses a custom branch policy that allows main only. The site lives at oddurs.github.io/rockaway/, which is what pages.yml (0146) builds for: SITE_URL https://oddurs.github.io, SITE_BASE /rockaway/.

## Result

Pages enabled with GitHub Actions as the source; the github-pages environment deploys from main; the site lives at oddurs.github.io/rockaway/ on the default domain, HTTPS enforced.
