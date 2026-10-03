/**
 * The site's Markdown pipeline (cairn 0143). The look is `.rk-prose`, from
 * `@rockaway/css`; these plugins only fix what Markdown cannot say.
 */
import path from 'node:path';
import { shapeOf, stringWidth } from '@rockaway/grid';
import { type CalloutTone, calloutChrome } from '@rockaway/react/callout';
import { borderSets as glyphSets } from '@rockaway/tokens';
import type { Element, ElementContent, Root, RootContent } from 'hast';

/** Where links that leave the site go: the repository, at main. */
export const REPOSITORY = 'https://github.com/oddurs/rockaway';

const root = path.resolve(import.meta.dirname, '../../../..');

interface File {
  readonly path?: string;
}

function walk(node: Root | Element, visit: (element: Element) => void): void {
  for (const child of node.children as ElementContent[]) {
    if (child.type !== 'element') continue;
    visit(child);
    walk(child, visit);
  }
}

const docs = path.join(root, 'docs');

/**
 * A document from the repository links to its neighbours by relative path,
 * which is right on GitHub and a 404 here. A link to another document in
 * `docs/` goes to its page on the site (`concept.md#x` is `/concept/#x`, under
 * the base); a link to anything else in the repository goes to the file on
 * GitHub. Links to anchors, to the site and to other origins are left alone.
 */
export function rehypeRepositoryLinks(
  options: { readonly base?: string } = {},
): (tree: Root, file: File) => void {
  const base = options.base ?? '/';
  return (tree, file) => {
    if (!file.path) return;
    const from = path.dirname(file.path);
    walk(tree, (element) => {
      const href = element.properties.href;
      if (element.tagName !== 'a' || typeof href !== 'string') return;
      if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return;
      const [target = '', hash] = href.split('#');
      const absolute = path.resolve(from, target);
      const anchor = hash ? `#${hash}` : '';
      if (path.dirname(absolute) === docs && absolute.endsWith('.md')) {
        element.properties.href = `${base}${path.basename(absolute, '.md')}/${anchor}`;
        return;
      }
      const resolved = path.relative(root, absolute);
      if (resolved.startsWith('..')) return;
      element.properties.href = `${REPOSITORY}/blob/main/${resolved}${anchor}`;
    });
  };
}

/**
 * Code blocks and tables scroll when they are wider than the measure, and a
 * box that scrolls has to be reachable by keyboard to be scrolled by one.
 *
 * A table is wrapped, and the wrapper scrolls instead (cairn 0208). The
 * overflow marks that show a reader there is more to either side need one box
 * to hold, and a table is several: its header and its body.
 */
export function rehypeScrollable(): (tree: Root) => void {
  const visit = (node: Root | Element): void => {
    node.children = node.children.map((child) => {
      if (child.type !== 'element') return child;
      if (child.tagName === 'pre') child.properties.tabIndex = 0;
      if (child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['rk-scroll-marks'], tabIndex: 0 },
          children: [child],
        } satisfies Element;
      }
      visit(child);
      return child;
    }) as typeof node.children;
  };
  return visit;
}

/** The prose measure, in cells, and the blank cells between table columns. */
export const MEASURE = 80;
const GAP = 2;

function text(node: Element | ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type !== 'element') return '';
  return node.children.map(text).join('');
}

/**
 * Column widths, in cells, that fit `budget` the way a terminal program fits
 * a table to its window: every column gets its longest word, and what is
 * left goes to the columns that want it, in proportion to how much more they
 * want. Whole cells only; the remainder goes to the largest fractions. If
 * even the longest words do not fit, the table keeps them and scrolls.
 */
