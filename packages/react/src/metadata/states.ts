/**
 * The state vocabulary (cairn 0118), as data.
 *
 * One row per state, each with one drawing, so every component draws a state
 * the same way and its metadata names the row rather than describing it again.
 * The decision is the source; this is its table, in the order it gives.
 *
 * States never change geometry: a state changes attributes, colour, border
 * weight or a glyph in a reserved cell, and never adds or removes a cell.
 *
 * `danger` is not here. It is a variant (`data-variant="danger"`), and a
 * variant's metadata comes from the component's variant helper (0032).
 */

/** One row of the table. */
export interface StateRow {
  /** The name a component's metadata uses for it. */
  readonly name: string;
  /**
   * What the CSS selects on. React Aria writes the `data-*` attributes; two
   * rows read the platform's own attribute or pseudo-class instead.
   */
  readonly selectors: readonly string[];
  /** How it is drawn on the grid. */
  readonly drawnAs: string;
  /** What carries it once colour is gone: forced colors, greyscale, a reader who cannot tell hues apart. */
  readonly withoutColour: string;
  /**
   * Drawn by `@rockaway/css` for every element that takes it, not by the
   * component's own stylesheet. The focus ring is the one such row: a
   * component has it by being focusable.
   */
  readonly global: boolean;
}

const ROWS = [
  {
    name: 'hover',
    selectors: ['[data-hovered]'],
    drawnAs:
      'underline on the label; on an element underlined at rest, bold instead. Never a double underline, which a terminal cannot draw (0209)',
    withoutColour: 'underline, or bold',
    global: false,
  },
  {
    name: 'focus-unframed',
    selectors: [':focus-visible', '[data-focus-visible]'],
    drawnAs: 'the focus ring (0061): an outline that costs no cell',
    withoutColour: 'outline',
    global: true,
  },
  {
    name: 'focus-framed',
    selectors: ['[data-focus-visible]'],
    drawnAs: 'the frame goes heavy in border.focus',
    withoutColour: 'weight',
    global: false,
  },
  {
    name: 'pressed',
    selectors: ['[data-pressed]'],
    drawnAs: 'reverse video; a filled control reverses back',
    withoutColour: 'reverse',
    global: false,
  },
  {
    name: 'cursor',
    selectors: ['[data-focused]'],
    drawnAs: "the cursor mark ▸ in the row's reserved mark cell",
    withoutColour: 'mark',
    global: false,
  },
  {
    name: 'selected',
    selectors: ['[data-selected]'],
    drawnAs: 'reverse video; in multi-select also ✓ in a second reserved cell',
    withoutColour: 'reverse, mark',
    global: false,
  },
  {
    name: 'checked',
    selectors: ['[data-selected]', '[data-indeterminate]'],
    drawnAs: "✓ or – between the control's delimiters",
    withoutColour: 'mark',
    global: false,
  },
  {
    name: 'expanded',
    selectors: ['[data-expanded]'],
    drawnAs: '▾ when expanded, ▸ when collapsed',
    withoutColour: 'mark',
    global: false,
  },
  {
    name: 'disabled',
    selectors: ['[data-disabled]'],
    drawnAs: 'dim (fg.disabled) and the default cursor; forced colors maps it to GrayText',
    withoutColour: 'dim, which is an attribute',
    global: false,
  },
  {
    name: 'invalid',
    selectors: ['[data-invalid]'],
    drawnAs:
      'a ✗ mark before the message in fg.danger; a framed control goes heavy in border.danger',
    withoutColour: 'mark, weight',
    global: false,
  },
  {
    name: 'required',
    selectors: ['[data-required]'],
    drawnAs: '* after the label, aria-hidden, because the semantics are aria-required',
    withoutColour: 'mark',
    global: false,
  },
  {
    name: 'read-only',
    selectors: ['[data-readonly]'],
    drawnAs: "the value without the control's track or ground",
    withoutColour: 'the ground removed',
    global: false,
  },
  {
    name: 'current',
    // 0118 names aria-current; React Aria reflects it as data-current, which
    // is what a stylesheet selects.
    selectors: ['[aria-current]', '[data-current]'],
    drawnAs: 'bold, and the cursor mark',
    withoutColour: 'bold, mark',
    global: false,
  },
  {
    name: 'pending',
    selectors: ['[data-pending]'],
    drawnAs: 'the spinner (0101) in a reserved cell',
    withoutColour: 'glyph',
    global: false,
  },
  {
    name: 'placeholder',
    selectors: [':placeholder-shown'],
    drawnAs: 'dim',
    withoutColour: 'dim',
    global: false,
  },
] as const;

/** A row of the state vocabulary, by name. */
export type StateName = (typeof ROWS)[number]['name'];

/** The table, in the order 0118 gives it. */
export const stateVocabulary: readonly StateRow[] = ROWS;
