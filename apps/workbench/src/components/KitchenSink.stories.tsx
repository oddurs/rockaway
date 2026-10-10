import type { BorderSetName } from '@rockaway/grid';
import { frameBuffer, GlyphProvider, type PainterName, Screen, useGlyphs } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentType, type ReactNode, useMemo } from 'react';
import { expect } from 'storybook/test';
// The registry is generated from every component's `.meta.ts` (#202): which
// file each component is written in, and its name.
import { registry } from '../../../../packages/react/src/metadata/components.ts';
import { runner } from '../../.storybook/runner.ts';
import { measured } from '../settled.ts';

/*
 * The kitchen sink (cairn 0064): every component on one screen, the reference
 * the design pass reviews against.
 *
 * Nothing here lists the components. Each brings its own example,
 * `<name>.example.tsx` beside it, which its site page also shows, and this
 * finds them all. A component without one fails `metadata.test.ts`, in its
 * own PR, so adding a component never means editing this file.
 */

/** Every component's example, by the file its component is written in. */
const found = import.meta.glob<{ Example: ComponentType }>(
  '../../../../packages/react/src/components/*.example.tsx',
  { eager: true },
);
const examples = new Map(
  Object.entries(found).map(([path, module]) => [
    path.replace(/^.*\/([a-z0-9-]+)\.example\.tsx$/, '$1'),
    module.Example,
  ]),
);

/** The components, in name order, each with its example. */
const SINK = registry
  .map(({ file, meta }) => ({ file, name: meta.name, Example: examples.get(file) }))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** A pane's width, in cells: three abreast, a cell apart, in 119 of the 120. */
const PANE = 39;

/**
 * A pane: a frame titled with the component's name, as tall as its example.
 * The content is in flow, as Callout's is, so the example decides the height
 * and the frame is drawn to fit it.
 */
