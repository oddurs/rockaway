---
id: 151
uid: da308364-3422-4766-8c64-7baf314430d7
title: 'Compose three example apps from the system: a git client, a monitor, a settings form'
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 35
- 36
- 42
- 57
- 98
- 101
- 104
- 136
- 137
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: site
effort: l
---

## Problem

Components on their own pages prove the parts. Whether the system can build a
whole screen someone would want to use is a different claim, and it is the
claim a TUI audience will test first. They are also the compositions the
copy-in registry (0046) serves.

## Proposal

Three full-screen examples on the site, each built only from
`@rockaway/react`, each also published as a registry item:

- **A git client**: panes, a tree of files, a diff in a CodeBlock, a commit
  form, a status bar with key hints.
- **A system monitor**: tables that update, progress bars, sparklines, a
  spinner, all on a tick.
- **A settings form**: every field component, a fieldset, validation, a
  confirmation dialog.

## Acceptance criteria

- [ ] Each example is a page on the site, works by keyboard alone, at 40 and 120 cells, and at touch density
- [ ] Each passes axe, conformance and continuity in the built site
- [ ] Each uses nothing outside `@rockaway/react` and `@rockaway/css`: no local components, no local CSS beyond layout
- [ ] Each can be copied as text and as ANSI (0105), and looks right when the ANSI is pasted into a terminal

## Design

Written 2026-10-03 by the tokens engineer, who builds the apps as their parts reach main.

### Where they live

- **Source.** Each app is a registry item: `apps/site/src/registry/<name>/`, served at `/r/<name>.json` (0046).
- **Page.** It also has a page at `/examples/<name>/` that renders the same component full-screen, so the page and the item cannot drift apart.
- **Imports.** An app imports only `@rockaway/react`, each component from its own entry, plus React. The registry's import check enforces this, so criterion 3 is held by the same test that holds 0046's.
- **Files.** An app may have several files in its own directory:
  - `app.tsx`, the screen;
  - `data.ts`, the state as plain data and pure functions over it;
  - `keys.ts`, the bindings.
- **No real I/O.** Each app runs on a fixed, seeded model, so its text snapshot is a test fixture and continuity is reproducible.

### Shared rules

- **Size.** The app fills the screen it is given in whole cells: a `Screen` sized from the viewport, never a fixed width.
- **Widths.** Two layouts: 60 cells and over, and under 60. Each app has to be good at both 120 and 40, not merely fit.
- **Keyboard.** Every action has a key, bound through `Keymap` and shown in the status bar by priority. `?` opens the Keymap help in a `Dialog`.
  - `Tab` and `Shift+Tab` move between panes.
  - Inside a pane, the component's own keys apply.
  - Pointer and touch do everything the keys do.
- **Motion.** Anything that moves runs on `useTick`, so reduced motion and `data-motion` hold. A paused or reduced app is still complete, never blank.
- **Themes.** The theme, mode and density are the page's. The settings form also sets them on its own subtree, live.

### 1. git: a git client

At 120 × 36:

```
┌ rockaway  main ↑2 ─────────────┬ src/components/list.tsx ─────────────────────────────────────────────────────────┐
│ ▾ Changes                    3 │ @@ -41,7 +41,9 @@ export function List<T extends object>({                         │
│ ▸ M src/components/list.tsx    │    41    const rows = useRows(collection);                                         │
│   A src/components/tree.tsx    │ -  42    const height = rows.length;                                               │
│   D docs/old.md                │ +  42    const height = Math.min(rows.length, visible);                            │
│ ▾ Staged                     1 │ +  43    const offset = clamp(scroll, 0, height - visible);                        │
│   M README.md                  │    44    return (                                                                  │
├ Commit ────────────────────────┤                                                                                    │
│ Summary  [Clamp the list's   ] │                                                                                    │
│          [✓] Sign  [ Commit ]  │                                                                                    │
├ Log ───────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┤
│ ▸ 3f2a1c4  Make the continuity stories readable                              oddurs   2 hours ago                  │
│   1e0331f  Paint a screen's chrome on the server                             oddurs   5 hours ago                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 main ↑2  3 changed · 1 staged     ⏎ diff  space stage  c commit  d discard  / filter  ? keys
```

- **Parts:**
  - `Panes`, for the three panes and the log, their borders shared and joined;
  - `Tree`, for changes and staged, grouped, with the status letter as a `Badge` tone and mark;
  - `CodeBlock lang="diff"` (`inserted` and `deleted` are already syntax roles);
  - `Form` with `TextField`, `Checkbox` and `Button keys="mod+enter"`;
  - `Table` for the log (hash, message `1fr`, author, age);
  - `StatusBar` with segments by priority;
  - `Keymap`;
  - `AlertDialog` to confirm a discard.
- **Model:** files move between changes and staged. A commit takes the staged files, prepends a log row and clears the summary. A discard drops a change. The diff follows the cursor in the tree.
- **Under 60 cells:** `Tabs` (Files · Diff · Log) holds one pane at a time. The commit form sits under the files, and `⏎` on a file opens its diff tab. The status bar keeps the branch, then `?`.

### 2. top: a system monitor

At 120 × 36:

