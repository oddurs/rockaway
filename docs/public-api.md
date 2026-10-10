# What is public

What you can rely on across a release, and what counts as breaking it
(decision `0153`). Until 1.0, a breaking change ships as a minor version whose
changelog entry begins **Breaking:** (`0172`), so pin a 0.x release with `~`.

The lists themselves are generated. Each package's tests write the package's
`API.md`, and a change to one is a change to the public API, read in review:
[grid](../packages/grid/API.md), [tokens](../packages/tokens/API.md),
[css](../packages/css/API.md) and [react](../packages/react/API.md).

## Public

| Surface | What is public | Where it is listed |
| --- | --- | --- |
| JavaScript and TypeScript | Every name an entry point in `exports` exports, and its type | `API.md`, by entry point |
| Component classes | The `.rk-*` class on a component's root, and on each part its metadata names | react `API.md`; each component's anatomy |
| Component attributes | Its variant attributes and values (`data-variant="fill"`), and the React Aria state attributes it draws (`data-pressed`) | react `API.md`; each component's states |
| Context attributes | Mode, density, motion, theme, and `data-rk-fill` for a control of your own | css `API.md` |
| Utility classes | `.rk-cells`, `.rk-rows`, `.rk-container`, `.rk-prose`, `.rk-scroll`, `.rk-screen`, `.rk-syntax-*` | css `API.md` |
| Cascade layers | The layer names and their order | css `API.md` |
| Tokens | Every token in the public tiers, by name, as its custom property: `bg`, `fg`, `border`, `syntax`, `attribute`, `focus`, `motion`, `cell`, `space`, `row`, `size`, `stroke`, `glyph`, `conformance` | tokens `API.md` |
| Themes | The theme names, and the stylesheet and terminal file paths for each | tokens `API.md` |
| The text snapshot format | What `bufferSerializer` and `toText` print, so your snapshots of our components hold | grid `API.md` |
| Component metadata | `meta.json`, as `meta.schema.json` describes it | the schema |

## Internal

These can change in any release, without a **Breaking:** entry:

- **The DOM between named parts.** Wrapper elements, their order, and any
  class that no metadata names (a painter's `.rk-row` and `.rk-run`, a
  component's inner layout).
- **The reference tier of tokens:** `ansi.*`, `palette.*` and `font.*`.
  Components never read it, and its shape has already changed twice (`0052`,
  `0065`). Read the semantic tier.
- **A component's own custom properties,** such as `--rk-button-end`, and
  any custom property not in the public tiers.
- **What the painters write:** `data-rk-shape`, `data-rk-painted`,
  `data-attrs`, and the spans they draw.
- **The layout of the DTCG source files.** The token names they resolve to
  are public. Which file each lives in is not.
- **Token values.** A changed value is a minor, not a breaking change: a
  colour can be fitted to the contrast gate, or a line box can grow to meet a
  target size.

## What breaking means

A change is breaking when something public is removed or renamed, or behaves
differently with the same input. That includes an export, a prop, a class or
attribute on the list above, a token name, a context attribute's values, or a
default.

Adding to any of these is not breaking, and neither is changing anything in
the internal list. If you depend on something internal, open an issue to ask
for it to be made public.