export function fitColumns(
  natural: readonly number[],
  minimum: readonly number[],
  budget: number,
): number[] {
  const floor = minimum.map((min, i) => Math.min(min, natural[i] ?? min));
  const spare = budget - floor.reduce((a, b) => a + b, 0);
  const wants = natural.map((n, i) => n - (floor[i] ?? 0));
  const wanted = wants.reduce((a, b) => a + b, 0);
  if (spare <= 0 || wanted === 0) return floor;
  if (wanted <= spare) return [...natural];
  const shares = wants.map((w) => (w * spare) / wanted);
  const widths = floor.map((f, i) => f + Math.floor(shares[i] ?? 0));
  let left = spare - shares.reduce((a, s) => a + Math.floor(s), 0);
  const order = shares
    .map((s, i) => [s - Math.floor(s), i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    widths[i] = (widths[i] ?? 0) + 1;
    left -= 1;
  }
  return widths;
}

/**
 * A table wider than the measure would otherwise not wrap at all (prose.css
 * never lets the browser squeeze one, because it squeezes in fractions of a
 * pixel). This gives each column a width in whole cells that fits the
 * measure, so the cells wrap inside it and the table stays on the grid.
 */
export function rehypeTableColumns(): (tree: Root) => void {
  return (tree) => {
    walk(tree, (table) => {
      if (table.tagName !== 'table') return;
      const rows: Element[] = [];
      walk(table, (el) => {
        if (el.tagName === 'tr') rows.push(el);
      });
      const natural: number[] = [];
      const minimum: number[] = [];
      for (const row of rows) {
        const cells = row.children.filter(
          (c): c is Element => c.type === 'element' && (c.tagName === 'th' || c.tagName === 'td'),
        );
        cells.forEach((cell, i) => {
          const content = text(cell).trim().replace(/\s+/g, ' ');
          const longestWord = Math.max(0, ...content.split(' ').map(stringWidth));
          natural[i] = Math.max(natural[i] ?? 0, stringWidth(content));
          minimum[i] = Math.max(minimum[i] ?? 0, longestWord);
        });
      }
      const gaps = GAP * Math.max(0, natural.length - 1);
      if (natural.reduce((a, b) => a + b, 0) + gaps <= MEASURE) return;
      const widths = fitColumns(natural, minimum, MEASURE - gaps);
      const cols: Element[] = widths.map((width, i) => ({
        type: 'element',
        tagName: 'col',
        properties: { style: `--rk-cols: ${width + (i < widths.length - 1 ? GAP : 0)}` },
        children: [],
      }));
      table.children.unshift({
        type: 'element',
        tagName: 'colgroup',
        properties: {},
        children: cols,
      });
    });
  };
}

/** A run of one shaped character, as a cell box: `──` is one box two cells wide. */
function cell(ch: string, count: number, key: string): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      dataRkShape: key,
      ...(count > 1 ? { style: `--rk-run: ${count}` } : {}),
    },
    children: [{ type: 'text', value: ch.repeat(count) }],
  };
}

/** Text, with every character the cell draws taken out into a cell of its own. */
function shapeText(value: string): ElementContent[] {
  const out: ElementContent[] = [];
  let plain = '';
  const chars = [...value];
  for (let i = 0; i < chars.length; ) {
    const ch = chars[i] as string;
    const shape = shapeOf(ch);
    if (!shape) {
      plain += ch;
      i += 1;
      continue;
    }
    if (plain) out.push({ type: 'text', value: plain });
    plain = '';
    // A line across the cell joins its neighbour with no seam, so a run of
    // them is one box; anything else is a cell each.
    let count = 1;
    while (shape.spans && chars[i + count] === ch) count += 1;
    out.push(cell(ch, count, shape.key));
    i += count;
  }
  if (plain) out.push({ type: 'text', value: plain });
  return out;
}

/**
 * Box drawing and blocks in prose, in a diagram in a code block or a `┌` in a
 * sentence, are drawn by the cell (0116), not the font: the font's strokes
 * stop short of the row at most densities, and the site's font leaves those
 * characters out. The character stays, transparent, so copying still gives
 * the diagram.
 */
export function rehypeCellGlyphs(): (tree: Root) => void {
  const visit = (node: Root | Element): void => {
    const next: RootContent[] = [];
    for (const child of node.children as RootContent[]) {
      if (child.type === 'text') next.push(...shapeText(child.value));
      else {
        if (child.type === 'element') visit(child);
        next.push(child);
      }
    }
    node.children = next as typeof node.children;
  };
  return (tree) => visit(tree);
}

