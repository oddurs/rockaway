---
id: 8
title: 'Choose the behaviour layer: React Aria Components or Base UI'
type: decision
status: done
milestone: foundations
assignee: Oddur Sigurdsson
depends_on:
- 7
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: behaviour
effort: m
---

## Context

The behaviour layer owns accessibility, focus and keyboard. Never hand-rolled.

## Options

- **React Aria Components** — most rigorous a11y and i18n; a hooks layer beneath the components, so we are never boxed in
- **Base UI (v1.8)** — from the Radix authors, cleaner API, shadcn's default since July 2026
- **Radix** — fine, and the previous generation

## Evidence

Spike, 2026-09-22: the same Select (label, description, error slot, three
options) built with `react-aria-components` 1.21.1 and `@base-ui/react` 1.8.0 on
React 19.3, bundled with esbuild (React external) and exercised in jsdom.

| | React Aria Components | Base UI |
| --- | --- | --- |
| Bundle for one Select, min + gzip | 57.6 kB | 49.0 kB |
| Label and description wired in **server** HTML | yes | no, only after hydration |
| Listbox has an accessible name | yes (`aria-labelledby` → label) | no |
| Trigger pattern | button + `aria-haspopup="listbox"` | `role="combobox"` (APG select-only) |
| Keyboard open, focus lands on | the selected option, real focus, `data-focus-visible` | the selected option, virtual, `data-highlighted` |
| Styling hooks | `data-pressed`, `data-selected`, `data-focus-visible`, `data-disabled` | `data-pressed`, `data-highlighted`, `data-popup-open`, `data-side` |
| Lower-level escape hatch | `react-aria` hooks under every component | none; `useRender` only |
| i18n beyond RTL | locale-aware dates, numbers, collation, built-in strings | RTL via `DirectionProvider` |

Both are good. The differences that matter for a system meant to last are the
server HTML being accessible before hydration, the hooks layer, and the i18n
depth that the date picker and number field in `later` will need.

## Decision

**React Aria Components**, decided 2026-09-22.

## Consequences

- About 18% more JavaScript per component than Base UI. Accepted; revisit if a size budget is breached
- RAC adds `data-rac` and its own default class names; our components always pass `className`, so its defaults never reach the page
- When a component needs behaviour RAC does not expose, drop to the `react-aria` hooks rather than forking or wrapping DOM
- Base UI remains the fallback if React Aria's maintenance ever stalls; the CSS contract (data attributes) is close enough that restyling would be small
