/**
 * A page's outline (cairn 0104): its sections, for the context pane and the
 * status bar. Read from the page's rendered HTML, so a Markdown page, an MDX
 * page and a generated one are outlined the same way.
 *
 * Markdown's headings already have ids. A heading written in a template has
 * none, so it is given one from its text, the way Markdown's are made, and the
 * outline links to every section whichever way it was written.
 */

export interface Heading {
  /** 2 for a section, 3 for a section within one. */
  readonly depth: 2 | 3;
  readonly id: string;
  readonly text: string;
}

export interface Outline {
  /** The page, with an id on every heading in the outline. */
  readonly html: string;
  readonly headings: readonly Heading[];
}

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
};

/** The text of some HTML: its tags dropped and the common entities read. */
export function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (whole, name: string) => {
      const named = ENTITIES[name.toLowerCase()];
      if (named !== undefined) return named;
      if (name.startsWith('#x') || name.startsWith('#X')) {
        return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
      }
      if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
      return whole;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** An id from a heading's text, as GitHub makes one: lower case, words joined by hyphens. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .trim()
    .replace(/\s/g, '-');
}

const HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g;
const ID = /\sid="([^"]*)"/;

/**
 * The page's sections, in order. Headings with no id are given one from their
 * text, made unique on the page.
 */
export function outline(html: string): Outline {
  const taken = new Set<string>();
  for (const match of html.matchAll(/\sid="([^"]*)"/g)) taken.add(match[1] as string);
  const headings: Heading[] = [];
  const out = html.replace(HEADING, (whole, level: string, attrs: string | undefined, inner: string) => {
    const depth = Number(level) as 2 | 3;
    const text = textOf(inner);
    const existing = attrs?.match(ID)?.[1];
    if (existing !== undefined) {
      headings.push({ depth, id: existing, text });
      return whole;
    }
    const base = slugify(text) || 'section';
    let id = base;
    for (let n = 1; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    headings.push({ depth, id, text });
    return `<h${level} id="${id}"${attrs ?? ''}>${inner}</h${level}>`;
  });
  return { html: out, headings };
}
