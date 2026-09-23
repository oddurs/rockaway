import type { CSSProperties, ReactNode } from 'react';
import { text } from '../../text.ts';
import { aliasOf, docs, entries, group, type TokenEntry } from './walk.ts';

const cell: CSSProperties = {
  padding: 'var(--rk-space-2) var(--rk-space-3)',
  borderBottom: '1px solid var(--rk-border-subtle)',
  textAlign: 'left',
  verticalAlign: 'middle',
};
const mono: CSSProperties = { ...text('code') };
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
        gap: 'var(--rk-space-6)',
        width: 'min(1080px, 100%)',
        padding: 'var(--rk-space-8)',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-space-2)' }}>
        <h1 style={{ margin: 0, ...text('heading-lg') }}>{title}</h1>
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
          ...text('heading-sm'),
          paddingBottom: 'var(--rk-space-3)',
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

/** Every palette, both modes. Steps have fixed roles (cairn 0016). */
export function Palettes() {
  const hues = Object.keys(docs.light.palette).filter(
    (k) => !k.startsWith('$') && k !== 'shadow' && k !== 'scrim',
  );
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'contrast'];
  return (
    <Page
      title="Palettes"
      lead="Twelve steps per hue, each with a fixed job, in both modes. Components never read these directly."
    >
      {(['light', 'dark'] as const).map((mode) => (
        <section
          key={mode}
          data-theme={mode}
          style={{
            padding: 'var(--rk-space-4)',
            background: 'var(--rk-bg-page)',
            color: 'var(--rk-fg-default)',
          }}
        >
          <Table caption={`${mode === 'light' ? 'Light' : 'Dark'} mode`} head={['Hue', ...keys]}>
            {hues.map((hue) => (
              <tr key={hue}>
                <th scope="row" style={{ ...cell, ...text('label') }}>
                  {hue}
                </th>
                {keys.map((k) => (
                  <td key={k} style={{ ...cell, padding: 'var(--rk-space-1)' }}>
                    <Swatch cssVar={`--rk-palette-${hue}-${k}`} />
                  </td>
                ))}
              </tr>
            ))}
          </Table>
        </section>
      ))}
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
      <td style={{ ...cell, ...mono, ...muted }}>{aliasOf(t.value) ?? 'transparent'}</td>
      <td style={{ ...cell, ...muted }}>{t.description ?? ''}</td>
    </tr>
  ));
}

export function SemanticColours() {
  return (
    <Page
      title="Semantic colours"
      lead="What components read. Each is an alias to a palette step, written once for both modes."
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
    <Page
      title="Motion"
      lead="Short, and decelerating on the way in. Reduced motion collapses these in the base CSS."
    >
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
