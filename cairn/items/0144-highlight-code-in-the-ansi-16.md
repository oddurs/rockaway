---
id: 144
uid: 69065b47-83fc-4cca-bbd7-adc083911cb3
title: Highlight code in the ANSI 16
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 89
- 103
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: tokens
effort: s
---

## Problem

The site is mostly code examples. A borrowed syntax theme would bring its own
palette and break the one promise the colour system makes: sixteen colours,
gated for contrast, that the reader's terminal already has.

## Proposal

Generate a Shiki theme from the semantic tokens at build time: each TextMate
scope maps to an ANSI role (keywords magenta, strings green, comments dim, and
so on, the way terminal editors do it) through CSS variables, so the highlight
follows the theme switcher and the mode with no rebuild.

## Acceptance criteria

- [x] Code on the site is highlighted at build time, with no highlighting JavaScript shipped
- [x] Every highlight colour is a token, and the contrast gate covers each against `bg.surface` in both modes
- [x] Switching theme or mode re-colours code without a reload
- [x] Emphasis that matters (comments, errors) also carries an attribute, so code reads in greyscale

## 2026-10-03

Roles, not colours: syntax.* in @rockaway/tokens has twelve roles (plain, comment, keyword, string, constant, function, type, attribute, regexp, inserted, deleted, error). Each aliases an ANSI slot the way terminal editors use them: keywords magenta, strings green, constants yellow, functions blue, types and tags cyan, comments muted. pairs.ts gates every role at 4.5:1 on bg.surface and bg.subtle (a code block's ground), in both modes. The fitter needed no adjustments for the default theme or for any of the 24 hue and temperature variations the tests run. The closest margins are light syntax.string and syntax.type on bg.subtle, at +0.05 and +0.04.

## 2026-10-03

Shiki runs at build time, through Astro's built-in highlighter. Its theme writes var(--rk-syntax-<role>) where a colour would go. A transformer reads the role back and replaces the inline style with a class, rk-syntax-<role>, which packages/css/src/syntax.css colours. Plain text loses its span. The pre loses Shiki's class and style and keeps only its language and a tab stop. So the page carries no colour of its own, and a change of theme or mode recolours code in place. A prose page ships no JavaScript at all, and the site test asserts that. Greyscale: comments are italic and errors underlined, as a terminal draws them.

## 2026-10-03

Two things to know. Astro marks a diff's + and - with user-select: none, so a copied diff would lose them. The transformer turns them back into text, since they are the diff. Also, Astro's content layer caches rendered Markdown and does not notice when the pipeline changes: the first rebuild after changing the transformer served the old HTML. The site's build and its test now run astro build --force. markdown.rehypePlugins is deprecated in Astro 7, so the pipeline now goes through unified() from @astrojs/markdown-remark.

## Result

syntax.* tokens (twelve roles, each an ANSI slot, gated on bg.surface and bg.subtle in both modes); .rk-syntax-<role> in @rockaway/css (comments italic, errors underlined); the site highlights at build time with Shiki through a theme of roles and a transformer that writes classes, not colours.
