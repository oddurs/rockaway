---
id: 65
uid: e652b4eb-3a52-4395-8ad5-c52f74850c5b
title: Answer prefers-contrast with attributes, not a third palette
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 117
- 118
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tokens
effort: m
---

## Problem

`prefers-contrast: more` is a reader telling us the default is not enough. A
third palette is the pixel-system answer. On a character grid it is mostly
attribute work: heavier borders, no dim, bold where a pixel system would
darken.

## Proposal

A `contrast` context (`standard`, `more`) selected by `prefers-contrast: more`
and forcible with `data-contrast="more"`: borders draw heavy, dim becomes the
default foreground, muted text becomes default, the focus ring thickens, and
the text pairs are gated at 7:1.

## Acceptance criteria

- [x] `prefers-contrast: more` and `data-contrast="more"` both apply it, in a story
- [x] Every text pair passes 7:1 in the increased context, in both modes, in the contrast gate
- [x] No geometry changes: conformance is identical with it on and off
- [x] Disabled stays distinguishable from enabled without relying on dim

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Increased contrast is not a third palette. Under prefers-contrast: more, or data-rk-contrast="more" on any element, the semantic tier is re-read from the same slots:
- muted text and the dim attribute become the foreground;
- coloured text takes the bright slot (a terminal's bold-is-bright);
- every fill becomes the foreground, so a filled control is reverse video;
- each edge steps up a weight: subtle becomes border, default and surface become border-strong, control becomes the foreground;
- syntax colours take their bright slots, and comments become the foreground.
Lines get heavier but stay distinct from each other (glyph 0.12/0.22em, was 0.08/0.16; rule 2/3px, was 1/2), so a focused frame still reads heavier than a resting one. The focus ring is 3px. data-rk-contrast="standard" keeps an element out, and the attribute is data-rk-* from the start, ahead of 0180.

## 2026-10-03

The gate checks every theme x declared mode x contrast, holding text pairs to 7:1 in more (minimumIn) and boundaries at 3:1. That is 2528 pairs. fitContrast fits the palette to both readings at once, so the bright slots move slightly further from the ground where they fell short of 7:1. One palette, fitted to two readings. It was mostly light mode for presets, and further for the imported themes. Solarized's bright greens are greys by its own design, so in more contrast its success text is a dark grey.

## 2026-10-03

Disabled: fg.disabled reads the old muted slot (legible), and packages/css/src/contrast.css strikes disabled controls through in rk.utilities, after the components, so a link's underline cannot remove it. forced-colors.css now also covers [data-rk-contrast] islands. To prove the system preference path, the workbench gained an emulateContrast browser command (Playwright emulateMedia) on the runner. The Foundations/Contrast story asserts four things: both triggers apply it, data-rk-contrast="standard" opts out, cells and conformance are identical with it on and off, and the disabled button is struck. axe passes on the more island in both the sRGB and p3 projects.

## Result

prefers-contrast: more, data-rk-contrast="more" and data-rk-contrast="standard" work on any element. The same palette is re-read: muted text becomes the foreground, colour becomes bright, fills become reverse video, edges and lines get heavier, the focus ring is 3px, and disabled is struck through. Text is gated at 7:1 there for every theme and mode, and no cell moves.
