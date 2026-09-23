import type { CSSProperties, ReactNode } from 'react';
import { text } from '../../text.ts';
import { aliasOf, docs, entries, group, type TokenEntry } from './walk.ts';

const cell: CSSProperties = {
  padding: 'calc(var(--rk-space-2) * 1ch) calc(var(--rk-space-3) * 1ch)',
  borderBottom: '1px solid var(--rk-border-subtle)',
  textAlign: 'left',
  verticalAlign: 'middle',
};
const mono: CSSProperties = { fontFamily: 'var(--rk-font-family-mono)' };
const muted: CSSProperties = { color: 'var(--rk-fg-muted)' };

export function Page({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--rk-space-6) * 1ch)',
        width: 'min(1080px, 100%)',
        padding: 'calc(var(--rk-space-8) * 1ch)',
      }}
    >
      <header
        style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--rk-space-2) * 1ch)' }}
      >
        <h1 style={{ margin: 0, ...text('heading') }}>{title}</h1>
        <p style={{ margin: 0, ...text('lead'), ...muted }}>{lead}</p>
      </header>
      {children}
    </main>
  );
}

function Table({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', ...text('body') }}>
      <caption
        style={{
          textAlign: 'left',
          ...text('heading'),
          paddingBottom: 'calc(var(--rk-space-3) * 1ch)',
        }}
      >
        {caption}
      </caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" style={{ ...cell, ...text('label'), ...muted }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Swatch({ cssVar, mode }: { cssVar: string; mode?: 'light' | 'dark' }) {
  return (
    <span
      data-theme={mode}
      style={{
        display: 'inline-block',
        width: 40,
        height: 24,
        background: `var(${cssVar})`,
        boxShadow: 'inset 0 0 0 1px oklch(0.5 0 0 / 0.2)',
      }}
    />
  );
}

/** The palette: the terminal's sixteen, and the role slots (cairn 0089). */
export function Palettes() {
  const slots = Object.keys(docs.light.ansi).filter((k) => !k.startsWith('$'));
  const terminal = slots.filter(
    (s) =>
      !s.startsWith('tint-') &&
      ![
        'background',
        'surface',
        'subtle',
        'hover',
        'active',
        'foreground',
        'muted',
        'faint',
        'border-subtle',
        'border',
        'border-strong',
        'cursor',
        'selection',
      ].includes(s),
  );
  const roles = slots.filter((s) => !terminal.includes(s));

  const rows = (names: string[]) =>
    names.map((slot) => (
      <tr key={slot}>
        <th scope="row" style={{ ...cell, ...text('label') }}>
          <code style={mono}>{slot}</code>
        </th>
        <td style={{ ...cell, padding: 'calc(var(--rk-space-1) * 1ch)' }}>
          <Swatch cssVar={`--rk-ansi-${slot}`} mode="light" />
        </td>
        <td style={{ ...cell, padding: 'calc(var(--rk-space-1) * 1ch)' }}>
          <Swatch cssVar={`--rk-ansi-${slot}`} mode="dark" />
        </td>
      </tr>
    ));

  return (
    <Page
      title="Palette"
      lead="The terminal's sixteen, which every reader has already themed, plus the role slots a design system needs and a terminal does not name."
    >
      <Table caption="The sixteen" head={['Slot', 'Light', 'Dark']}>
        {rows(terminal)}
      </Table>
      <Table caption="Role slots" head={['Slot', 'Light', 'Dark']}>
        {rows(roles)}
      </Table>
    </Page>
  );
}

function SemanticRows({ tokens }: { tokens: TokenEntry[] }) {
  return tokens.map((t) => (
    <tr key={t.path}>
      <td style={cell}>
        <code style={mono}>{t.path}</code>
      </td>
      <td style={cell}>
        <Swatch cssVar={t.cssVar} mode="light" />
      </td>
      <td style={cell}>
        <Swatch cssVar={t.cssVar} mode="dark" />
      </td>
      <td style={{ ...cell, ...mono, ...muted }}>
        {(aliasOf(t.value) ?? '—').replace('ansi.', '')}
      </td>
      <td style={{ ...cell, ...muted }}>{t.description ?? ''}</td>
    </tr>
  ));
}

export function SemanticColours() {
  return (
    <Page
      title="Semantic colours"
      lead="What components read. Each names a palette slot, written once for both modes: the mode context swaps the palette underneath."
    >
      {(['bg', 'fg', 'border'] as const).map((g) => (
        <Table
          key={g}
          caption={{ bg: 'Backgrounds', fg: 'Text and icons', border: 'Borders' }[g]}
          head={['Token', 'Light', 'Dark', 'Aliases', 'Use']}
        >
          <SemanticRows tokens={group(docs.semantic, g)} />
        </Table>
      ))}
    </Page>
  );
}

export function Motion() {
  const motion = entries(docs.semantic.motion, ['motion']);
  return (
    <Page title="Motion" lead="Frames on a tick. Reduced motion collapses them in the base CSS.">
      <Table caption="Durations and easings" head={['Token', 'Value']}>
        {motion.map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>
              {Array.isArray(t.value)
                ? `cubic-bezier(${t.value.join(', ')})`
                : `${(t.value as { value: number }).value}ms`}
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

/** The cell, and everything counted in cells (cairn 0090). */
export function Cells() {
  const density = docs.normal as Record<string, unknown>;
  const counts = (name: string): TokenEntry[] => group(density, name);
  const value = (t: TokenEntry): string =>
    String((t.value as { value?: number })?.value ?? t.value);

  return (
    <Page
      title="Cells"
      lead="One character across, one line box down. Space is a count of cells; the CSS layer turns a count into a length."
    >
      <Table caption="The cell, at normal density" head={['Token', 'Count', 'As a length']}>
        {counts('cell').map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>{value(t)}</td>
            <td style={{ ...cell, ...muted }}>line box, as a multiple of the font size</td>
          </tr>
        ))}
      </Table>

      <Table caption="Space across, and rows down" head={['Token', 'Cells', 'Sample']}>
        {counts('space').map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>{value(t)}</td>
            <td style={cell}>
              <span
                style={{
                  display: 'block',
                  height: 'var(--rk-cell-height)',
                  width: `calc(${value(t)} * var(--rk-cell-width))`,
                  background: 'var(--rk-bg-accent-solid)',
                }}
              />
            </td>
          </tr>
        ))}
      </Table>

      <Table caption="Controls and screens" head={['Token', 'Cells', 'What it is']}>
        {[...counts('size')].map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>{value(t)}</td>
            <td style={{ ...cell, ...muted }}>
              {t.path.includes('screen') ? 'a width a screen answers to' : 'rows tall'}
            </td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}

/** The characters chrome is drawn with (cairn 0091). */
export function Glyphs() {
  const all = group(docs.base as Record<string, unknown>, 'glyph');
  const sets = ['single', 'double', 'heavy', 'rounded', 'ascii'];
  const slots = [
    'top-left',
    'horizontal',
    'top-right',
    'vertical',
    'cross',
    'tee-down',
    'tee-up',
    'bottom-left',
    'bottom-right',
  ];
  const glyphOf = (set: string, slot: string): string =>
    String(all.find((t) => t.path === `glyph.border.${set}.${slot}`)?.value ?? '');
  const marks = all.filter(
    (t) => t.path.startsWith('glyph.mark.') || t.path.startsWith('glyph.block.'),
  );
  const frames = all.filter(
    (t) => t.path.startsWith('glyph.spinner.') || t.path.startsWith('glyph.bar.'),
  );

  return (
    <Page
      title="Glyphs"
      lead="Chrome is text, so the characters are theme values. Every one is a single cell, and the junction table resolves the seams between them."
    >
      <Table caption="Border sets" head={['Set', ...slots]}>
        {sets.map((set) => (
          <tr key={set}>
            <th scope="row" style={{ ...cell, ...text('label') }}>
              {set}
            </th>
            {slots.map((slot) => (
              <td key={slot} style={{ ...cell, ...mono, textAlign: 'center' }}>
                {glyphOf(set, slot)}
              </td>
            ))}
          </tr>
        ))}
      </Table>

      <Table caption="Marks and blocks" head={['Token', 'Glyph']}>
        {marks.map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono }}>{String(t.value)}</td>
          </tr>
        ))}
      </Table>

      <Table caption="Frames" head={['What', 'Glyphs']}>
        <tr>
          <th scope="row" style={{ ...cell, ...text('label') }}>
            spinner
          </th>
          <td style={{ ...cell, ...mono }}>
            {frames
              .filter((t) => t.path.startsWith('glyph.spinner.'))
              .map((t) => String(t.value))
              .join(' ')}
          </td>
        </tr>
        <tr>
          <th scope="row" style={{ ...cell, ...text('label') }}>
            bar
          </th>
          <td style={{ ...cell, ...mono }}>
            {frames
              .filter((t) => t.path.startsWith('glyph.bar.'))
              .map((t) => String(t.value))
              .join('')}
          </td>
        </tr>
      </Table>
    </Page>
  );
}

/** How emphasis is drawn (cairn 0091). */
export function Attributes() {
  const rows: { name: string; attrs: string; what: string }[] = [
    { name: 'bold', attrs: 'bold', what: 'a heading, a label, a selected tab' },
    { name: 'dim', attrs: 'dim', what: 'secondary text, a disabled control' },
    { name: 'reverse', attrs: 'reverse', what: 'selection, a cursor, a focused fill' },
    { name: 'underline', attrs: 'underline', what: 'a link, a match inside a search result' },
  ];
  return (
    <Page
      title="Attributes"
      lead="Emphasis is an attribute, never a size. Dim is a colour rather than an opacity, so it survives a screenshot; reverse is a swap, so it has no value of its own."
    >
      <Table caption="What emphasis means here" head={['Attribute', 'Shown', 'Used for']}>
        {rows.map((row) => (
          <tr key={row.name}>
            <td style={cell}>
              <code style={mono}>{row.name}</code>
            </td>
            <td style={cell}>
              <span data-attrs={row.attrs}>the quick brown fox</span>
            </td>
            <td style={{ ...cell, ...muted }}>{row.what}</td>
          </tr>
        ))}
      </Table>
    </Page>
  );
}
