---
id: 156
uid: ea122739-a6bb-4b3c-b273-7d80272f4fa1
title: 'Ready the repository for strangers: README, templates, conduct'
type: docs
status: review
milestone: v0.1
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 108
- 142
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: docs
effort: s
---

## Problem

On launch day most people will see the GitHub page before the site. The
README says "the frame engine is next", which has been false for weeks.

## Acceptance criteria

- [x] The README leads with a screenshot (or an animated capture) of a real screen and a link to the site, and its status note is true
- [ ] Install and a minimal example, matching the getting-started guide
- [x] Issue templates (bug, component request) and a pull request template that asks for the ten-rule checklist
- [x] A code of conduct, and CONTRIBUTING updated with the recipe (0134) and how cairn is used
- [ ] Repository description, topics and social preview set (the social preview needs the owner)

## 2026-10-03

I read the repo as a Hacker News visitor would. The README now opens with a real screen captured from the workbench (Frame, Tree, List, Badge, Button and KeyHint at normal density; dark and light, in a picture element) and links the site, the concept, public-api.md and the roadmap. The status note is true: nothing is published, 0.1.0 is next, the eleven components are named, and a 0.x minor can break. Getting started covers the install (once published), the two CSS imports and a minimal Commit pane. The example was typechecked against the workspace packages in the workbench.

## 2026-10-03

Added CODE_OF_CONDUCT.md (Contributor Covenant 2.1, verbatim from the EthicalSource repository, with the contact set to the maintainer @oddurs on GitHub). The owner should add an email address there. SECURITY.md now says what is in scope and how to report, but GitHub's private vulnerability reporting is DISABLED on the repository (the API reports enabled:false), so the owner must turn it on, or the link only works for maintainers. Added a component-request issue template, a security contact link, and a PR template with the ten rules from concept.md plus the changeset, API.md and cairn checks. CONTRIBUTING now opens with where to start (bugs, components, code, vulnerabilities) and links the code of conduct and the ten rules, and its component section says it is the recipe until 0134's doc exists.

## 2026-10-03

I set the repository description (it still described the pre-pivot pixel system) and added the topics tui, terminal, react, accessibility, monospace and ansi with gh repo edit. Left open: criterion 2 (the README example must match the getting-started guide, which 0107 has not written yet; the guide should start from this example) and criterion 5's social preview, which is the owner's. The site link points at oddurs.github.io/rockaway/, which 404s until 0146 deploys it, and that must land before launch.
