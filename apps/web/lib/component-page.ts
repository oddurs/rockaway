/**
 * A component's page (cairn 0147), written from the metadata
 * `@rockaway/react` publishes, as HTML at build: everything but the live
 * example, which is React. Server only.
 */
import { fromText, shapeOf } from '@rockaway/grid';
import { formatKeys, spokenKeys } from '@rockaway/react';
import type { ComponentMeta, Snapshot } from '@rockaway/react/metadata';
import { componentNamed, inline, slugOf, tokenAnchor } from './components.ts';
import { escapeHtml } from './html.ts';
import { columnCells } from './markdown.ts';
import { paintedRows } from './painted.ts';
import { BASE } from './paths.ts';
import { drawings } from './snapshots.ts';

export interface Column {
  readonly label: string;
  readonly code?: boolean;
}

export interface Cell {
  readonly text: string;
  readonly html?: string;
}

const link = (path: string): string => `${BASE}/${path}`;

/** Text, with anything the cell draws (a `─`, a `█`) as a cell of its own, as in prose. */
const shaped = (text: string): string =>
  [...text]
    .map((ch) => {
      const shape = shapeOf(ch);
      return shape ? `<span data-rk-shape="${shape.key}">${escapeHtml(ch)}</span>` : escapeHtml(ch);
    })
    .join('');

