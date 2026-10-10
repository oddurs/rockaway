import { type BorderSetName, toText } from '@rockaway/grid';
import {
  Button,
  GlyphProvider,
  Link,
  layoutPanes,
  type PainterName,
  Pane,
  Panes,
  type PanesOptions,
  panesBuffer,
  type SplitSpec,
} from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { cellsOf, cellsOfBuffer } from '../cells.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Panes',
  component: Panes,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Panes>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/** The cell size a screen measured, read off the screen itself. */
function cellOf(screen: Element): { width: number; height: number } {
  const style = getComputedStyle(screen);
  return {
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** A pane's box, in cells from its screen's corner. */
function boxOf(pane: Element): [number, number, number, number] {
  const screen = pane.closest('.rk-screen') as HTMLElement;
  const cell = cellOf(screen);
  const origin = screen.getBoundingClientRect();
  const box = pane.getBoundingClientRect();
  const whole = (px: number, size: number) => {
    const n = px / size;
    expect(Math.abs(n - Math.round(n)) * size).toBeLessThan(0.5);
    return Math.round(n);
  };
  return [
    whole(box.left - origin.left, cell.width),
    whole(box.top - origin.top, cell.height),
    whole(box.width, cell.width),
    whole(box.height, cell.height),
  ];
}

/** Three panes, one of them split again: the shape every git TUI has. */
function Shell({
  suffix = '',
  ...props
}: {
  readonly cols?: number;
  readonly rows?: number;
  /** Added to every name, so several shells on one page are told apart. */
  readonly suffix?: string;
}): ReactNode {
  const name = (title: string) => `${title}${suffix}`;
  return (
    <Panes label={name('repository')} {...props}>
      <Pane size={18} title="files" label={name('files')} priority={1}>
        <p style={{ margin: 0 }}>src/panes.tsx</p>
        <p style={{ margin: 0 }}>src/frame.tsx</p>
      </Pane>
      <Pane size="2fr" min={24} priority={2}>
        <Panes direction="column">
          <Pane title="diff" label={name('diff')} priority={1}>
            <p style={{ margin: 0 }}>+ split the screen</p>
            <Button>Stage</Button>
          </Pane>
          <Pane size={3} title="log" label={name('log')}>
            <p style={{ margin: 0 }}>
              <Link href="#ce9af26">ce9af26</Link> polish Frame
            </p>
          </Pane>
        </Panes>
      </Pane>
      <Pane size="1fr" min={20} title="details" label={name('details')} priority={-1}>
        <p style={{ margin: 0 }}>3 files, +412 −8</p>
      </Pane>
    </Panes>
  );
}

const SHELL: SplitSpec = {
  panes: [
    { size: 18, title: 'files', priority: 1 },
    {
      size: '2fr',
      min: 24,
      priority: 2,
      split: {
        direction: 'column',
        panes: [
          { title: 'diff', priority: 1 },
          { size: 3, title: 'log' },
        ],
      },
    },
    { size: '1fr', min: 20, title: 'details', priority: -1 },
  ],
};

/**
 * The shell: a fixed list of files, a diff over a log, and details. One
 * buffer draws every border; each pane's content sits in the cells its
 * borders enclose.
 */
export const Default: Story = {
  render: () => <Shell cols={76} rows={12} />,
  play: async ({ canvas }) => {
    await settled();
    const screen = canvas.getByRole('group', { name: 'repository' });
    expect(screen.dataset.direction).toBe('row');

    // Each titled pane is a region named by its title, never by its glyphs.
    for (const name of ['files', 'diff', 'log', 'details']) {
      expect(canvas.getByRole('region', { name })).toBeVisible();
    }

    // Every pane sits exactly where the layout put it, in whole cells.
    const { panes } = layoutPanes({ width: 76, height: 12 }, SHELL);
    const regions = ['files', 'diff', 'log', 'details'].map((name) =>
      canvas.getByRole('region', { name }),
    );
    regions.forEach((region, i) => {
      const placed = panes[i];
      if (placed === undefined) throw new Error(`no pane ${i}`);
      expect(boxOf(region)).toEqual([
        placed.content.x,
        placed.content.y,
        placed.content.width,
        placed.content.height,
      ]);
    });

    // And the page reads back as the borders with the content laid over them,
    // the link underlined where it sits (the legend, since 0190).
    expect(screenshot(screen)).toBe(
      [
        '┌ files ───────────┬ diff ────────────────────────────┬ details ───────────┐',
        '│ src/panes.tsx    │ + split the screen               │ 3 files, +412 −8   │',
        '│ src/frame.tsx    │ [ Stage ]                        │                    │',
        '│                  │                                  │                    │',
        '│                  │                                  │                    │',
        '│                  │                                  │                    │',
        '│                  │                                  │                    │',
        '│                  ├ log ─────────────────────────────┤                    │',
        '│                  │ ce9af26 polish Frame             │                    │',
        '│                  │                                  │                    │',
        '│                  │                                  │                    │',
        '└──────────────────┴──────────────────────────────────┴────────────────────┘',
        '',
        '— attributes —',
        'underline  21,8  ce9af26',
      ].join('\n'),
    );
  },
};

/**
 * Collapse by container width (cairn 0136): the same shell measured from a
 * box 120, 80, 60 and 40 characters wide. Details goes first, then files; the
 * diff and log stay. A collapsed pane is hidden, not unmounted.
 */
export const Collapse: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', padding: 'var(--rk-y-1) var(--rk-x-2)' }}>
      {[120, 80, 60, 40].map((width) => (
        <div key={width} data-testid={`${width}`} style={{ inlineSize: `${width}ch` }}>
          <Shell rows={8} suffix={` at ${width}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const expected: Record<number, string[]> = {
      120: ['files', 'diff', 'log', 'details'],
      80: ['files', 'diff', 'log', 'details'],
      60: ['files', 'diff', 'log'],
      40: ['diff', 'log'],
    };

    for (const width of [120, 80, 60, 40]) {
      const box = canvas.getByTestId(`${width}`);
      const screen = box.querySelector('.rk-screen') as HTMLElement;
      await waitFor(() => expect(screen.dataset.rkCols, `${width}ch`).toBe(String(width)));
      const visible = [...box.querySelectorAll<HTMLElement>('.rk-pane:not([hidden])')].map((pane) =>
        pane.getAttribute('aria-label')?.replace(` at ${width}`, ''),
      );
      expect(visible, `${width}ch`).toEqual(expected[width]);
      for (const hidden of box.querySelectorAll<HTMLElement>('.rk-pane[hidden]')) {
        expect(hidden.dataset.collapsed, `${width}ch`).toBe('');
      }
      // The borders the page shows are the layout's, at exactly this width.
      const painted = [...screen.querySelectorAll('.rk-frame .rk-row')].map((row) =>
        (row.textContent ?? '').trimEnd(),
      );
      expect(painted.join('\n'), `${width}ch`).toBe(
        toText(panesBuffer({ width, height: 8 }, SHELL)),
      );
    }
  },
};

/**
 * Resizing collapses and restores a pane without unmounting it: what was typed
 * in it is still there when there is room for it again.
 */
export const Resize: Story = {
  render: function Render() {
    const [wide, setWide] = useState(true);
    return (
      <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
        <Button onPress={() => setWide((w) => !w)}>{wide ? 'Narrow' : 'Widen'}</Button>
        <div data-testid="box" style={{ inlineSize: wide ? '72ch' : '30ch' }}>
          <Panes rows={5}>
            <Pane title="main" priority={1}>
              <p style={{ margin: 0 }}>always here</p>
            </Pane>
            <Pane size={24} title="notes">
              <input
                aria-label="note"
                defaultValue=""
                // A bare input, a row tall at every density, as a field's box is.
                style={{
                  font: 'inherit',
                  inlineSize: '20ch',
                  blockSize: 'var(--rk-cell-height)',
                  padding: 0,
                  border: 'none',
                }}
              />
            </Pane>
          </Panes>
        </div>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await settled();
    const note = canvas.getByRole('textbox', { name: 'note' });
    await userEvent.type(note, 'keep me');
    await userEvent.click(canvas.getByRole('button', { name: 'Narrow' }));
    await waitFor(() => expect(canvas.queryByRole('region', { name: 'notes' })).toBeNull());
    await userEvent.click(canvas.getByRole('button', { name: 'Widen' }));
    await waitFor(() => expect(canvas.getByRole('region', { name: 'notes' })).toBeVisible());
    expect(canvas.getByRole('textbox', { name: 'note' })).toHaveValue('keep me');
  },
};

/**
 * A page's shell (cairn 0248): each pane frames a landmark of its own, so it
 * says `landmark={false}` and is a plain container. The page's landmarks are
 * then the nav, the main and the aside, each named once, with no region
 * around them, and every title is still drawn in its edge.
 */
export const NotLandmarks: Story = {
  name: 'Not landmarks',
  render: () => (
    <Panes cols={60} rows={6}>
      <Pane title="site" size={16} landmark={false}>
        <nav aria-label="Site">
          <Link href="#guide">guide</Link>
        </nav>
      </Pane>
      <Pane title="page" landmark={false}>
        <main aria-label="Page">
          <p style={{ margin: 0 }}>The page.</p>
        </main>
      </Pane>
      <Pane title="outline" size={16} landmark={false}>
        <aside aria-label="On this page">
          <p style={{ margin: 0 }}>Sections</p>
        </aside>
      </Pane>
    </Panes>
  ),
  play: async ({ canvas, canvasElement }) => {
    await settled();
    expect(canvas.queryAllByRole('region')).toEqual([]);
    for (const pane of canvasElement.querySelectorAll('[data-rk-pane]')) {
      expect(pane.tagName).toBe('DIV');
      expect(pane).not.toHaveAttribute('aria-label');
    }
    const nav = canvas.getByRole('navigation', { name: 'Site' });
    const main = canvas.getByRole('main', { name: 'Page' });
    const aside = canvas.getByRole('complementary', { name: 'On this page' });
    // Each landmark's nearest landmark ancestor is none: they are top level.
    for (const landmark of [nav, main, aside]) {
      expect(landmark.parentElement?.closest('section, nav, main, aside, [role]')).toBeNull();
    }
    const top = screenshot(canvasElement.querySelector('.rk-panes') as HTMLElement, {
      legend: false,
    }).split('\n')[0];
    for (const title of ['site', 'page', 'outline']) expect(top).toContain(title);
  },
};

/**
 * From the keyboard: no pane is a stop. Tab walks the content in document
 * order, pane after pane, and a collapsed pane's content is out of reach.
 */
export const Keyboard: Story = {
  render: () => <Shell cols={76} rows={12} />,
  play: async ({ canvas }) => {
    await settled();
    for (const pane of canvas.getAllByRole('region')) expect(pane.tabIndex).toBe(-1);
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Stage' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('link', { name: 'ce9af26' }));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(canvas.getByRole('button', { name: 'Stage' }));
  },
};

/** Layouts with no content, for the painters and the pixel checks. */
interface Variant {
  readonly name: string;
  readonly cols: number;
  readonly rows: number;
  readonly split: SplitSpec;
  readonly options?: PanesOptions;
  readonly theme?: BorderSetName;
}

const THREE: SplitSpec = {
  panes: [
    { size: 12, title: 'files' },
    { split: { direction: 'column', panes: [{ title: 'diff' }, { size: 2, title: 'log' }] } },
  ],
};

const GRID: SplitSpec = {
  direction: 'column',
  panes: [
    { split: { panes: [{ title: 'a' }, { title: 'b' }] } },
    { split: { panes: [{ title: 'c' }, { title: 'd' }, { title: 'e' }] } },
  ],
};

const VARIANTS: readonly Variant[] = [
  ...(['single', 'double', 'heavy', 'rounded', 'ascii'] as const).map(
    (border): Variant => ({ name: border, cols: 30, rows: 7, split: THREE, options: { border } }),
  ),
  { name: 'grid', cols: 30, rows: 7, split: GRID },
  { name: 'ascii theme', cols: 30, rows: 7, split: THREE, theme: 'ascii' },
];

function glyphsOf(variant: Variant) {
  return variant.theme === undefined
    ? themeGlyphs.default
    : glyphsFor({ borderSet: variant.theme });
}

/** The spec as elements, to show the component draws what the function does. */
function elements(split: SplitSpec, suffix: string): ReactNode {
  return split.panes.map((pane, i) => (
    <Pane
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list, whose titles can repeat.
      key={i}
      {...(pane.size === undefined ? {} : { size: pane.size })}
      {...(pane.title === undefined ? {} : { title: pane.title, label: `${pane.title}${suffix}` })}
    >
      {pane.split === undefined ? null : (
        <Panes {...(pane.split.direction === undefined ? {} : { direction: pane.split.direction })}>
          {elements(pane.split, suffix)}
        </Panes>
      )}
    </Pane>
  ));
}

function Drawn({ variant, painter }: { variant: Variant; painter: PainterName }) {
  const panes = (
    <Panes
      {...(variant.split.direction === undefined ? {} : { direction: variant.split.direction })}
      {...variant.options}
      painter={painter}
      cols={variant.cols}
      rows={variant.rows}
      data-testid={`${variant.name} ${painter}`}
    >
      {elements(variant.split, `, ${variant.name}, ${painter}`)}
    </Panes>
  );
  return variant.theme === undefined ? (
    panes
  ) : (
    <GlyphProvider glyphs={glyphsOf(variant)}>{panes}</GlyphProvider>
  );
}

/**
 * Every border set, a grid of nested splits and an ASCII theme, with one
 * painter. The page holds exactly the text the buffer draws, and every run
 * lands in the cells the buffer gives it: each painter held to the buffer, so
 * the two are identical, measured in cells.
 */
const variants = (painter: PainterName): Story => ({
  name: `Variants, ${painter} painter`,
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)', maxWidth: '100ch' }}>
      {VARIANTS.map((variant) => (
        <Drawn key={variant.name} variant={variant} painter={painter} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const variant of VARIANTS) {
      const buffer = panesBuffer(
        { width: variant.cols, height: variant.rows },
        variant.split,
        variant.options,
        glyphsOf(variant),
      );
      const screen = canvas.getByTestId(`${variant.name} ${painter}`);
      expect(screenshot(screen), variant.name).toBe(toText(buffer));
      expect(cellsOf(screen), variant.name).toEqual(cellsOfBuffer(buffer));
    }
    const ascii = screenshot(canvas.getByTestId(`ascii theme ${painter}`));
    expect([...ascii].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
  },
});

export const VariantsGlyph: Story = variants('glyph');
export const VariantsRule: Story = variants('rule');

/**
 * Every variant, with one stroke style, at one density (cairn 0117): every
 * tee and crossing between panes meets its neighbours. The zoom browser runs
 * these again at 200%.
 */
const continuity = (density: (typeof DENSITIES)[number], painter: PainterName): Story => ({
  name: `Continuity, ${density}, ${painter} painter`,
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div
      data-density={density}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-1)', maxWidth: '100ch' }}
    >
      {VARIANTS.map((variant) => (
        <Drawn key={variant.name} variant={variant} painter={painter} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    // Not a vacuous pass: seven layouts, every one looked at.
    expect(report.layers).toBe(7);
    expect(report.joins).toBeGreaterThan(300);
  },
});

// The tag is written on each story, not inside the factory: Storybook reads
// tags from the source without running it, and the zoom browser selects by tag.
export const ContinuityDenseGlyph: Story = { ...continuity('dense', 'glyph'), tags: ['zoom'] };
export const ContinuityDenseRule: Story = { ...continuity('dense', 'rule'), tags: ['zoom'] };
export const ContinuityNormalGlyph: Story = { ...continuity('normal', 'glyph'), tags: ['zoom'] };
export const ContinuityNormalRule: Story = { ...continuity('normal', 'rule'), tags: ['zoom'] };
export const ContinuityAiryGlyph: Story = { ...continuity('airy', 'glyph'), tags: ['zoom'] };
export const ContinuityAiryRule: Story = { ...continuity('airy', 'rule'), tags: ['zoom'] };
export const ContinuityTouchGlyph: Story = { ...continuity('touch', 'glyph'), tags: ['zoom'] };
export const ContinuityTouchRule: Story = { ...continuity('touch', 'rule'), tags: ['zoom'] };

/**
 * Touch density: the cell is tall enough for a finger, and every pane and
 * every control in it is still whole cells.
 */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Shell cols={76} rows={10} />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const screen = canvas.getByRole('group', { name: 'repository' });
    expect(cellOf(screen).height).toBeGreaterThanOrEqual(32);
    const stage = canvas.getByRole('button', { name: 'Stage' });
    expect(stage.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
  },
};

/**
 * Held to `strict` (cairn 0123): every box inside the screen, each pane and
 * everything in it, is whole cells. The check after every story reads the
 * level from here.
 */
export const Strict: Story = {
  render: () => (
    <div data-rk-conformance="strict">
      <Shell cols={76} rows={10} />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const pane of canvas.getAllByRole('region')) {
      expect(pane.hasAttribute('data-rk-pane')).toBe(true);
    }
  },
};

/** Dark mode: the same panes on the dark palette, and axe on them. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Shell cols={76} rows={10} />,
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(canvas.getByRole('region', { name: 'diff' })).toBeVisible();
  },
};

/**
 * Forced colors: the reader's palette replaces ours. Every border, rule and
 * junction is stroked in their text colour, and the panes still read, because
 * they are lines and titles, not tints.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Shell cols={76} rows={10} />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const screen = canvas.getByRole('group', { name: 'repository' });
    const cells = screen.querySelectorAll<HTMLElement>('[data-rk-shape]');
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(getComputedStyle(cell).getPropertyValue('--rk-ink-colour').trim()).toBe('CanvasText');
    }
  },
};

const SURFACES = ['sunken', 'base', 'raised', 'overlay'] as const;

/** A row of four panes, one per surface, each named by its surface. */
function SurfaceRow(): ReactNode {
  return (
    <Panes label="surfaces" cols={60} rows={5}>
      {SURFACES.map((surface) => (
        <Pane key={surface} surface={surface} title={surface}>
          <p style={{ margin: 0 }}>{surface}</p>
        </Pane>
      ))}
    </Panes>
  );
}

const surfacesPlay: NonNullable<Story['play']> = async ({ canvas }) => {
  await settled();
  for (const surface of SURFACES) {
    const pane = canvas.getByRole('region', { name: surface });
    expect(pane.dataset.rkSurface).toBe(surface);
    expect(getComputedStyle(pane).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  }
};

/**
 * Each pane takes a ground of its own (cairn 0308): the content and padding
 * are painted, the shared borders stay the screen's, and every line still
 * meets (the check after the story).
 */
export const Surfaces: Story = {
  render: () => <SurfaceRow />,
  play: surfacesPlay,
};

/** The same surfaces on two other themes: the roles are the theme's, not ours. */
export const SurfacesNord: Story = {
  globals: { theme: 'nord', mode: 'dark' },
  render: () => <SurfaceRow />,
  play: surfacesPlay,
};

export const SurfacesPhosphor: Story = {
  globals: { theme: 'phosphor' },
  render: () => <SurfaceRow />,
  play: surfacesPlay,
};

/** Pads, as [name, pad, columns in, rows down]. */
const PADS = [
  ['default', undefined, 1, 0],
  ['none', 0, 0, 0],
  ['two', 2, 2, 2],
  ['wide', { x: 3, y: 1 }, 3, 1],
] as const;

/**
 * Padding is whole cells, one across and none down by default, so text never
 * touches a border. The first line starts `pad` cells in from the pane.
 */
export const Padding: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {PADS.map(([name, pad]) => (
        <Panes key={name} label={`${name} pad`} cols={30} rows={6}>
          <Pane surface="raised" title={name} {...(pad === undefined ? {} : { pad })}>
            <p style={{ margin: 0 }}>{name}</p>
          </Pane>
        </Panes>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const [name, , x, y] of PADS) {
      const pane = canvas.getByRole('region', { name });
      const text = pane.querySelector('p') as HTMLElement;
      const cell = cellOf(pane.closest('.rk-screen') as Element);
      const at = text.getBoundingClientRect();
      const from = pane.getBoundingClientRect();
      expect((at.left - from.left) / cell.width).toBeCloseTo(x, 1);
      expect((at.top - from.top) / cell.height).toBeCloseTo(y, 1);
    }
  },
};

/**
 * Surfaces under forced colours collapse to Canvas: no ground is a different
 * colour from any other, and the borders carry the structure.
 */
export const SurfacesForcedColors: Story = {
  name: 'Surfaces, forced colors',
  tags: ['forced-colors'],
  render: () => <SurfaceRow />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'Canvas';
    document.body.append(probe);
    const canvasColour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    for (const surface of SURFACES) {
      const pane = canvas.getByRole('region', { name: surface });
      expect(getComputedStyle(pane).backgroundColor).toBe(canvasColour);
    }
  },
};