```
┌ cpu ─────────────────────────────┬ memory ───────────────────────────┬ load ───────────────────────────────────────┐
│ 0  ███████████▍          62%     │ used  ███████████████▊  11.2/16G  │  1m  ▂▃▅▆▇▆▅▃▂▃▅▆▇█▇▆▅▄▃▂▃▄▅▆   2.41          │
│ 1  ████▏                 23%     │ cache ████▌              3.1/16G  │  5m  ▃▃▄▄▅▅▆▆▆▅▅▄▄▄▅▅▅▆▆▆▅▅▅▅   1.98          │
│ 2  ██████████████████▉   99%     │ swap  ▏                  0.1/2G   │ 15m  ▄▄▄▄▄▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅   1.62          │
├ processes ───────────────────────┴───────────────────────────────────┴─────────────────────────────────────────────┤
│    PID  NAME                CPU% ▼  MEM      TIME      STATE                                                       │
│ ▸ 4121  node                  38.2  412M     1:02:11   running                                                     │
│   4380  postgres              12.0  1.1G    12:44:02   sleeping                                                    │
│   ⋮                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 ⠹ live · every 1s   42 processes   sort cpu ▼   ⏎ details  k kill  / filter  s sort  p pause  ? keys
```

- **Parts:**
  - `Panes`;
  - `Meter` per CPU and per memory class, toned by threshold (success, warning, danger, each with its mark);
  - `Sparkline` per load average, with a text alternative;
  - `Spinner` in the status bar while live;
  - `Table`: sortable, cursor, a selection to kill several;
  - `TextField` for the filter;
  - `AlertDialog` to confirm a kill;
  - `StatusBar`, `Keymap` and `useTick`.
- **Model:** a seeded simulator advanced one step per tick. `p` pauses it, and reduced motion slows it to a step every few seconds with the spinner still. Values change in place: no row reorders under the cursor until the sort is asked for again, so the table never jumps while it is read.
- **Under 60 cells:**
  - one aggregate CPU meter, one memory meter, and one sparkline (1m);
  - the table keeps PID, NAME and CPU%, and the rest is under `⏎` details in a `Dialog`.

### 3. settings: a settings form

At 120 cells it sits in a centred column of 72, at 40 it is stacked (`Form` already lines up and stacks under 60):

```
┌ Settings ──────────────────────────────────────────────────────────────┐
│ ┌ Profile ───────────────────────────────────────────────────────────┐ │
│ │ Name          [Ada Lovelace              ]                         │ │
│ │ Email*        [ada@                      ]                         │ │
│ │               ✗ Enter an email address.                            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌ Appearance ────────────────────────────────────────────────────────┐ │
│ │ Theme         [ ink                    ▾ ]                         │ │
│ │ Mode          ● system  ○ light  ○ dark                            │ │
│ │ Density       [ normal                 ▾ ]                         │ │
│ │ Motion        [■□] reduce                                          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌ Notifications ─────────────────────────────────────────────────────┐ │
│ │               [✓] Mentions  [ ] Every push  [✓] Security alerts    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ╔ Danger ════════════════════════════════════════════════════════════╗ │
│ ║ Delete this account and everything in it.      [!Delete account ] ║ │
│ ╚════════════════════════════════════════════════════════════════════╝ │
│                                          [ Reset ]  [ Save mod+s ]     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Parts:**
  - `Form` and `Fieldset` per section;
  - `TextField`, `Select`, `RadioGroup`, `Switch` and `CheckboxGroup`;
  - `Callout tone="danger"` or a danger frame for the last section;
  - `AlertDialog`, which asks for the account name typed back before Delete enables;
  - `Button`, and `StatusMessage` for "Saved".
- **The showcase:** Theme, Mode and Density apply live to the form's own subtree (`data-rk-theme`, `data-theme`, `data-density`), with `GlyphProvider` following the theme. So choosing ink rounds every corner in the form while the page around it stays as it was. This is the theme machinery shown in its own UI.
- **Validation:** on submit, server-style errors arrive through `validationErrors` after a simulated round trip. Save is disabled until something changes, and Reset returns to the saved values.

### Parts, and where each is

| Part | Where it is | Needed by |
| --- | --- | --- |
| Frame, List, Tree, Table, Button, Badge, KeyHint, Keymap, Divider, Form, Fieldset, Callout | main | all |
| Panes | #101 | git, top |
| StatusBar | #102 | git, top |
| CodeBlock | #103 | git |
| Tabs | #104 | git (under 60) |
| TextField | #117 | all |
| Checkbox | #119 | git, settings |
| Switch | #114 | settings |
| RadioGroup | #123 | settings |
| Select | #152 | settings |
| Dialog and AlertDialog | #169 | all |
| **Progress: Meter, Sparkline and Spinner (0101)** | **nobody yet** | **top** |

### Build order

1. **settings**, first in line once TextField, Select and Dialog land. It is also 0046's Form patterns: `settings-section` and `confirm-destructive` are cut from it as items of their own.
2. **git**, once Panes, StatusBar and CodeBlock land.
3. **top**, last, on Progress.

### Tests

Each page:

- is walked by keyboard alone in Playwright, at 40 and 120 cells and at touch density;
- passes axe, conformance and continuity in the built site, the way the component pages are checked;
- has its text snapshot compared against the seeded model.

Copy as text and as ANSI waits on 0105.
