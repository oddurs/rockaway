---
id: 77
title: Build the site as the system, statically, on Pages
type: decision
status: done
milestone: site
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: site
effort: m
---

## Context

A TUI system for the web has one obvious demo: a website that is a TUI. It is
also the first thing anyone on Hacker News will judge, on a phone, on a train.

## Options

- **A Storybook** — a workbench, not a website; slow first paint, and nobody reads it for pleasure
- **Next.js** — more server than a static docs site needs
- **Astro, static, React islands** — HTML on the wire, interactivity where it earns it, and the engine renders frames at build time because it is pure

## Decision

Astro with React islands, output static, deployed to GitHub Pages by CI. Decided 2026-09-23.

- **The site is built from `@rockaway/react`.** No bespoke components: if the site needs something, the system grows it.
- **It behaves like a TUI**: a command palette on `⌘K` / `/`, `j` `k` and arrows to move, `?` for help, a status bar that says where you are, panes that split. Every one of those also works as an ordinary link, so it is a website first.
- **It reads on a phone.** At 40 cells the panes stack; `touch` density applies; nothing horizontally scrolls except tables and code.
- **Budgets, enforced in CI**: under 100 kB of JavaScript on the first page, first paint without JavaScript at all, axe clean, and the grid conformance test run against the built pages.
- **Every page can be copied as text** (and as ANSI), because that is the party trick the system earns honestly.

## Consequences

- The site is the acceptance test for the whole system: a component that cannot build a docs page is not finished
- `apps/workbench` stays for development; the site is what the public sees
