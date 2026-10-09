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
 * Every component, each in a pane named for it. The screen as text is checked
 * in, so a change to any component shows here as a diff of the whole sink.
 */
export const Everything: Story = {
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
    await run.matchFile(
      screenshot(canvasElement.querySelector('.ks-sink') as HTMLElement),
      './kitchen-sink.snapshot.txt',
    );
  },
};
