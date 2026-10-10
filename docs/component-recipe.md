# The component recipe

How to add a component to rockaway: the files, the lines that wire them in,
and the checks it has to pass (cairn 0134). Button is the worked example
throughout. Frame, Divider, KeyHint and List are the other reference
implementations; read the nearest one before you start.

The ten rules a component is held to are in
[`concept.md`](concept.md#the-contract-a-component-is-held-to).
[The last section](#the-ten-rules-and-what-proves-each) lists them again, each
with the test that proves it, as the checklist to run through before review.

## The files

A component adds these files, and touches nothing else but the lines listed
after them. `<name>` is kebab-case (`key-hint`); `<Name>` is the export.

| File | What it holds |
| --- | --- |
| `packages/react/src/components/<name>.pure.ts` | The pure half: variants, chrome, the buffer function. No React, no `'use client'`. |
| `packages/react/src/components/<name>.tsx` | The component, with `'use client'` on its first line. |
| `packages/react/src/components/<name>.meta.ts` | Its metadata: what it is for, its anatomy, states, keys and snapshots. |
| `packages/react/src/components/<name>.fixture.ts` | The component rendered once, as small as it can be: `metadata.test.ts`'s evidence for its roles and attributes. |
| `packages/react/src/components/<name>.example.tsx` | `Example()`: the component as a reader first meets it, importing only `@rockaway/*` and React, and no wider than 35 cells, a kitchen-sink pane's. The site's page (apps/web, generated from the metadata) shows it with its source, rendered on the server and live as it nears the view, and the workbench's kitchen sink lays it out with every other component (0064). `metadata.test.ts` fails a component without one, and so does the site's build; it is never published. |
| `packages/react/src/components/<name>.snapshots.txt` | Its metadata's snapshots as the site draws them, written by `metadata.test.ts` (`vitest -u`) and checked by it after. |
| `packages/react/src/entries/<name>.ts` | `@rockaway/react/<name>`, and the one list of what it makes public. |
| `packages/css/src/components/<name>.css` | Its stylesheet, inside `@layer rk.components`. |
| `packages/react/test/<name>.test.ts` | The buffer function, in Node, with inline text snapshots. |
| `apps/workbench/src/components/<Name>.stories.tsx` | Its stories, which are its browser tests. |
| `.changeset/<name>.md` | What a user upgrading can now do. |

### The lines

Each barrel gets one line:

```ts
// packages/react/src/entries/button.ts
// `@rockaway/react/button`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export { buttonBuffer } from '../components/button.pure.ts';
export {
  Button,
  type ButtonProps,
  type ButtonTextOptions,
  type ButtonVariant,
} from '../components/button.tsx';
```

```ts
// packages/react/src/index.ts
export * from './entries/button.ts';
```

```css
/* packages/css/src/index.css, among the component imports, in path order */
@import "./components/button.css";
```

The metadata has no list to add to: `pnpm --filter @rockaway/react metadata`
writes the registry, `src/metadata/components.ts`, from every `*.meta.ts`
beside a component. It is generated, so on a merge conflict take either side
and run it again; `metadata.test.ts` fails while it is stale (0262).

The entry names the component's public values and types. Anything else its
files export, for tests or for the metadata, stays private. The build, the
exports map and `pnpm packages:check` all find a new entry without being told.
`barrels.test.ts` fails an entry that re-exports from anything but its own
component's two modules, and an index line that reaches past an entry.

Both barrels merge with `merge=union` (see `.gitattributes`), so two branches
that each added a line rebase without a conflict. The joined lines can come out
of order: `pnpm format` sorts the TypeScript barrel, and the barrel test fails
until the CSS imports are back in path order. Union cannot judge, though: if
two branches changed the *same* line, the merge keeps both, and
`pnpm --filter @rockaway/react test` fails with the component listed twice.
Delete the stale line and run `pnpm format`.

## The pure half

Split the component in two (cairn 0126). Everything that needs neither React
nor a browser goes in `<name>.pure.ts`:

- its variants, declared with `defineVariants` ([below](#variants));
- its chrome: the delimiters, marks and air it draws, read from a `Glyphs`;
- its buffer function, `<name>Buffer`, which draws the component as cells.

`<name>.tsx` imports these from the pure file. The pure file may import
*types* from the `.tsx` (`import type`), never values: a value import would
pull the client module, and React with it, into a server's graph.

A server component imports through the same entry. React's server loader turns
each `'use client'` module into a client reference and runs everything else, so
the pure half is a real function there.
`packages/react/test/server-component/render.ts` proves it, under the
`react-server` condition, against the built package. Add your buffer function
to its `checks` list, with the first row it should draw:

```ts
['buttonBuffer', pure.buttonBuffer('Go').row(0), '[ Go ]'],
```

Every module that uses a hook, context or an event handler starts with
`'use client'`. The packed build fails without it.

## Variants

Declare them with `defineVariants` from `packages/react/src/variants.ts`, in
the pure file. The props, the `data-*` attributes and the metadata all read
this one declaration:

```ts
const VARIANTS = { variant: ['default', 'fill', 'danger'] } as const;

export const buttonVariants = defineVariants(VARIANTS, { variant: 'default' });
```

The component's props extend `VariantProps<typeof buttonVariants>`. It calls
`buttonVariants.select(…)` and spreads `buttonVariants.dataAttributes(chosen)`
on its root. Never hand-write a union of the values, or set a variant's
`data-*` yourself. The metadata describes them with `describeVariants`, and
fails for a value the component does not write.

No variant and no state may change the component's size (decision 0118).
`variant-geometry.test.ts` reads every component stylesheet and fails any rule
keyed on a variant or a state that sets a size, padding, margin or inset.

## Glyphs

Every glyph comes from the theme, never from a literal (cairn 0119). In the
component, read them with `useGlyphs()` from `packages/react/src/glyphs.tsx`;
in the pure half, take a `Glyphs` argument, last, defaulting to the default
theme's. Border sets, marks (`mark.danger`, `mark.required`, `mark.external`
…), blocks, bars and the control delimiters are all there, and under the
`ascii` theme every one is ASCII. `no-literal-glyphs.test.ts` fails the build
on a box-drawing, block, geometric, dingbat or braille character anywhere in
`src/components`.

Frames, rules and scrollbars come from the engine (`frameBuffer`,
`dividerBuffer`, `scrollbarBuffer`), painted by `Screen` or `Frame`. Never
draw a line with the font: the cell renderer draws box-drawing and block
characters from the junction table, and the character stays in the DOM,
transparent, so copying and `screenshot()` still read it.

## States

Style every state from the `data-*` attributes React Aria puts on the element
(`data-hovered`, `data-pressed`, `data-focus-visible`, `data-selected`,
`data-disabled` …) and from semantic tokens: `--rk-fg-*`, `--rk-bg-*`,
`--rk-border-*`. Needing a reference token means a semantic one is missing;
add it to `@rockaway/tokens` first.

Each state is a row of the vocabulary in decision 0118
(`packages/react/src/metadata/states.ts`). The row says how the state is drawn
and what carries it without colour. Draw it the row's way, so a cursor looks
the same in every component.

Reverse video needs one more block. Under forced colours the browser paints a
canvas-coloured backplate behind text, and reversed words vanish on it (0181);
and a shape the cell draws is inked in the reader's text colour, which in
reverse video is the ground it sits on (0236). So the component's own
stylesheet opts its reversed state out, and inks any shape inside it in the
reversed figure:

```css
@media (forced-colors: active) {
  .rk-list-item[data-selected] {
    forced-color-adjust: none;
    /* A shape the cell draws in here takes the reversed figure (screen.css). */
    --rk-forced-ink: Canvas;
  }
}
```

`packages/css/test/reverse-opt-out.test.ts` finds every rule that draws words
in a ground colour, and fails one that no opt-out covers, or whose opt-out sets
no `--rk-forced-ink`. `packages/css/src/forced-colors.css` holds only what the
base reverses: painted cells in reverse video and a filled control's focus.

## Control, pane, or neither

The conformance levels (0123) treat two kinds of box differently, and see
them by an attribute the component writes on its own element (0182):

- **A control** is what a reader presses, checks or types into. Put
  `data-rk-control=""` on the element that is the control: Button's `button`,
  Link's `a`, Checkbox's row. At `standard`, a box inside it may sit on half a
  cell, for the padding that makes it read as one control; its own box is whole
  cells at every level.
- **A pane** is a region that holds other content: a frame, a list, a tree, a
  table, an overlay's surface. Put `data-rk-pane=""` on its root. At `loose`,
  panes (and screens) are the only boxes still held to whole cells, and what is
  inside one is free.
- **Neither** is text in a line (Badge, KeyHint), a rule (Divider), or a
  layout of other components (Form). List it in `NEITHER` in
  `test/metadata.test.ts`, with its reason.

The metadata reads which it is from the source (`grid.is`), and
`metadata.test.ts` fails a component that is none of the three. Real
components are held to each level in `Grid/Conformance`, in the stories
named *Real components*.

## Scrolling

Anything that scrolls takes `rk-scroll`, so the browser draws no scrollbar of
its own (decision 0207). It also shows where it is, in cells:

- a viewport that scrolls by rows draws a scrollbar column from the engine, as
  List does;
- a region that scrolls across takes `rk-scroll-marks` as well, and shows the
  theme's `‹` and `›` at each edge with more past it, as `less -S` does.

A check after every story fails any element that scrolls and still has a
native bar. Tag the component's stories `classic-scrollbars` (on the meta, for
the whole file) to run them again in a browser whose scrollbars take room, as
they do with a mouse attached.

## Metadata

`<name>.meta.ts` says what only a person can say: a summary, a description,
when to use it and when not (with the component to use instead), related
components, the anatomy, which 0118 state each part draws, the keyboard map,
and snapshots drawn by the buffer function. `button.meta.ts` is the one to
copy. Its `size` is drawn the same way: the component at its smallest (no
words, or the least room its chrome needs) and as drawn by default, which the
published metadata measures in cells (0167). A component can also list `knownIssues`: what is wrong outside its
control, such as a dependency's quirk a consumer may meet, and what to do
about it.

Then generate what can be read from the source, its props and tokens:

```sh
pnpm --filter @rockaway/react metadata   # writes src/metadata/extracted.ts
```

It also reads which marks the component writes, `data-rk-control` and
`data-rk-pane` (0182), and the level it holds (0167): the strictest level of
any workbench story that renders it with the conformance check on. No one
writes a level by hand, so it cannot claim more than the stories prove.

Run it again after any change to the component's props or stylesheet, to its
stories' levels, and after merging main. `test/metadata.test.ts` fails when `extracted.ts` is
stale, when a component is exported without metadata, and when the metadata
says something the component does not bear out: a part it does not render, a
variant value it does not write, a state it does not draw (or draws and does
not name), a focusable component with no focus state, a key KeyHint cannot
draw, or a related component with no metadata.

## The text snapshot

`packages/react/test/<name>.test.ts` tests the buffer function in Node, with
inline snapshots: every variant, every state that draws a mark, the `ascii`
theme, and that no state changes the width. `button.test.ts` is the model.

```sh
pnpm --filter @rockaway/react test -u   # writes the inline snapshots
```

Read each snapshot before you accept it. It is the component's documentation
as much as its test, and the site draws the metadata's snapshots from the same
function.

## Stories

The stories are the browser tests. Each one runs as a Vitest browser test, and
after it the workbench checks the page in every density and mode its project
walks (`.storybook/matrix.ts`). Title the file `Components/<Name>`.

**What to write.** A story for every variant and every state, and these by
name, so a reviewer finds them where they expect:

- **Every variant**, read back with `screenshot()` from
  `@rockaway/react/testing`, which reads a screen as text, and compared to the
  buffer function, cell for cell.
- **Painters**: the same content under `painter="glyph"` and
  `painter="rule"`, with equal `screenshot()`s.
- **Densities**: every row a whole number of cells at all four densities.
- **Keyboard**: the walkthrough with `userEvent.keyboard`, from Tab in to Tab
  out, with every key the metadata lists.
- **Hovered**, **Pressed**, **Disabled**, and the component's other states.
- **Touch**: at `data-density="touch"`, targets a finger can hit.
- **Greyscale**, when a state has a colour: under `filter: grayscale(1)` every
  state still reads.
- **Strict**: the component at `globals: { conformance: 'strict' }`.

**Let the page settle before you point at it.** A play function that hovers,
presses with the pointer or compares geometry starts with `await settled()`
from `apps/workbench/src/settled.ts` (cairn 0164). Without it, the font load
and the screen's re-measure move the layout under the test in CI, and
Chromium's own pointer events end a hover the moment it starts.

**Keep each story to about four instances.** The matrix walks every instance
in every cell, with screenshots, inside a story's thirty seconds on a shared
runner. Eight densities-by-painters in one story is two stories: split them by
painter (`Densities, glyph` and `Densities, rule`) or by density.

**Tags choose the browsers a story runs in** (`apps/workbench/vitest.config.ts`):

| Tag | Where the story runs | Use it for |
| --- | --- | --- |
| *(none)* | `storybook` (every density, light and dark) and `p3` | every story |
| `forced-colors` | only in a browser with forced colours on | the component under forced colours |
| `p3` | only on a p3 screen | a story about the p3 gamut |
| `zoom` | again at 200% | the component's continuity stories |
| `classic-scrollbars` | again with scrollbars that take room | anything that scrolls |

Storybook reads tags from the source without running it, so write the tag on
each story export, never inside a factory that builds the story:

```ts
export const ContinuityDenseGlyph: Story = { ...continuity('dense', 'glyph'), tags: ['zoom'] };
```

**What runs after every story** (`.storybook/preview.tsx`), so you never
assert it yourself:

- no native scrollbar (decision 0207);
- the field contract, when the story has a field ([below](#building-a-field));
- grid conformance: every box in whole cells, at the story's level;
- continuity: every painted stroke reaches its cell's edges and meets its
  neighbour, read from a real screenshot;
- target size (WCAG 2.5.8): 24px, or spaced to make up for it. Content
  visually hidden with `clip-path: inset(50%)` is not a target;
- axe, which fails the story on any violation.

A story that breaks one of these on purpose, to show the check failing, turns
that check off with a parameter: `conformance`, `continuity`, `targets`,
`scrollbars` or `fields: false`. A story that cannot be drawn in one cell of
the matrix leaves it with `matrix: { skip: [{ density, mode, reason }] }`, and
the reason is required.

**Run only your own file locally.** Many engineers share one machine, and a
full workbench run pushes the load past what the screenshot stories can bear.
CI runs the rest.

```sh
pnpm --filter workbench exec vitest run --project storybook src/components/Button.stories.tsx
```

## Known failures

`.storybook/known.ts` is the table of what the matrix finds that is decided
but not yet built, or deliberate and documented (cairn 0125). Nothing in it is
skipped. Each entry is still checked in every cell it covers, every failure it
excuses is printed in every run, and an entry that excuses nothing fails a full
run: the moment its ticket lands, the entry has to go.

An entry names the check, the rule, the failing element as a pattern, a
selector for what it is about (`present`), and optionally the stories,
densities and modes it covers. It gives the reason in a sentence a reader of
the run can act on, and the ticket that settles it. Add one only when the
failure is real and decided; otherwise fix the component. `dense-one-row` is
the permanent kind: dense is a documented opt-in that cannot meet 2.5.8.

## The changeset

A new component changes what `@rockaway/react` and `@rockaway/css` ship, so it
needs a changeset, minor for both:

```md
---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Button`: delimited text, `[ Publish ]`, that inverts when you press it. …
```

Write it for the person upgrading: what they can now do, in a paragraph,
starting with a verb. Say what the component draws and how its states read
without colour, and name its buffer function.
[CONTRIBUTING](../CONTRIBUTING.md#changesets) has the versioning rules.

## Building a field

A field is a React Aria field component with our parts on it (cairn 0127).
React Aria supplies the semantics: the label names the control, the
description and the error are linked to it by `aria-describedby`, and
validation is React Aria's. The parts decide where each piece sits on the grid.
Do not lay a field out yourself; put the parts in and let `field.css` place
them. This is the recipe for Text field, Checkbox, Switch, Radio group and
Select (0035–0038, 0042), and for any custom field.

1. **Put `fieldClass()` on the React Aria root.** It makes the root two
   columns of cells, a label column and a control column, and it is what a
   `Form` finds to line the field up with the others.

   ```tsx
   <AriaTextField {...props} className={fieldClass('rk-text-field', className)}>
   ```

2. **Put the parts inside, in this order:** the label, the control, the
   description, the error. Each part is placed by column and flows down in
   source order, so the order is the layout.

   ```tsx
   {({ isRequired }) => (
     <>
       <Label isRequired={isRequired}>{label}</Label>
       <span className="rk-text-field-box">…the control…</span>
       {description === undefined ? null : <Description>{description}</Description>}
       <FieldError>{errorMessage}</FieldError>
     </>
   )}
   ```

3. **Pass `isRequired` from the render props to `Label`.** The label draws the
   mark in a cell it keeps either way, so required moves nothing; the control
   carries `aria-required`, so the mark is `aria-hidden`. Nothing else can tell
   the label: React Aria does not put required in any context a label reads.
   If you forget, `checkField` (below) says so.

4. **Always render `<FieldError>`.** It renders nothing until the field is
   invalid, and then the cross and the message, from the field's own
   validation unless it is given words. Do not make it, or anything near it, a
   live region: on a failed submit focus moves to the first invalid control
   and the error is heard there, as part of its description. A live region
   would say it twice.

5. **A control that carries its own words has no `Label`.** A checkbox is
   `[✓] Sign commits`: its root still takes `fieldClass()`, so it sits in the
   control column of a form, and its description and error go under it.

6. **A framed control sets its label into its frame's top edge, with
   `FieldFrame`, not `Label`.** Put the `FieldFrame` where the control goes,
   inside the React Aria root; its visually hidden label takes the field's
   ids, so it names the control. Pass `isRequired`, `isInvalid` and
   `isDisabled` from the render props. Its focus state is its own:
   `kind="control"` (the default) goes heavy in `border.focus` while focus is
   inside it.

   ```tsx
   {({ isRequired, isInvalid }) => (
     <>
       <FieldFrame label={label} isRequired={isRequired} isInvalid={isInvalid}>
         <TextArea … />
       </FieldFrame>
       <FieldError />
     </>
   )}
   ```

7. **A group of controls is a `Fieldset` inside the React Aria group.** The
   group keeps its role and the legend becomes its label; the frame reads the
   group's invalid and disabled states itself. Pass `isRequired` from the
   group's render props: a checkbox group's state stops being required once
   something is checked, so it cannot be read from there. Fields put inside a
   standalone `Fieldset` line up with each other as a form's do, and stack
   under 60 cells of the fieldset's own width.

   ```tsx
   <AriaCheckboxGroup className={fieldClass('rk-checkbox-group')} {...props}>
     {({ isRequired }) => (
       <>
         <Fieldset legend={label} isRequired={isRequired}>{children}</Fieldset>
         <FieldError />
       </>
     )}
   </AriaCheckboxGroup>
   ```

8. **Draw states from the root's `data-*` attributes and 0118's table.** The
   parts already draw the label's states (required, disabled) and the error.
   The control draws its own: an unframed control's invalid colour, a framed
   one's weight (which `FieldFrame` does). No state may change a size; the
   error row is content and may add rows below, never cells beside.

9. **Prove the layout with the form model.** `formBuffer` is the text model of
   `field.css`. Give it your control's buffer (or, for a framed control, a
   function of the column's width) and snapshot it in Node; then render the
   same form in a story and assert that `screenshot()` of it equals the model.
   `Components/Form` in the workbench does exactly this, with sketches of the
   field family built from these parts, and is the place to copy from.

10. **The contract is checked for you.** After every story with a field on
    the page, the workbench runs `checkField` from `@rockaway/react/testing`
    (cairn 0203): the required mark is drawn exactly when the field is
    required, and is `aria-hidden`; the description and the error are in the
    control's `aria-describedby`; no name holds a glyph; nothing is a live
    region. `Grid/Field check` shows each failure. A story that breaks the
    contract on purpose sets `parameters: { fields: false }`.

## The ten rules, and what proves each

Run down this list before you ask for review. Each rule from
[`concept.md`](concept.md#the-contract-a-component-is-held-to) is given with
the test that proves it. Where a test proves only part of a rule, the rest is
named, and review is what holds it.

1. **Sized in cells, drawn by the frame engine.** Conformance after every
   story, at every density, fails any box that is not a whole number of cells
   unless it carries `data-rk-offgrid="reason"`. `no-literal-glyphs.test.ts`
   fails a box character written in `src/components`. Continuity after every
   story fails a stroke the font drew instead of the cell renderer.
2. **Both painters render it identically.** The component's **Painters**
   story: each painter's `screenshot()` equals the other's and the buffer's.
   Continuity reads each painter's strokes after it, and again at 200% in
   stories tagged `zoom`. A component without a Painters story has not proven
   this rule.
3. **Chrome is `aria-hidden`; the name never holds a glyph.** The stories find
   each control by `getByRole(role, { name })` with its plain words, so a glyph
   in the name fails to match. axe fails a control with no name. For a field,
   `checkField` after every story fails a mark that is not `aria-hidden` and a
   name that holds a glyph. Outside a field, `checkNames` after every story
   fails a name that holds a glyph, by any route a name is given:
   `aria-labelledby`, `aria-label`, a label, `alt` or its content. The
   ellipsis, dash and bullet marks are allowed there, because prose names hold
   them (0252).
4. **Behaviour comes from the behaviour layer.** The **Keyboard** story walks
   every key the metadata lists. `metadata.test.ts` fails a focusable component
   that names no focus state, and a key KeyHint cannot draw. `keymap.test.ts`
   covers the page's own shortcuts, bound with `useKeymap`.
   `no-hand-listeners.test.ts` fails a hand-written key or focus listener in a
   component: an `onKey…`, `onFocus…` or `onBlur…` prop or merged key,
   `addEventListener` for one, or an assigned handler. Keymap's one document
   listener is its listed exception (0252).
5. **Styled from `data-*` state and semantic tokens only.** `metadata.test.ts`
   fails a state the stylesheet draws and the metadata does not name, and one
   it names that nothing draws. `variant-geometry.test.ts` fails a variant or
   state that changes a size. `semantic-tokens.test.ts` in @rockaway/css fails
   a component stylesheet that reads a reference token (`--rk-ansi-*`,
   `--rk-palette-*`) or writes a colour of its own (0252).
6. **Ships a text snapshot.** The inline snapshots in `<name>.test.ts`, and
   the metadata's snapshots, which `metadata.test.ts` renders as the site draws
   them. The **Every variant** story ties the snapshot to the page:
   `screenshot()` equals the buffer.
7. **Conforms at `strict`, or declares its exception.** A story at
   `globals: { conformance: 'strict' }`: conformance after it fails any box off
   the grid, and any painter but the glyph one. Every `data-rk-offgrid` reason
   is printed in the run. That story is also what lets the metadata say the
   component holds `strict` (0167).
8. **Operable by keyboard alone, and with a finger at touch density.** The
   **Keyboard** story, and the target-size check after every story at every
   density, which holds touch to WCAG 2.5.8. The **Touch** story asserts the
   size itself. Dense is excused by `dense-one-row` in `known.ts`, as
   documented.
9. **State reads without colour.** Each state is a 0118 row, whose
   `withoutColour` column the metadata carries, and `metadata.test.ts` fails a
   state that is not a row. The text snapshot shows every mark. The
   **Greyscale** story reads the states back with the hue gone, and the
   `forced-colors` story with the reader's own colours.
10. **axe passes in light, dark and forced colours.** The a11y addon runs after
    every story and fails it on a violation. The `storybook` and `p3` projects
    run it again in the other mode, and stories tagged `forced-colors` run it
    under forced colours.

Before you push:

```sh
pnpm lint && pnpm typecheck
pnpm --filter @rockaway/react metadata
pnpm --filter @rockaway/react test
pnpm --filter workbench exec vitest run --project storybook src/components/<Name>.stories.tsx
pnpm changeset:check
cairn render && cairn check
```
