import type { CSSProperties, ReactNode } from 'react';
import { aliasOf, docs, entries, group, type TokenEntry } from './walk.ts';

const cell: CSSProperties = {
  padding: 'var(--rk-space-2) var(--rk-space-3)',
  borderBottom: '1px solid var(--rk-border-subtle)',
  textAlign: 'left',
  verticalAlign: 'middle',
};
const mono: CSSProperties = { font: 'var(--rk-text-code)' };
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
        <h1 style={{ margin: 0, font: 'var(--rk-text-heading-lg)' }}>{title}</h1>
        <p style={{ margin: 0, font: 'var(--rk-text-lead)', ...muted }}>{lead}</p>
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
    <table style={{ borderCollapse: 'collapse', width: '100%', font: 'var(--rk-text-body)' }}>
      <caption
        style={{
          textAlign: 'left',
          font: 'var(--rk-text-heading-sm)',
          paddingBottom: 'var(--rk-space-3)',
        }}
      >
        {caption}
      </caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" style={{ ...cell, font: 'var(--rk-text-label)', ...muted }}>
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
        borderRadius: 'var(--rk-radius-tag)',
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
            borderRadius: 'var(--rk-radius-surface)',
          }}
        >
          <Table caption={`${mode === 'light' ? 'Light' : 'Dark'} mode`} head={['Hue', ...keys]}>
            {hues.map((hue) => (
              <tr key={hue}>
                <th scope="row" style={{ ...cell, font: 'var(--rk-text-label)' }}>
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

export function Typography() {
  const styles = group(docs.semantic, 'text');
  const sizes = Object.fromEntries(
    group(docs.base, 'font')
      .filter((t) => t.path.startsWith('font.size'))
      .map((t) => [t.path, t.value as { value: number }]),
  );
  return (
    <Page
      title="Typography"
      lead="Text styles by job. Sizes come from 14px and a 1.2 ratio, in rem so they follow the reader's settings."
    >
      <Table caption="Text styles" head={['Token', 'Specimen', 'Size', 'Line height']}>
        {styles.map((t) => {
          const v = t.value as { fontSize: string; lineHeight: number };
          const rem = sizes[aliasOf(v.fontSize) ?? '']?.value ?? 0;
          return (
            <tr key={t.path}>
              <td style={cell}>
                <code style={mono}>{t.path}</code>
              </td>
              <td
                style={{
                  ...cell,
                  font: `var(${t.cssVar})`,
                  whiteSpace: 'nowrap',
                  maxWidth: 520,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Timeless bones, any skin
              </td>
              <td style={{ ...cell, ...mono, ...muted }}>{Math.round(rem * 16)}px</td>
              <td style={{ ...cell, ...mono, ...muted }}>{v.lineHeight}</td>
            </tr>
          );
        })}
      </Table>
    </Page>
  );
}

export function SpaceAndShape() {
  const space = group(docs.regular, 'space');
  const sizes = group(docs.regular, 'size');
  const radius = group(docs.semantic, 'radius');
  const shadows = group(docs.semantic, 'shadow');
  const px = (t: TokenEntry) => `${(t.value as { value: number }).value}px`;
  return (
    <Page
      title="Space and shape"
      lead="A 4px unit scaled by density, corners derived from one radius, and three levels of shadow."
    >
      <Table caption="Space (regular density)" head={['Token', 'Value', 'Sample']}>
        {space.map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>{px(t)}</td>
            <td style={{ ...cell, width: '60%' }}>
              <span
                style={{
                  display: 'block',
                  height: 12,
                  width: `var(${t.cssVar})`,
                  background: 'var(--rk-bg-accent-solid)',
                  borderRadius: 2,
                }}
              />
            </td>
          </tr>
        ))}
        {sizes.map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>{px(t)}</td>
            <td style={cell}>
              <span
                style={{
                  display: 'block',
                  height: `var(${t.cssVar})`,
                  width: 120,
                  border: '1px solid var(--rk-border-control)',
                  borderRadius: 'var(--rk-radius-control)',
                }}
              />
            </td>
          </tr>
        ))}
      </Table>
      <Table caption="Radius and shadow" head={['Token', 'Value', 'Sample']}>
        {[...radius, ...shadows].map((t) => (
          <tr key={t.path}>
            <td style={cell}>
              <code style={mono}>{t.path}</code>
            </td>
            <td style={{ ...cell, ...mono, ...muted }}>
              {t.type === 'dimension' ? px(t) : 'layered'}
            </td>
            <td style={cell}>
              <span
                style={{
                  display: 'block',
                  width: 96,
                  height: 48,
                  background: 'var(--rk-bg-surface)',
                  border: '1px solid var(--rk-border-default)',
                  borderRadius:
                    t.type === 'dimension' ? `var(${t.cssVar})` : 'var(--rk-radius-surface)',
                  boxShadow: t.type === 'shadow' ? `var(${t.cssVar})` : undefined,
                }}
              />
            </td>
          </tr>
        ))}
      </Table>
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