/** GitHub's alert blocks, and the callout each becomes. `IMPORTANT` is a note under its own name. */
const ALERTS: Readonly<Record<string, { tone: CalloutTone; title?: string }>> = {
  NOTE: { tone: 'note' },
  TIP: { tone: 'tip' },
  IMPORTANT: { tone: 'note', title: 'Important' },
  WARNING: { tone: 'warning' },
  CAUTION: { tone: 'danger' },
};

const ALERT = /^\s*\[!([A-Z]+)\]\s*/;

/** One character the cell draws, as prose sets one: a box with the character in it. */
function shaped(ch: string, className?: string): Element {
  const shape = shapeOf(ch);
  return {
    type: 'element',
    tagName: 'span',
    properties: {
      ...(shape ? { dataRkShape: shape.key } : {}),
      ...(className === undefined ? {} : { className: [className] }),
    },
    children: [{ type: 'text', value: ch }],
  };
}

function span(className: string, children: ElementContent[]): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: [className], ariaHidden: 'true' },
    children,
  };
}

/** The alert a blockquote opens with, and the blockquote with the marker taken out. */
function alertOf(quote: Element): { tone: CalloutTone; title?: string } | undefined {
  const first = quote.children.find((c): c is Element => c.type === 'element');
  if (first?.tagName !== 'p') return undefined;
  const lead = first.children[0];
  if (lead?.type !== 'text') return undefined;
  const match = ALERT.exec(lead.value);
  const alert = match ? ALERTS[match[1] ?? ''] : undefined;
  if (!match || !alert) return undefined;
  lead.value = lead.value.slice(match[0].length);
  if (lead.value === '') first.children.shift();
  if (first.children[0]?.type === 'element' && first.children[0].tagName === 'br') {
    first.children.shift();
  }
  if (first.children.length === 0) quote.children.splice(quote.children.indexOf(first), 1);
  return alert;
}

/**
 * GitHub's alert blocks (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`,
 * `[!CAUTION]`) become callouts (cairn 0140), set as the static callout: the
 * chrome Callout draws, with its lines drawn by the cell, so a page of prose
 * still runs no script. The tone's weight, mark and title are Callout's own,
 * from `calloutChrome`; the content is the quote's, unchanged.
 */
export function rehypeCallouts(): (tree: Root) => void {
  const visit = (node: Root | Element): void => {
    node.children.forEach((child, index) => {
      if (child.type !== 'element') return;
      const alert = child.tagName === 'blockquote' ? alertOf(child) : undefined;
      if (!alert) {
        visit(child);
        return;
      }
      (node.children as RootContent[])[index] = callout(alert, child.children);
    });
  };
  return (tree) => visit(tree);
}

/** The static callout's elements: the edges and sides drawn by the cell, the content between. */
function callout(alert: { tone: CalloutTone; title?: string }, content: ElementContent[]): Element {
  const chrome = calloutChrome(alert);
  const box = glyphSets[chrome.border];
  const side = (): Element => {
    const el = shaped(box.vertical, 'rk-callout-side');
    el.properties.ariaHidden = 'true';
    return el;
  };
  const heading: Element = {
    type: 'element',
    tagName: 'span',
    properties: { className: ['rk-callout-heading'] },
    children: [{ type: 'text', value: ` ${chrome.heading} ` }],
  };
  return {
    type: 'element',
    tagName: 'aside',
    properties: {
      className: ['rk-callout-static'],
      dataTone: chrome.tone,
      role: 'note',
      ariaLabel: chrome.label,
    },
    children: [
      span('rk-callout-edge', [
        shaped(box['top-left']),
        heading,
        shaped(box.horizontal, 'rk-callout-run'),
        shaped(box['top-right']),
      ]),
      side(),
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['rk-callout-body'] },
        children: content.filter((c) => c.type !== 'text' || c.value.trim() !== ''),
      },
      side(),
      span('rk-callout-edge', [
        shaped(box['bottom-left']),
        shaped(box.horizontal, 'rk-callout-run'),
        shaped(box['bottom-right']),
      ]),
    ],
  };
}