function Pane({
  name,
  painter,
  children,
}: {
  name: string;
  painter: PainterName;
  children: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const draw = useMemo(
    () => (size: { width: number; height: number }) => frameBuffer(size, { title: name }, glyphs),
    [name, glyphs],
  );
  return (
    <Screen
      draw={draw}
      painter={painter}
      className="ks-pane"
      contentInset={{ x: 2, y: 1 }}
      role="region"
      aria-label={name}
      data-component={name}
    >
      {children}
    </Screen>
  );
}

/** The pane's layout, as Callout's: content in flow, whole cells, the frame over it. */
const STYLE = `
  .ks-sink {
    display: grid;
    grid-template-columns: repeat(3, calc(${PANE} * var(--rk-cell-width)));
    column-gap: var(--rk-cell-width);
    row-gap: var(--rk-cell-height);
    align-items: start;
    inline-size: calc(120 * var(--rk-cell-width));
  }
  .ks-pane { display: block; }
  .ks-pane > .rk-content {
    position: relative;
    box-sizing: border-box;
    inline-size: round(down, 100%, var(--rk-cell-width));
    white-space: normal;
  }
  .ks-pane > .rk-content p { margin: 0; }
  .ks-pane > .rk-frame { z-index: 1; pointer-events: none; }
`;

interface SinkArgs {
  /** The theme's own border set, or one in its place. */
  readonly borderSet: 'theme' | BorderSetName;
  /** How the panes' lines are stroked. */
  readonly painter: PainterName;
}

/** The glyphs under the toolbar's theme, with the border set the control asks for. */
function Glyphs({
  borderSet,
  children,
}: {
  borderSet: SinkArgs['borderSet'];
  children: ReactNode;
}): ReactNode {
  const theme = useGlyphs();
  if (borderSet === 'theme') return children;
  // An ASCII border set brings ASCII marks with it; any other keeps the theme's.
  const glyphs = borderSet === 'ascii' ? glyphsFor({ borderSet }) : { ...theme, borderSet };
  return <GlyphProvider glyphs={glyphs}>{children}</GlyphProvider>;
}

function Sink({ borderSet, painter }: SinkArgs): ReactNode {
  return (
    <Glyphs borderSet={borderSet}>
      <style>{STYLE}</style>
      <div className="ks-sink">
        {SINK.map(({ file, name, Example }) => (
          <Pane key={file} name={name} painter={painter}>
            {Example ? <Example /> : null}
          </Pane>
        ))}
      </div>
    </Glyphs>
  );
}

const meta = {
  title: 'Kitchen sink',
  component: Sink,
  parameters: { layout: 'padded' },
  // Theme, mode, density and conformance are the toolbar's, as for every
  // story; these two are the sink's own.
  argTypes: {
    borderSet: {
      control: 'select',
      options: ['theme', 'single', 'rounded', 'heavy', 'double', 'ascii'],
    },
    painter: { control: 'inline-radio', options: ['glyph', 'rule'] },
  },
  args: { borderSet: 'theme', painter: 'glyph' },
} satisfies Meta<typeof Sink>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every component, each in a pane named for it, held to `strict` at every
 * density in both modes. The screen as text is checked in, so a change to any
 * component shows here as a diff of the whole sink.
 */
export const Everything: Story = {
  globals: { conformance: 'strict' },
  play: async ({ canvasElement }) => {
    await measured(document.body);
    // Every component the registry knows is on the screen, with its example.
    const panes = [...canvasElement.querySelectorAll<HTMLElement>('.ks-pane')];
    expect(panes.map((pane) => pane.dataset.component)).toEqual(SINK.map(({ name }) => name));
    expect(SINK.filter(({ Example }) => Example === undefined).map(({ name }) => name)).toEqual([]);
    for (const pane of panes) {
      expect(pane.querySelector('.rk-content')?.childElementCount).toBeGreaterThan(0);
    }
    const run = runner();
    if (!run) return;
    // The examples are real usage, so they read the reader's platform (a chord
    // is ⌘S on a Mac and Ctrl+S elsewhere) and wrap in the platform's fonts.
    // The snapshot is the screen as CI draws it, in Chromium on Linux, and is
    // held to that there; anywhere else the screen is checked by everything
    // above and by the walk after, and the text is only printed.
    const text = screenshot(canvasElement.querySelector('.ks-sink') as HTMLElement);
    if (!navigator.userAgent.includes('Linux')) return;
    // biome-ignore lint/suspicious/noConsole: printed once, to write the snapshot from CI
    console.log(`KITCHEN SINK BEGIN\n${text}\nKITCHEN SINK END`);
  },
};

/*
 * The other controls, each in a story of its own, every value of each. The
 * walk after a story checks conformance and continuity at every density in
 * both modes; here it walks only what the control can change. A border set
 * and a painter change the cells' strokes, so they are walked at every
 * density, in light: mode changes their colour and no cell, and Everything
 * walks both modes. A theme changes colours and glyphs and no geometry, so
 * each is read at one density and one mode, normal and light, against the
 * reader's continuity check of its own ink.
 */

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/** Walk light only: mode changes no cell. */
const lightOnly = {
  matrix: {
    skip: [{ mode: 'dark', reason: 'a mode changes colours, not cells: Everything walks both' }],
  },
} as const;

/** Walk normal light only: a theme changes colours and glyphs, not geometry. */
const normalLightOnly = {
  matrix: {
    skip: [
      ...DENSITIES.filter((density) => density !== 'normal').map((density) => ({
        density,
        reason: 'a theme changes colours and glyphs, not geometry: Everything walks every density',
      })),
      { mode: 'dark', reason: 'a mode changes colours, not cells: Everything walks both' },
    ],
  },
} as const;

/** Every component under one border set in place of the theme's. */
const bordered = (borderSet: Exclude<SinkArgs['borderSet'], 'theme'>): Story => ({
  name: `Border set: ${borderSet}`,
  args: { borderSet },
  parameters: lightOnly,
});

export const Single: Story = bordered('single');
export const Rounded: Story = bordered('rounded');
export const Heavy: Story = bordered('heavy');
export const Double: Story = bordered('double');
export const Ascii: Story = bordered('ascii');

/** Every pane stroked as hairlines. */
export const Rule: Story = {
  name: 'Painter: rule',
  args: { painter: 'rule' },
  parameters: lightOnly,
};

/** Every component under one theme, its own colours and glyphs. */
const themed = (theme: string): Story => ({
  name: `Theme: ${theme}`,
  globals: { theme },
  parameters: normalLightOnly,
});

export const Ice: Story = themed('ice');
export const Ink: Story = themed('ink');
export const Phosphor: Story = themed('phosphor');
export const AsciiTheme: Story = themed('ascii');
export const Catppuccin: Story = themed('catppuccin');
export const Dracula: Story = themed('dracula');
export const Nord: Story = themed('nord');
export const Solarized: Story = themed('solarized');
export const TokyoNight: Story = themed('tokyo-night');
