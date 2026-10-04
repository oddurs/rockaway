---
id: 105
uid: 51487277-f66a-4dd7-8e09-836ddb4602b0
title: Make every screen copyable as text and as ANSI
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 98
- 104
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: site
effort: m
---

## Proposal

The party trick, and the proof: what you see is a grid of characters, so you
can take it with you.

## Acceptance criteria

- [x] Copy any screen as text, and as ANSI with colour
- [x] Paste it into a terminal and it looks the same
- [x] The button is keyboard reachable and says what it copied

## 2026-10-03

The program plan adds the status bar's message slot (0098) as the place the copy button says what it copied, and depends on it.

## 2026-10-03

Built on the shell (0104), on feat/copy-screens, stacked on feat/site-shell. The system grows @rockaway/react/copy: readScreen reads a rendered element back into a Buffer (painted chrome and the elements over it, each character in its cell, with the colours it is drawn in); screenText is toText of it; screenAnsi is the engine's own toAnsi with screenPalette. In the palette, the page's ground and text (and surface) are the terminal's default, the theme's sixteen are the sixteen (so a reader's terminal theme colours them, and rockaway's terminal files make it the page exactly), a ground in the text colour is reverse video (SGR 7), and anything else is truecolor, or the nearest at 256 or 16. Colours are read through a 1x1 canvas, because computed colours come back in oklch.

## 2026-10-03

On the site: y copies the screen you are on as text, Shift+Y as ANSI; two Buttons in the status bar do the same (keys y and shift+y, so aria-keyshortcuts), and the message line says what was copied and its size. The screen is the one last pointed at or moved into (a snapshot figure, an example's screen), or else the whole page. Proved in the site test: the page as text is the screen as drawn; every snapshot on every component page copies as its metadata text; and the ANSI, written into @xterm/headless (a dev dependency of the site), reads back line for line as the text, with the mode in reverse video and the success mark in slot 2 of the sixteen. Small finding: Button's keys="shift+y" announces aria-keyshortcuts="Shift+y", where ARIA wants the key as typed, Shift+Y.