/** A table from data, set as a Markdown one is, in a box that scrolls across. */
export function tableHtml(
  columns: readonly Column[],
  rows: readonly (readonly (string | Cell)[])[],
): string {
  const cellOf = (c: string | Cell): Cell => (typeof c === 'string' ? { text: c } : c);
  const widths = columnCells([
    columns.map((c) => c.label),
    ...rows.map((row) => row.map((c) => cellOf(c).text)),
  ]);
  const head = columns.map((c) => `<th scope="col">${escapeHtml(c.label)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((raw, i) => {
            const cell = cellOf(raw);
            const inner =
              cell.html !== undefined
                ? cell.html
                : columns[i]?.code
                  ? `<code>${escapeHtml(cell.text)}</code>`
                  : shaped(cell.text);
            return `<td>${inner}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');
  const cols = widths
    ? `<colgroup>${widths.map((w) => `<col style="--rk-cols: ${w}">`).join('')}</colgroup>`
    : '';
  return `<div class="rk-scroll-marks" tabindex="0"><table>${cols}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/** A snapshot, painted as the cell renderer paints it, in a box that scrolls across. */
export function paintedHtml(text: string, label: string): string {
  return `<figure role="img" aria-label="${escapeHtml(label)}" class="rk-scroll-marks" tabindex="0"><div data-rk-painted="glyph" aria-hidden="true">${paintedRows(fromText(text))}</div></figure>`;
}

const componentLink = (name: string): string =>
  componentNamed(name)
    ? `<a href="${link(`components/${slugOf(name)}/`)}"><code>${escapeHtml(name)}</code></a>`
    : `<code>${escapeHtml(name)}</code>`;

const keys = (spec: string): string =>
  `<kbd aria-label="${escapeHtml(spokenKeys(spec))}">${escapeHtml(formatKeys(spec))}</kbd>`;

/**
 * A snapshot in the reader's theme (0171): painted once per drawing, each
 * marked with the themes that draw it, and `tokens.css` shows the reader's.
 * One that every theme draws alike is painted once, unmarked.
 */
function themed(snapshot: Snapshot, label: string): string {
  const all = drawings(snapshot);
  if (all.length === 1) return paintedHtml(snapshot.text, label);
  return all
    .map(
      (drawing) =>
        `<div data-rk-theme-only="${drawing.themes.join(' ')}">${paintedHtml(drawing.text, label)}</div>`,
    )
    .join('');
}

/** The page above the example: its name, what it is, its snapshots. */
export function headHtml(meta: ComponentMeta): string {
  const snapshots = meta.snapshots
    .map(
      (s) =>
        `<p><strong>${escapeHtml(s.title)}.</strong> ${s.description ? inline(s.description) : ''}</p>${themed(s, `${meta.name}, ${s.title}, as text`)}`,
    )
    .join('');
  return `<h1>${escapeHtml(meta.name)}</h1><p>${inline(meta.summary)}</p>${snapshots}<p>${inline(meta.description)}</p><h2 id="example">Example</h2>`;
}

/** The page below the example: when to use it, its anatomy, variants, states, props, keys and tokens. */
export function restHtml(meta: ComponentMeta): string {
  const out: string[] = [];
  out.push('<h2 id="when-to-use-it">When to use it</h2>');
  out.push(`<ul>${meta.whenToUse.map((u) => `<li>${inline(u)}</li>`).join('')}</ul>`);
  out.push('<p>And when not to:</p>');
  out.push(
    `<ul>${meta.whenNotToUse
      .map(
        (n) =>
          `<li>${inline(n.text)}${n.instead ? ` Use ${componentLink(n.instead)} instead.` : ''}</li>`,
      )
      .join('')}</ul>`,
  );
  out.push('<h2 id="anatomy">Anatomy</h2>');
  out.push(
    tableHtml(
      [{ label: 'Part' }, { label: 'Is' }, { label: 'What it is' }],
      meta.anatomy.map((part) => [
        { text: part.name, html: `<code>${escapeHtml(part.name)}</code>` },
        part.kind === 'import'
          ? `imported${part.role ? `, role ${part.role}` : ''}`
          : {
              text: `.${part.className}${part.chrome ? ', chrome' : ''}`,
              html: `<code>.${escapeHtml(part.className)}</code>${part.chrome ? ', chrome' : ''}`,
            },
        { text: part.description, html: inline(part.description) },
      ]),
    ),
  );
  if (meta.variants.length > 0) {
    out.push('<h2 id="variants">Variants</h2>');
    for (const v of meta.variants) {
      out.push(
        `<p><code>${escapeHtml(v.name)}</code>, on <code>${escapeHtml(v.attribute)}</code>, defaults to <code>${escapeHtml(String(v.default))}</code>. ${inline(v.description)}</p>`,
      );
      out.push(
        tableHtml(
          [{ label: 'Value', code: true }, { label: 'What it is' }],
          v.values.map((x) => [
            String(x.value),
            { text: x.description, html: inline(x.description) },
          ]),
        ),
      );
    }
  }
  if (meta.states.length > 0) {
    out.push('<h2 id="states">States</h2>');
    out.push(
      `<p>Each is a row of <a href="${link('concept/#9-states-are-one-vocabulary')}">the state vocabulary</a>, drawn the same way in every component, and none changes a size.</p>`,
    );
    out.push(
      tableHtml(
        [{ label: 'State' }, { label: 'On' }, { label: 'Drawn as' }, { label: 'Without colour' }],
        meta.states.map((s) => [
          {
            text: `${s.state} ${s.selectors.join(' ')}`,
            html: `${escapeHtml(s.state)}, <code>${escapeHtml(s.selectors.join(' '))}</code>`,
          },
          { text: s.part, html: `<code>${escapeHtml(s.part)}</code>` },
          {
            text: `${s.drawnAs}${s.note ? ` ${s.note}` : ''}`,
            html: `${inline(s.drawnAs)}${s.note ? `. ${inline(s.note)}` : ''}`,
          },
          s.withoutColour,
        ]),
      ),
    );
  }
  out.push('<h2 id="props">Props</h2>');
  const imported = meta.anatomy.filter((p) => p.kind === 'import');
  for (const part of imported) {
    if (imported.length > 1)
      out.push(`<h3 id="props-${slugOf(part.name)}"><code>${escapeHtml(part.name)}</code></h3>`);
    out.push(
      part.props.length > 0
        ? tableHtml(
            [
              { label: 'Prop' },
              { label: 'Type', code: true },
              { label: 'Default', code: true },
              { label: 'What it does' },
            ],
            part.props.map((p) => [
              {
                text: `${p.name}${p.required ? ' required' : ''}`,
                html: `<code>${escapeHtml(p.name)}</code>${p.required ? ', required' : ''}`,
              },
              p.type,
              p.default ?? '',
              { text: p.description ?? '', html: inline(p.description ?? '') },
            ]),
          )
        : '<p>No props of its own.</p>',
    );
    if (part.inherits.length > 0) {
      out.push(
        `<p>Also takes ${part.inherits.map((i) => `<code>${escapeHtml(i)}</code>`).join(', ')}.</p>`,
      );
    }
  }
  out.push('<h2 id="keyboard-and-screen-readers">Keyboard and screen readers</h2>');
  out.push(
    meta.accessibility.keyboard.length > 0
      ? tableHtml(
          [{ label: 'Keys' }, { label: 'Does' }],
          meta.accessibility.keyboard.map((b) => [
            {
              text: b.keys.map((k) => formatKeys(k)).join(', '),
              html: b.keys.map(keys).join(', '),
            },
            { text: b.action, html: inline(b.action) },
          ]),
        )
      : '<p>Nothing of its own to press: it is not a control.</p>',
  );
  out.push(`<p><strong>Its name.</strong> ${inline(meta.accessibility.name)}</p>`);
  out.push(`<p><strong>What a reader hears.</strong> ${inline(meta.accessibility.announces)}</p>`);
  if (meta.accessibility.notes.length > 0) {
    out.push(`<ul>${meta.accessibility.notes.map((n) => `<li>${inline(n)}</li>`).join('')}</ul>`);
  }
  out.push('<h2 id="tokens">Tokens</h2>');
  out.push(
    `<p>What its stylesheet and its painter read, each linked to <a href="${link('foundations/tokens/')}">the token reference</a>:</p>`,
  );
  out.push(
    `<ul>${meta.tokens.map((t) => `<li><a href="${link(`foundations/tokens/#${tokenAnchor(t)}`)}"><code>${escapeHtml(t)}</code></a></li>`).join('')}</ul>`,
  );
  if (meta.related.length > 0) {
    out.push('<h2 id="related">Related</h2>');
    out.push(
      `<ul>${meta.related.map((r) => `<li>${componentLink(r.name)}: ${inline(r.why)}</li>`).join('')}</ul>`,
    );
  }
  return out.join('');
}

/** The page's sections, for the outline: every `h2`, and the `h3`s under Props. */
export function sectionsOf(
  meta: ComponentMeta,
): { title: string; href: string; children: { title: string; href: string }[] }[] {
  const imported = meta.anatomy.filter((p) => p.kind === 'import');
  return [
    { title: 'Example', href: '#example', children: [] },
    { title: 'When to use it', href: '#when-to-use-it', children: [] },
    { title: 'Anatomy', href: '#anatomy', children: [] },
    ...(meta.variants.length > 0 ? [{ title: 'Variants', href: '#variants', children: [] }] : []),
    ...(meta.states.length > 0 ? [{ title: 'States', href: '#states', children: [] }] : []),
    {
      title: 'Props',
      href: '#props',
      children:
        imported.length > 1
          ? imported.map((p) => ({ title: p.name, href: `#props-${slugOf(p.name)}` }))
          : [],
    },
    { title: 'Keyboard and screen readers', href: '#keyboard-and-screen-readers', children: [] },
    { title: 'Tokens', href: '#tokens', children: [] },
    ...(meta.related.length > 0 ? [{ title: 'Related', href: '#related', children: [] }] : []),
  ];
}
