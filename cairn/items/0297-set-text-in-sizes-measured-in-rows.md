---
id: 297
uid: 4ab6cc01-4c94-4816-8ca8-0e0cb4537289
title: Set text in sizes measured in rows
type: component
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: components
effort: m
---

## Purpose

A primitive for sized text (sizes 2, 3 and 4 rows) that works with no script, at every density and in both painters, sits inside frames whose lines meet it, and reads back through screenshot and copy.

## What's shipped

- **Text component** (`@rockaway/react`): React component with `size` (2, 3, 4), `inline`, and `as` props; renders with `.rk-text` and `.rk-text-glyphs` for sized display
- **Pure functions** (`text.pure.ts`): `textSizes`, `TextSize`, `textScale`, `textCols`, `textBuffer`, `TEXT_SLACK`; all sized text at ordinary size
- **CSS** (`@rockaway/css`): `.rk-text`, `.rk-text-glyphs` (scaled font and line box), `.rk-text-inline` (inline-block with width rounded up to cells)
- **Metadata** (`text.meta.ts`, `text.fixture.ts`, `text.snapshots.txt`): component description, fixture with states, snapshot test
- **Stories** (`Text.stories.tsx`): Every size, densities glyph and rule, heading in frame, display line beside text, copy (triple-click), ASCII, refused at strict, sized off-script, forced colours; 19 stories, all passing locally
- **Tokens** (`@rockaway/tokens`): `contentHeight` for IBM Plex (1.3), JetBrains (1.32), system (1.36), Berkeley (1.36)
- **Entries and index**: `entries/text.ts`, index line in `@rockaway/react`, test file `test/text.test.ts`
- **Conformance**: `SizedText` violation at strict level; exported from testing

## Acceptance criteria

1. [x] Component builds with no errors or warnings
2. [x] Stories render and pass conformance at all densities and in both painters
3. [x] Screenshot reads a run's characters one to a cell from start, padding to K, blank rows below
4. [x] Copy gets words alone (uppercase for h1/h2/h3 per base.css)
5. [x] Continuity passes: glyphs are transparent in chromeOnly; ink stays inside N rows
6. [x] Conforms at strict with SizedText exception declared
7. [ ] Linux CI hinting: font metrics match macOS measurements
8. [x] Changeset added for @rockaway/react, @rockaway/css, @rockaway/tokens
9. [ ] Final PR ready to land alongside 0296
