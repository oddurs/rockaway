/**
 * No accessible name holds a glyph (rule 3 of the component recipe, 0134;
 * this check is 0252).
 *
 * Chrome is drawn, not said: a frame's lines, a cursor's `▸`, a checkbox's
 * `✓`, a link's `↗` are `aria-hidden`, and the words beside them are the
 * name. A glyph that leaks into a name is read aloud as "black right-pointing
 * small triangle", and a story that finds the control by its plain words no
 * longer finds it. `checkField` holds a field's names to this; this holds
 * every other element a reader hears a name for.
 *
 * It reads the DOM only, by the routes a name is given here: `aria-labelledby`,
 * `aria-label`, a `<label>`, `alt`, and the content of an element named by its
 * content, minus whatever is `aria-hidden`. That is not the whole of the
 * accessible-name algorithm, but it is every route this system uses.
 */
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';

/** Box drawing, blocks, geometric shapes, dingbats and braille: chrome in any theme. */
export const GLYPH_RANGES: readonly (readonly [number, number])[] = [
  [0x2500, 0x259f],
  [0x25a0, 0x25ff],
  [0x2700, 0x27bf],
  [0x2800, 0x28ff],
];

/**
 * The marks that are punctuation as well: a name may hold them as prose does,
 * `Save as…`, `pages 1–10`, `Settings · Profile`.
 */
const PUNCTUATION: readonly string[] = ['ellipsis', 'dash', 'bullet'];

/** The text of an element a reader hears: its words, without what is `aria-hidden`. */
export function spoken(el: Element): string {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? '';
    else if (node instanceof Element && node.getAttribute('aria-hidden') !== 'true') {
      out += spoken(node);
    }
  }
  return out;
}

/** The theme's non-ASCII marks that are chrome, and never a word. */
function chromeMarks(glyphs: Glyphs, punctuation: boolean): Set<string> {
  return new Set(
    Object.entries(glyphs.mark)
      .filter(([name]) => punctuation || !PUNCTUATION.includes(name))
      .map(([, ch]) => ch)
      .filter((ch) => ch.trim() !== '' && (ch.codePointAt(0) ?? 0) > 0x7e),
  );
}

/**
 * Is this character chrome? `punctuation` counts the marks that are also
 * punctuation, as a field's label does: a label is a word or two, never prose.
 */
export function glyphTest(glyphs: Glyphs, punctuation = false): (ch: string) => boolean {
  const marks = chromeMarks(glyphs, punctuation);
  return (ch) => {
    const code = ch.codePointAt(0) ?? 0;
    return marks.has(ch) || GLYPH_RANGES.some(([from, to]) => code >= from && code <= to);
  };
}

/** Roles, explicit or implicit, whose name comes from their content. */
const FROM_CONTENT = new Set([
  'button',
  'link',
  'option',
  'tab',
  'treeitem',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'row',
  'cell',
  'gridcell',
  'columnheader',
  'rowheader',
  'heading',
  'checkbox',
  'radio',
  'switch',
  'tooltip',
]);

/** What a reader can hear a name for. */
const NAMED = [
  '[role]:not([role="presentation"]):not([role="none"]):not([role="generic"])',
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  'img[alt]',
  'h1, h2, h3, h4, h5, h6',
  'th',
  '[aria-label]',
  '[aria-labelledby]',
].join(', ');

const IMPLICIT: Readonly<Record<string, string>> = {
  A: 'link',
  BUTTON: 'button',
  SUMMARY: 'button',
  H1: 'heading',
  H2: 'heading',
  H3: 'heading',
  H4: 'heading',
  H5: 'heading',
  H6: 'heading',
  TH: 'columnheader',
};

/** An element's name, by the routes this system gives one. */
export function nameOf(el: Element): string {
  const doc = el.ownerDocument;
  const ids = el.getAttribute('aria-labelledby');
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => {
        const target = doc.getElementById(id);
        return target ? spoken(target) : '';
      })
      .join(' ')
      .trim();
  }
  const label = el.getAttribute('aria-label');
  if (label) return label.trim();
  const labels = (el as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    return [...labels]
      .map((l) => spoken(l))
      .join(' ')
      .trim();
  }
  if (el.tagName === 'IMG') return el.getAttribute('alt')?.trim() ?? '';
  const role = el.getAttribute('role') ?? IMPLICIT[el.tagName];
  if (role !== undefined && FROM_CONTENT.has(role)) return spoken(el).trim();
  return el.getAttribute('title')?.trim() ?? '';
}

export interface NameProblem {
  /** The element, as a selector-ish description: `button.rk-button`. */
  readonly element: string;
  readonly name: string;
  /** The glyphs the name holds. */
  readonly glyphs: string;
}

export interface NameReport {
  /** Elements with a name, checked. */
  readonly named: number;
  readonly problems: readonly NameProblem[];
}

export interface NameOptions {
  /** The theme's glyphs, whose marks a name must not hold. The default theme's when not given. */
  readonly glyphs?: Glyphs;
}

function describe(el: Element): string {
  const role = el.getAttribute('role');
  const cls = [...el.classList].filter((c) => c.startsWith('rk-')).slice(0, 2);
  return `${el.tagName.toLowerCase()}${cls.map((c) => `.${c}`).join('')}${role ? `[role=${role}]` : ''}`;
}

/**
 * Check every name under `root`. A field's own names are `checkField`'s, and
 * what is `aria-hidden`, or in a template, has no name a reader hears.
 */
export function checkNames(root: HTMLElement, options: NameOptions = {}): NameReport {
  const isGlyph = glyphTest(options.glyphs ?? themeGlyphs.default);
  const elements = [...(root.matches(NAMED) ? [root] : []), ...root.querySelectorAll(NAMED)].filter(
    (el) =>
      el.closest('[aria-hidden="true"], template') === null && el.closest('.rk-field') === null,
  );
  const problems: NameProblem[] = [];
  let named = 0;
  for (const el of elements) {
    const name = nameOf(el);
    if (name === '') continue;
    named++;
    const found = [...name].filter(isGlyph);
    if (found.length > 0) problems.push({ element: describe(el), name, glyphs: found.join('') });
  }
  return { named, problems };
}

/** The report as text, one line per problem. */
export function formatNames(report: NameReport): string {
  const lines = [`${report.named} name(s)`];
  if (report.problems.length > 0) {
    lines.push('', `${report.problems.length} problem(s):`);
    for (const p of report.problems) {
      lines.push(`  ${p.element}  the name "${p.name}" holds ${p.glyphs}, which is chrome`);
    }
  }
  return lines.join('\n');
}

/** Throws with the report when any name holds a glyph. */
export function expectNames(root: HTMLElement, options?: NameOptions): NameReport {
  const report = checkNames(root, options);
  if (report.problems.length > 0) {
    throw new Error(`a name holds a glyph\n${formatNames(report)}`);
  }
  return report;
}
