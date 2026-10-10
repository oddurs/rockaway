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
  /** One part of the components, in name order, of `PARTS`; all of them when absent. */
  readonly part?: number;
}

/**
 * The parts the sink is walked in. Every component at every density is
 * over a minute on CI, past a story's timeout, so Everything is read in its
 * own cell and each part walks every density.
 */
const PARTS = 4;

const inPart = (index: number, part: number | undefined): boolean =>
  part === undefined || Math.floor((index * PARTS) / SINK.length) + 1 === part;

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

function Sink({ borderSet, painter, part }: SinkArgs): ReactNode {
  return (
    <Glyphs borderSet={borderSet}>
      <style>{STYLE}</style>
      <div className="ks-sink">
        {SINK.filter((_, i) => inPart(i, part)).map(({ file, name, Example }) => (
          <Pane key={file} name={name} painter={painter}>
            {Example ? <Example /> : null}
          </Pane>
        ))}
      </div>
    </Glyphs>
  );
}

/**
 * A part of the sink is still too long to walk at every density in WebKit
 * on CI. There each part is checked in normal light, its own cell; each
 * component's own stories walk every density in WebKit.
 */
const IN_WEBKIT = [
  ...(['dense', 'airy', 'touch'] as const).map((density) => ({
    density,
    project: 'webkit',
    reason: 'a part of the sink is too long to walk in WebKit; each component walks it alone',
  })),
  {
    mode: 'dark' as const,
    project: 'webkit',
    reason: 'a part of the sink is too long to walk in WebKit; each component walks it alone',
  },
];

const meta = {
  title: 'Kitchen sink',
  component: Sink,
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
  parameters: { layout: 'padded', matrix: { skip: IN_WEBKIT } },
  // Still, as a reference is: a spinner or an indeterminate bar that moves
  // while the checks read it is a gap at whichever cell it had reached.
  beforeEach: () => {
    document.documentElement.dataset.motion = 'reduced';
    return () => {
      delete document.documentElement.dataset.motion;
    };
  },
} satisfies Meta<typeof Sink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Walk only the story's own cell, normal and light: the parts walk the rest. */
const ownCellOnly = {
  matrix: {
    skip: [
      ...(['dense', 'airy', 'touch'] as const).map((density) => ({
        density,
        reason: 'the whole sink at every density is over a minute on CI: each part walks it',
      })),
      {
        mode: 'dark' as const,
        reason: 'the whole sink at every density is over a minute on CI: each part walks it',
      },
    ],
  },
};

/**
 * Every component, each in a pane named for it, held to `standard`: the
 * level of app UI (0311), where a comfortable form, a toolbar and type sized
 * in rows rest on half-steps inside their own blocks. `strict` is structure
 * only, and each component's own stories hold it there where it can be. The
 * screen as text is checked in, so a change to any component shows here as a
 * diff of the whole sink. It is read in its own cell; the parts after it walk
 * every density in both modes.
 */
export const Everything: Story = {
  // The whole sink is over a minute in WebKit and Firefox on CI; the parts
  // run there.
  tags: ['chromium-only'],
  globals: { conformance: 'standard' },
  parameters: ownCellOnly,
  // The examples are real usage, so they read the reader's keyboard: a chord
  // is ⌘S on a Mac and Ctrl+S elsewhere, and the cells around it differ. The
  // sink is drawn for the same keyboard on every machine, so its snapshot is
  // the same wherever it is written: `usePlatform` reads the browser's hints
  // on every render, and here they say Linux.
  beforeEach: () => {
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: { platform: 'Linux' },
    });
    return () => {
      delete (navigator as { userAgentData?: unknown }).userAgentData;
    };
  },
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
    // The screen as text, in Chromium, the engine the snapshot is written in;
    // write it again with `vitest -u` on any machine.
    const text = screenshot(canvasElement.querySelector('.ks-sink') as HTMLElement);
    if (!navigator.userAgent.includes('Chrome')) return;
    await run.matchFile(text, './kitchen-sink.snapshot.txt');
  },
};

/** A part of the sink, walked at every density in both modes. */
const part = (n: number): Story => ({
  name: `Everything, part ${n} of ${PARTS}`,
  args: { part: n },
  globals: { conformance: 'standard' },
});

export const Part1: Story = part(1);
export const Part2: Story = part(2);
export const Part3: Story = part(3);
export const Part4: Story = part(4);

/*
 * The other controls, each in a story of its own, every value of each, over
 * the whole sink, so each is read in normal light: every component at every
 * density is over a minute on CI. A border set and a painter change the
 * cells' strokes, and each component's own stories walk its strokes at every
 * density. A theme changes colours and glyphs and no geometry, and is read
 * against the reader's continuity check of its own ink.
 */

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/** Walk normal light only: a theme changes colours and glyphs, not geometry. */
const normalLightOnly = {
  matrix: {
    skip: [
      ...DENSITIES.filter((density) => density !== 'normal').map((density) => ({
        density,
        reason: 'the whole sink at every density is over a minute on CI: the parts walk it',
      })),
      { mode: 'dark', reason: 'a mode changes colours, not cells: the parts walk both' },
    ],
  },
} as const;

/*
 * Each whole-sink variant is tagged `chromium-only` where it is exported, so
 * the indexer, which reads tags from the story object, sees it: the whole
 * sink is over a minute in WebKit and Firefox on CI, and the parts run there.
 */

/** Every component under one border set in place of the theme's. */
const bordered = (borderSet: Exclude<SinkArgs['borderSet'], 'theme'>): Story => ({
  name: `Border set: ${borderSet}`,
  args: { borderSet },
  parameters: normalLightOnly,
});

export const Single: Story = { ...bordered('single'), tags: ['chromium-only'] };
export const Rounded: Story = { ...bordered('rounded'), tags: ['chromium-only'] };
export const Heavy: Story = { ...bordered('heavy'), tags: ['chromium-only'] };
export const Double: Story = { ...bordered('double'), tags: ['chromium-only'] };
export const Ascii: Story = { ...bordered('ascii'), tags: ['chromium-only'] };

/** Every pane stroked as hairlines. */
export const Rule: Story = {
  name: 'Painter: rule',
  tags: ['chromium-only'],
  args: { painter: 'rule' },
  parameters: normalLightOnly,
};

/** Every component under one theme, its own colours and glyphs. */
const themed = (theme: string): Story => ({
  name: `Theme: ${theme}`,
  globals: { theme },
  parameters: normalLightOnly,
});

export const Ice: Story = { ...themed('ice'), tags: ['chromium-only'] };
export const Ink: Story = { ...themed('ink'), tags: ['chromium-only'] };
export const Phosphor: Story = { ...themed('phosphor'), tags: ['chromium-only'] };
export const AsciiTheme: Story = { ...themed('ascii'), tags: ['chromium-only'] };
export const Catppuccin: Story = { ...themed('catppuccin'), tags: ['chromium-only'] };
export const Dracula: Story = { ...themed('dracula'), tags: ['chromium-only'] };
export const Nord: Story = { ...themed('nord'), tags: ['chromium-only'] };
export const Solarized: Story = { ...themed('solarized'), tags: ['chromium-only'] };
export const TokyoNight: Story = { ...themed('tokyo-night'), tags: ['chromium-only'] };
