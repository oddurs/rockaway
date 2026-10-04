# Contributing to rockaway

Thank you for wanting to. A few things first:

- **Found a bug?** Open an issue with the bug template: what happens, what
  should, and the smallest code that shows it.
- **Want a component?** Check the [roadmap](ROADMAP.md) first. Many are already
  planned as cairn items. If yours is not there, open a component request.
- **Want to write code?** Planned work lives in [`cairn/items`](cairn/items),
  not in issues (see below). `cairn next` lists what is ready. Say on an issue
  or a draft pull request which item you are taking, so nobody else starts it.
- **Found a vulnerability?** Report it privately, as [SECURITY.md](SECURITY.md)
  says.

Everyone taking part is expected to follow the [code of conduct](CODE_OF_CONDUCT.md).

Before writing a component, read [the concept](docs/concept.md). Its ten
rules at the end are the contract every component is held to, and the pull
request template asks you to tick them.

## Setup

Node 24 (see `.nvmrc`) and pnpm 12.

```sh
pnpm install
pnpm --filter workbench exec playwright install chromium   # once, for story tests
pnpm check
```

`pnpm check` is what CI runs: Biome, TypeScript, the package builds, every
story as a browser test with axe, and the roadmap.

## Where work comes from

The roadmap and backlog are Markdown files in [`cairn/items`](cairn/items),
managed with [cairn](https://github.com/oddurs/cairn). Do not add TODO or
PLAN files; add an item.

```sh
cairn next                 # what is ready, ranked
cairn claim <id>           # take it before you start
cairn show <id> --criteria # the acceptance criteria, numbered
cairn tick <id> <n>        # as each one becomes true
cairn close <id>
cairn check                # must pass
```

Never edit `ROADMAP.md` by hand; it is rendered from the items.

Architecture choices are `decision` items. If a change contradicts one, change
the decision first, in its own pull request, with the reasoning.

## The rules that keep the system coherent

- **Everything is whole cells.** A box that measures 37.5px is a bug the conformance test catches. If you mean to break the grid, say so with `data-rk-offgrid="reason"` — the test prints every exception and its reason.
- **Never draw box characters by hand.** Ask the engine for a frame; the junction model owns every seam.
- **Frame glyphs are `aria-hidden`.** A screen reader hears a button, never `┌────┐`.
- **Semantic tokens only.** Component CSS reads `var(--rk-*)` semantic tokens. Needing a reference value means a semantic token is missing; add it.
- **Style from state.** Component CSS keys off class names and the `data-*` attributes React Aria emits. It never depends on a React API.
- **Stay in the layers.** All CSS lives inside `@layer rk.*`.
- **Every state has a story, and every component has a text snapshot.** Stories are the tests; the snapshot is documentation that cannot drift.
- **Let the page settle before you point at it.** A play function that hovers, presses with the pointer or compares geometry starts with `await settled()` from `apps/workbench/src/settled.ts`. Without it, the font and the screen's re-measure move the layout under the test in CI, and Chromium's own pointer events end a hover the moment it starts (cairn 0164).
- **Keyboard first, touch second, mouse third.** All three work, in that order of certainty.
- **The browser floor is Baseline 2024.** Newer CSS goes behind `@supports` with a working fallback.

## Adding a component

Until `docs/component-recipe.md` (cairn 0134) is written, this section is the
recipe, and Button and List are its worked examples.
A component adds one file, and one line to each barrel, and touches no other line:

- `packages/react/src/entries/<name>.ts`: `export { … } from '../components/<name>.tsx';`,
  naming the component's public values and types. This is `@rockaway/react/<name>`,
  the entry an islands site hydrates the component from, and the one list of
  what the component makes public: anything else the component file exports
  for its tests or metadata stays private. The build, the exports map and the
  package check all find it without being told.
- `packages/react/src/index.ts`: one `export * from './entries/<name>.ts';`.
- `packages/css/src/index.css`: one `@import "./components/<name>.css";` among
  the component imports, in path order.
- Every component file needs `'use client'` as its first line if it uses a hook
  or an event handler. CI fails the packed build without it.
- `packages/react/src/components/<name>.meta.ts`: its metadata (cairn 0047),
  added to the list in `src/metadata/index.ts`. Then run
  `pnpm --filter @rockaway/react metadata` to read its props and tokens.
  `test/metadata.test.ts` fails for a component exported without metadata, and
  for metadata that names a part, variant or state the component does not have.
- Anything that scrolls takes `rk-scroll`, so the browser draws no scrollbar of
  its own (decision 0207), and shows its position in cells: a scrollbar column
  drawn by the engine for a viewport that scrolls by rows (see List), or
  `rk-scroll-marks` for a region that scrolls across. A check after every story
  fails a scrolling element without it. Tag the stories `classic-scrollbars` to
  run them again with scrollbars that take room.

Both barrels merge with `merge=union` (see `.gitattributes`), so two branches
that each added a line rebase without a conflict. The joined lines can come out
of order: `pnpm format` sorts the TypeScript barrel, and the barrel test fails
until the CSS imports are back in path order. Union cannot judge, though: if
two branches changed the *same* line, the merge keeps both versions, and
`pnpm --filter @rockaway/react test` fails with the component listed twice.
Delete the stale line and run `pnpm format`. A component's public names live
in its entry, not in the barrel, so adding one never touches a shared line.

## Building a field

> Interim home. This section belongs in the component recipe
> (`docs/component-recipe.md`, cairn 0134), and moves there when that is
> written. Until then it is the recipe for Text field, Checkbox, Switch, Radio
> group and Select (0035–0038, 0042), and for any custom field.

A field is a React Aria field component with our parts on it (cairn 0127).
React Aria supplies the semantics: the label names the control, the
description and the error are linked to it by `aria-describedby`, and
validation is React Aria's. The parts decide where each piece sits on the grid.
Do not lay a field out yourself; put the parts in and let `field.css` place
them.

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
   `isDisabled` from the render props. Its focus state is its own: `kind="control"` (the default)
   goes heavy in `border.focus` while focus is inside it.

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

## Changesets

A change to what a published package ships needs a changeset. That means its
`src`, anything else in its `files`, and the fields of its `package.json` that
reach an install: `exports`, `dependencies`, `peerDependencies`, `sideEffects`,
`files`, `engines`, `publishConfig` and the like. Tests, stories, scripts,
devDependencies and the workbench do not. CI
fails a pull request that changes a package without naming it in a changeset,
and `pnpm changeset:check` runs the same check locally.

```sh
pnpm changeset
```

Write it for the person upgrading: what they can now do, or what they have to
change, in a paragraph, starting with a verb. The changesets already in
`.changeset/` are the voice to match.

If a change ships but no user could notice it (a comment, a rename inside a
module, a refactor with identical output), say so instead of skipping the step:

```sh
pnpm changeset --empty   # then write the reason in its body
```

An empty changeset with no reason in it does not pass.

Every package is below 1.0, and versions follow pre-1.0 semver (cairn 0172):

- **Breaking — minor, and it says so.** Something a user relies on is
  removed or renamed, or behaves differently with the same input: an export,
  a prop, a token, a CSS class or `data-*` attribute a stylesheet can select,
  an export path, or a default. A removed or renamed semantic token counts.
  Below 1.0 this is a **minor**, and the changeset's first line begins
  `Breaking:` and says what a user has to change. CI refuses a major changeset
  for a package below 1.0, and a `Breaking:` changeset marked patch.
- **Minor**: something is added and nothing existing changes, such as a
  component, a prop, an export, a token or a theme. A changed semantic token
  value is minor.
- **Patch**: a fix that makes the package do what it already said it did.

Pin a 0.x release with `~` (`~0.1.0`): a minor can break. 1.0 will be a
decision of its own, and from then on a breaking change is a major.

## Commits and pull requests

Small, focused pull requests. Reference the cairn item they close (`Closes cairn 0062`).
CI must be green.
