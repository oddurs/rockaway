/**
 * The site as an agent reads it (cairn 0048): `llms.txt`, `llms-full.txt`,
 * and a Markdown twin of every component and every document.
 *
 * All of it is generated at build from what the site already publishes for
 * people: the component metadata `@rockaway/react` builds (0047), as
 * `meta.json`, and the repository's `docs/`. Nothing here is written by hand
 * but the few lines that say what rockaway is, so a component that changes
 * changes here on the next build, and one that is added is listed.
 *
 * The format is llmstxt.org's: an H1, a blockquote summary, and H2 sections
 * of links, each with a line on what is behind it. The links point at the
 * Markdown twins, so an agent that follows one gets text, not a page.
 */
import path from 'node:path';
import type {
  AnatomyPart,
  ComponentMeta,
  MetadataDocument,
  PropMeta,
} from '@rockaway/react/metadata';
import { REPOSITORY } from './markdown.ts';

/** A document from `docs/`: its entry in `docs.ts`, and its Markdown. */
export interface DocSource {
  /** The file's name without `.md`: `concept`. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** The raw Markdown, as written for GitHub. */
  readonly body: string;
}

/** Where the site is: an absolute URL for a path within it. */
export type Locate = (pathWithinSite: string) => string;

/** `KeyHint` is `key-hint`: the address of its page and of its twin. */
export function slugOf(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** The twin of a component, within the site. */
export const componentTwin = (name: string): string => `components/${slugOf(name)}.md`;

/** The twin of a document, within the site. */
export const docTwin = (id: string): string => `${id}.md`;

const SUMMARY =
  'A TUI design system for the web: React components, CSS and design tokens, all on a ' +
  'monospace character grid. Everything is one cell wide and one row tall, with no halves.';

const ABOUT = [
  'Packages: `@rockaway/grid` (the engine: cells, boxes, text measurement, painters; no DOM), ' +
    '`@rockaway/tokens` (DTCG tokens, the ANSI palette, glyph sets), `@rockaway/css` (the CSS ' +
    'contract: cascade layers, reset, base, forced colors) and `@rockaway/react` (components, ' +
    'on React Aria).',
  'Import `@rockaway/css` once, then the components from `@rockaway/react`. Sizes are whole ' +
    'cells (`ch`) and rows (`lh`), never pixels; colour comes from the theme’s tokens, never ' +
    'from a literal; borders and marks are glyphs the theme chooses.',
  'Each component below is described by its metadata: what it is for, when not to use it, ' +
    'its parts and props, variants, states, keyboard, tokens, and snapshots of it drawn as ' +
    'text. The snapshots are the component’s own output, so they are what it draws.',
  'The same metadata, the tokens and the docs are served to agents over MCP by ' +
    '`@rockaway/mcp` (stdio, the `rockaway-mcp` command): `list_components`, ' +
    '`get_component`, `get_tokens` and `search_docs`.',
];

/**
 * A document from `docs/` links to its neighbours by relative path, which is
 * right on GitHub and nowhere else. Those links go to the file on GitHub, as
 * the site's own pipeline sends them; absolute links and anchors are left.
 */
export function absoluteLinks(markdown: string, fromDir = 'docs'): string {
  return markdown.replace(
    /(\]\()([^)\s]+)(\))/g,
    (whole, open: string, href: string, close: string) => {
      if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) return whole;
      const [target = '', hash] = href.split('#');
      const resolved = path.posix.normalize(path.posix.join(fromDir, target));
      if (resolved.startsWith('..')) return whole;
      return `${open}${REPOSITORY}/blob/main/${resolved}${hash ? `#${hash}` : ''}${close}`;
    },
  );
}

/** A document's twin: the Markdown as written, with its links made absolute. */
export function docMarkdown(doc: Pick<DocSource, 'body'>): string {
  return `${absoluteLinks(doc.body).trimEnd()}\n`;
}

/** A table cell: one line, with its pipes escaped so they do not split it. */
function cell(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|');
}

function table(head: readonly string[], rows: readonly (readonly string[])[]): string[] {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ];
}

/** A code span that survives backticks in what it holds. */
function code(text: string): string {
  const fence = text.includes('`') ? '``' : '`';
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${fence}${pad}${text}${pad}${fence}`;
}

function propRows(props: readonly PropMeta[]): string[][] {
  return props.map((p) => [
    code(p.name) + (p.required ? ' (required)' : ''),
    code(p.type),
    p.default === undefined ? '' : code(p.default),
    p.description ?? '',
  ]);
}

function anatomyPart(part: AnatomyPart): string[] {
  if (part.kind === 'element') {
    const chrome = part.chrome ? ', chrome: drawn and `aria-hidden`, never heard' : '';
    return [
      `### ${part.name}`,
      '',
      `Drawn inside, as ${code(`.${part.className}`)}${chrome}.`,
      '',
      part.description,
      '',
    ];
  }
  const role = part.role ? `, role ${code(part.role)}` : '';
  const lines = [`### ${part.name}`, '', `Imported${role}.`, '', part.description, ''];
  if (part.props.length > 0) {
    lines.push(...table(['Prop', 'Type', 'Default', 'Description'], propRows(part.props)), '');
  }
  if (part.inherits.length > 0) {
    lines.push(`Also takes: ${part.inherits.map(code).join(', ')}.`, '');
  }
  return lines;
}

/** What the levels see a component as, in words (0182). */
const AS: Readonly<Record<string, string>> = {
  control: 'a control: half a cell is allowed inside it at `standard`',
  pane: 'a pane: it holds whole cells even at `loose`',
};

