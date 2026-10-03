# Prose on the grid

Every element Markdown can produce, set by `.rk-prose` and nothing else. A
paragraph wraps at the measure, which is eighty cells, and every block below
it starts on a whole row. Inline, there is **strong**, *emphasis*, `code`, a
[link to the concept](https://github.com/oddurs/rockaway/blob/main/docs/concept.md),
and <kbd>⌘K</kbd>.

A long unbroken token has to break rather than scroll the page at forty
cells: https://github.com/oddurs/rockaway/blob/main/packages/css/src/prose.css

## Lists

A tight list is one item a row:

- Frames are data, not characters
- The cell is `1ch` by `1lh`
  - and a nested list hangs from its item
  - two cells further in
- Painting is a strategy

A loose list is spaced like paragraphs:

- The first item has a paragraph of its own, long enough to wrap onto a
  second row, where it lines up under the first word rather than the bullet.

- The second item follows a blank row.

Ten steps, so the numbers have to right-align in their column:

1. Install the packages
2. Import the CSS
3. Import the tokens
4. Pick a density
5. Pick a mode
6. Render a screen
7. Draw a frame in it
8. Put real elements in the content layer
9. Check conformance
10. Ship it

### A minor heading sits on its text

Unlike a section, which gets two blank rows above and a rule below.

#### Fourth level

##### Fifth level

###### Sixth level

These three are bold and dim, and otherwise the same size as everything else.

## Quotes

> A grid nobody can break is a grid people quietly abandon.
>
> The gutter runs the full height of the quote, across both paragraphs and
> the blank row between them.

## Code

```ts
import { Frame } from '@rockaway/react';

export function Panel() {
  return <Frame title="tokens" border="double" />;
}
```

## Tables

| Level      | Layout                | Frames                     | Spacing |
| ---------- | --------------------- | -------------------------- | ------: |
| `strict`   | whole cells           | glyphs only                |       1 |
| `standard` | whole cells           | glyphs or CSS rules        |     0.5 |
| `loose`    | whole cells for panes | any painter, radius allowed |    free |

---

<dl>
  <dt>Cell</dt>
  <dd>One character wide and one row tall.</dd>
  <dt>Density</dt>
  <dd>How tall a row is: dense, normal, airy or touch.</dd>
</dl>

The end.
