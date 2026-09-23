---
id: 70
title: Position rockaway as a TUI design system for the web
type: decision
status: done
milestone: grid
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Context

The concept (https://claude.ai/artifact/7nLZVoPtzJqMJuciyhfZjV) turns the system into a character-grid TUI. That is a
positioning decision as much as a technical one, and it decides who the system
is for.

## Options

- **A terminal framework** (Ink, OpenTUI, Bubbletea territory) — a crowded field, and it means shipping a renderer for a machine we do not control
- **A web design system that looks like a terminal** — skin deep, and the constraint stops paying rent the moment somebody wants a shadow
- **A web design system built on the terminal's constraints** — the grid is real, enforced and testable; the look follows from it

## Decision

The third, decided 2026-09-23.

**The web is the contract.** We ship CSS, React components and tokens for
browsers, phones included. The grid is enforced by tests, not by taste.

**The terminal is an export, not a target.** The same tokens emit a terminal
theme (Ghostty, iTerm2, Alacritty, Kitty), and the engine can render a screen
to ANSI for a CLI or a README. We do not ship a terminal runtime.

**Who it is for:** people who like TUIs and have to build for the web. The
pitch is the constraint, not the nostalgia: a grid you cannot fall off,
screens you can diff as text, palettes you already have.

## Consequences

- Every claim on the site has to be true on a phone, or it is not made
- The ANSI painter is a first-class output, because it is what makes the export claim honest
- A terminal runtime stays possible later: the geometry core is pure and has no DOM in it
