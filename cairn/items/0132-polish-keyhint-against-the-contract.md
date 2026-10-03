---
id: 132
uid: ccc2ba10-1b40-4e4a-b1cc-f95ed0b6a160
title: Polish KeyHint against the contract
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
- 118
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

KeyHint shipped in 0099 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Platform detection is local to KeyHint and reads the deprecated
  `navigator.platform`; Button resolves the same question differently (0131).
  One `usePlatform()` hook, preferring `navigator.userAgentData`, should answer
  it for both.
- The snapshot table of chords is good documentation and is not yet in a form
  the site can show; it becomes the component's metadata snapshot.
- KeyHint has no frame, so 0117 changes little here; the polish is mostly
  consistency.

## Acceptance criteria

- [x] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [x] Both painters render it identically: a test asserts it for every variant, not only the default
- [x] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [x] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [x] Metadata written to the schema (0047), and validated by its test
- [x] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [x] The body of 0099 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [x] One `usePlatform()` hook, used by KeyHint and Button, with no hydration mismatch
- [x] Under an ascii theme the key legends are ASCII too (`Cmd`, `Shift`, `Up`, `Enter`), drawn from the glyph set like every other mark
- [x] Enter is drawn with a glyph the site's font has (`⏎` U+23CE rather than `↵`), so it does not fall back to another face

## 2026-10-03

Key legends are theme glyphs now: glyph.key.* in @rockaway/tokens (keyLegends, and key on every Glyphs), emitted to tokens.css like the marks. Symbols in Unicode with U+23CE for Enter; words in ASCII (Ctrl, Opt, Shift, Cmd, Enter, Up...). They are the one glyph group allowed wider than a cell, and the tokens test says so. formatKeys stacks an Apple chord only when every modifier legend is one cell, so ASCII spells it out (Cmd+Shift+K) instead of CmdShiftK, and terminal shift becomes emacs's S- where the theme has no one-cell symbol. The no-literal-glyphs check now counts the Unicode legends as theme glyphs, which made key-hint.meta.ts compute its summary from formatKeys rather than quote the Command sign.

## 2026-10-03

usePlatform() (src/platform.ts) replaces KeyHint's effect and Button's 'auto is always other'. It is a useSyncExternalStore whose server snapshot is 'other': the server render and the hydrating render agree, and React swaps in the client's answer straight after, with no mismatch (the Hydration story renders to a string, hydrates it and records no recoverable error). A client-only render is right from the first paint, where the old effect flashed Ctrl+S on a Mac. detectPlatform() prefers navigator.userAgentData.platform and falls back to the user agent, never the deprecated navigator.platform. Button now resolves the keyboard once and hands it to its KeyHint, so the drawn chord and aria-keyshortcuts agree, which also fixes the Mac defect listed on 0131.

## 2026-10-03

Proof: Every variant is a screenshot() text snapshot (each keyboard and notation, with an action and bare); Painters asserts the glyph and rule painters read back identically; Densities draws both painters at all four densities, asserting the same text in each and letting the afterEach continuity check prove the strokes; ASCII theme asserts the spelled-out legends and nothing outside ASCII. KeyHint has no states of its own, so every-state coverage is the variants. 0125 has not landed, so the density matrix is in the story by hand. Once, under load from the full suite, Grid/Continuity > Dense timed out at 15s; it passed alone and on a rerun, and is not touched here.

## Result

usePlatform() in @rockaway/react decides the keyboard for KeyHint and Button alike, with no hydration mismatch; key legends are the theme's glyph.key.*, words under ASCII, and Enter is U+23CE.
