---
id: 103
uid: e1a6b9f8-1076-4387-81b4-1ecaf9350082
title: 'Scaffold the site: Astro, islands, static, Pages'
type: chore
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 77
- 121
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [x] `apps/site`, Astro with React islands, output static
- [x] The site imports the published packages the way a consumer would: no `@rockaway/source` condition, no path into `src`
- [ ] `pnpm check` builds the site, and pull requests upload the built site as a workflow artifact (deploying is 0146)
- [x] One monospace font, self-hosted, subset, preloaded, with a metric-matched fallback so `1ch` does not change when it loads; box drawing does not need the font (0116)
- [x] The base path is configurable, so the site works at `/rockaway/` or at a domain root
- [x] A first page renders a Frame, to prove the pipeline end to end

Rendering frames at build time is 0126's job, and the budget (0109) asserts
it; the scaffold does not wait for either.

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Font: JetBrains Mono 2.304 (OFL 1.1, no Reserved Font Name, so a subset may keep the name). Chosen over IBM Plex Mono (one file per weight) and Iosevka (0.5em advance: more columns on a phone, but cramped at 16px): it is drawn for code at screen sizes, it has every mark the tokens define and KeyHint's ⌘ ⌥ ⇧ ⌃ ⌫ ⏎, and its variable wght axis gives regular and bold in one file. Subset by scripts/font.ts with subset-font (HarfBuzz) from the release TTF pinned by sha256: Basic Latin, Latin-1, Latin Extended-A, punctuation, arrows, every mark and spinner frame in @rockaway/tokens (both repertoires) and KeyHint's glyphs; wght 400-700; ligature features dropped (ligatures are off on the grid); copyright and licence name records kept. 395 characters requested, 18,492 bytes of WOFF2. JetBrains Mono has no braille (the spinner's frames) and no ↵ (KeyHint's Enter on Apple): those fall through to the metric-matched fallback at the same advance. The output is committed so the build needs no network and no subsetter.

## 2026-10-03

Fallback: one @font-face per system monospace font (Menlo, Consolas, DejaVu Sans Mono, Liberation Mono, Noto Sans Mono, Courier New), each with size-adjust so its advance is exactly 0.6em and JetBrains Mono's ascent and descent, so glyphs sit at the same height. Only the advance had to be known per font; the vertical overrides come from the web font. Advances read with fontTools from the font files, except Consolas (1126/2048, Microsoft's metric, unverified here: check on Windows in 0152). 1lh never depended on the font, because line-height is a unitless multiple. Because the fallbacks are metric-matched, a character missing from the subset also falls through at the same advance, which is why box drawing and blocks can be left out (0116). Until 0117 lands they are drawn by the fallback font, and the frame shows 0116's gaps between rows (Menlo's vertical stroke does not fill a 1.25 line). Expected, and 0117's to fix.

## 2026-10-03

Islands: never hydrate a component straight from @rockaway/react. Astro builds each hydrated module as an entry, an entry keeps all its exports, so client:load on Frame from the package index shipped the whole package (React Aria's ListBox included): 43 kB gzipped for a box. One module per island in src/islands re-exporting what it needs costs 6 kB. A shared islands index would recreate the barrel, so there is none. First page total JS: 75 kB gzipped, 66 of it react-dom.

## 2026-10-03

Consuming as a stranger: the site's tsconfig sets customConditions to [] so it checks against dist's .d.ts; Vite never had the source condition; and a plugin in astro.config.ts fails the build if any workspace package's TypeScript source is loaded (verified by building with the condition forced on: it fails with the message). Since the root typecheck runs before the build, the site's typecheck is the first half of its own build script. astro check is not run: @astrojs/check peers on TypeScript 5 or 6 and the repo is on 7, so .astro frontmatter is not typechecked; logic lives in src/lib. Nothing needed working around: the published packages served the site as they are.

## 2026-10-03

Proof: test/site.test.ts builds the site at /rockaway/ and at /, serves each under its base from a plain static server, and in Chromium asserts no request leaves the base and nothing fails, the Frame's painted rows equal frameBuffer at the measured size, the preloaded font is the face's src and is fetched once, the cell is 9.6px (the font's advance at 16px), and 100 zeros measure the same in the fallback stack as in the web font (to 0.5px), with at least one adjusted system font present.