/** Its size in cells and the level it holds (0167), and what the levels see it as. */
function onTheGrid(component: ComponentMeta): string[] {
  const { is, level, size } = component.grid;
  const cells = ({ width, height }: { width: number; height: number }) => `${width} × ${height}`;
  return [
    '## On the grid',
    '',
    `- Size: ${cells(size.min)} cells at its smallest, ${cells(size.default)} as drawn by default.`,
    `- Holds \`${level}\`: the strictest level a story renders it at with the conformance check on.`,
    is.length === 0
      ? '- To the conformance levels it is neither a control nor a pane.'
      : `- To the conformance levels it is ${is.map((mark) => AS[mark]).join(', and ')}.`,
    '',
  ];
}

/**
 * A component's twin: everything its metadata says, as Markdown, with its
 * snapshots as text blocks. Links to other components go to their twins.
 */
export function componentMarkdown(component: ComponentMeta, locate: Locate): string {
  const link = (name: string) => `[${name}](${locate(componentTwin(name))})`;
  const imports = component.anatomy.filter((p) => p.kind === 'import').map((p) => p.name);
  const lines: string[] = [
    `# ${component.name}`,
    '',
    `> ${component.summary}`,
    '',
    component.description,
    '',
    '```tsx',
    `import { ${imports.join(', ')} } from '@rockaway/react';`,
    '```',
    '',
    '## When to use',
    '',
    ...component.whenToUse.map((text) => `- ${text}`),
    '',
    '## When not to use',
    '',
    ...component.whenNotToUse.map(
      (w) => `- ${w.text}${w.instead ? ` Use ${link(w.instead)} instead.` : ''}`,
    ),
    '',
  ];

  if (component.related.length > 0) {
    lines.push(
      '## Related',
      '',
      ...component.related.map((r) => `- ${link(r.name)}: ${r.why}`),
      '',
    );
  }

  lines.push(...onTheGrid(component));

  lines.push('## Anatomy', '');
  for (const part of component.anatomy) lines.push(...anatomyPart(part));

  if (component.variants.length > 0) {
    lines.push('## Variants', '');
    for (const v of component.variants) {
      lines.push(
        `### ${v.name}`,
        '',
        `${v.description} Set as ${code(v.attribute)}; the default is ${code(v.default)}.`,
        '',
        ...v.values.map((value) => `- ${code(value.value)}: ${value.description}`),
        '',
      );
    }
  }

  if (component.states.length > 0) {
    const rows = component.states.map((s) => [
      code(s.state),
      s.part,
      s.selectors.map(code).join(', '),
      s.note ? `${s.drawnAs}. ${s.note}` : s.drawnAs,
      s.withoutColour,
    ]);
    lines.push(
      '## States',
      '',
      ...table(['State', 'Part', 'Selectors', 'Drawn as', 'Without colour'], rows),
      '',
    );
  }

  const a11y = component.accessibility;
  lines.push(
    '## Accessibility',
    '',
    `- Name: ${a11y.name}`,
    `- Announces: ${a11y.announces}`,
    `- Type-ahead: ${a11y.typeAhead ? 'yes, a printable character moves to the next match' : 'no'}`,
    ...a11y.notes.map((note) => `- ${note}`),
    '',
  );
  if (a11y.keyboard.length > 0) {
    const rows = a11y.keyboard.map((k) => [k.keys.map(code).join(', '), k.action]);
    lines.push(...table(['Keys', 'Action'], rows), '');
  }

  if (component.tokens.length > 0) {
    lines.push('## Tokens', '', component.tokens.map(code).join(', '), '');
  }

  lines.push('## Snapshots', '');
  for (const s of component.snapshots) {
    // A fence longer than any run of backticks in the drawing.
    const longest = Math.max(2, ...(s.text.match(/`+/g) ?? []).map((run) => run.length));
    const fence = '`'.repeat(longest + 1);
    lines.push(`### ${s.title}`, '');
    if (s.description) lines.push(s.description, '');
    lines.push(`${fence}text`, s.text, fence, '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

/** What the agent files are made from. */
export interface Site {
  readonly metadata: MetadataDocument;
  /** In the order they are listed: the order of `docs.ts`. */
  readonly docs: readonly DocSource[];
  readonly locate: Locate;
}

function preamble(): string[] {
  return ['# rockaway', '', `> ${SUMMARY}`, '', ...ABOUT.flatMap((p) => [p, ''])];
}

/** `llms.txt`: what rockaway is, and a link to every document and component. */
export function llmsIndex({ metadata, docs, locate }: Site): string {
  const lines = [...preamble(), '## Docs', ''];
  for (const doc of docs) {
    lines.push(`- [${doc.title}](${locate(docTwin(doc.id))}): ${doc.description}`);
  }
  lines.push('', '## Components', '');
  for (const c of metadata.components) {
    lines.push(`- [${c.name}](${locate(componentTwin(c.name))}): ${c.summary}`);
  }
  lines.push(
    '',
    '## Optional',
    '',
    `- [llms-full.txt](${locate('llms-full.txt')}): every document and component above, in one file`,
    `- [meta.json](${locate('meta.json')}): the component metadata as JSON, which all of this is generated from`,
    `- [Repository](${REPOSITORY}): the source, the roadmap and how to contribute`,
  );
  return `${lines.join('\n')}\n`;
}

/** `llms-full.txt`: the summary, then every twin in full. */
export function llmsFull({ metadata, docs, locate }: Site): string {
  const sections = [
    preamble().join('\n'),
    ...docs.map((doc) => docMarkdown(doc)),
    ...metadata.components.map((c) => componentMarkdown(c, locate)),
  ];
  return `${sections.map((s) => s.trimEnd()).join('\n\n---\n\n')}\n`;
}
