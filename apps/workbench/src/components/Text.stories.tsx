import { stringWidth } from '@rockaway/grid';
import {
  Frame,
  frameBuffer,
  GlyphProvider,
  halfTextSizes,
  type PainterName,
  Text,
  type TextSize,
  textCols,
  textRows,
  textScale,
  textSizes,
} from '@rockaway/react';
import { checkConformance, screenshot } from '@rockaway/react/testing';
import { contentHeight, glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { renderToString } from 'react-dom/server';
import { expect, userEvent } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Text',
  component: Text,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/** The cell an element is drawn in, and the line and face its sizes are worked from. */
function metricsOf(el: Element) {
  const style = getComputedStyle(el);
  const screen = el.closest('.rk-screen') ?? el;
  const cell = getComputedStyle(screen);
  return {
    width: Number.parseFloat(cell.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(cell.getPropertyValue('--rk-cell-height')),
    line: Number.parseFloat(style.getPropertyValue('--rk-cell-line')),
    content: Number.parseFloat(style.getPropertyValue('--rk-font-content')),
  };
}

/** Pixels as cells, to the nearest hundredth. */
const cells = (px: number, cell: number): number => Math.round((px / cell) * 100) / 100;

/** The box the words themselves take, as the scaled face lays them out. */
function runOf(el: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(el.querySelector('.rk-text-glyphs') ?? el);
  return range.getBoundingClientRect();
}

/**
 * A run set inline is `size` rows tall and a whole number of cells wide,
 * wherever it is: the block it is in, the density, the face. Its box covers
 * its words as the scaled face lays them out, which is not always the
 * ordinary advance scaled (a hinted face rounds each), and is never narrower
 * than the cells `textCols` counts; past the wider of the two it pads less
 * than a cell.
 */
function expectSized(el: HTMLElement, text: string, size: TextSize): void {
  const m = metricsOf(el);
  const box = el.getBoundingClientRect();
  expect(cells(box.height, m.height), `${text} at ${size}: rows`).toBe(size);
  const cols = cells(box.width, m.width);
  const counted = textCols(text, size, { line: m.line, content: m.content });
  const run = runOf(el).width;
  const scaled =
    stringWidth(text) * m.width * textScale(size, { line: m.line, content: m.content });
  const seen = `box ${box.width}px, words ${run}px, scaled ${scaled}px, cell ${m.width}px`;
  expect(Number.isInteger(cols), `${text} at ${size}: whole cells (${seen})`).toBe(true);
  expect(cols, `${text} at ${size}: at least the cells counted (${seen})`).toBeGreaterThanOrEqual(
    counted,
  );
  expect(box.width, `${text} at ${size}: covers its words (${seen})`).toBeGreaterThanOrEqual(
    run - 1 / 64,
  );
  expect(
    box.width - Math.max(run, scaled),
    `${text} at ${size}: pads less than a cell (${seen})`,
  ).toBeLessThan(m.width);
  // Its glyph box fills the rows exactly: the line box is the font's ascent
  // plus descent.
  const glyphs = el.querySelector('.rk-text-glyphs') as HTMLElement;
  const style = getComputedStyle(glyphs);
  expect(
    Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize),
    `${text} at ${size}: line box over font size`,
  ).toBeCloseTo(m.content, 3);
}

/**
 * Every size, set inline, one to a line: each `size` rows tall and a whole
 * number of cells wide, and read back as its word from the first cell, then
 * padding to the end of its box. The same at 200% zoom.
 */
export const EverySize: Story = {
  name: 'Every size',
  // Again at 200%, where every CSS pixel is two: the rows, the cells and the
  // glyphs scale together, so nothing changes in cells.
  tags: ['zoom'],
  render: () => (
    <Frame title="sizes" cols={40} rows={11} data-testid="sizes">
      {textSizes.map((size) => (
        <div key={size}>
          <Text size={size} inline data-testid={`size ${size}`}>
            Rock
          </Text>
        </div>
      ))}
    </Frame>
  ),
  args: { size: 2 },
  play: async ({ canvas }) => {
    await settled();
    for (const size of textSizes) {
      expectSized(canvas.getByTestId(`size ${size}`), 'Rock', size);
    }
    const rows = screenshot(canvas.getByTestId('sizes'), { legend: false }).split('\n');
    // Each word on the first row of its run, and the rows under it blank.
    expect(rows.slice(1, 10).map((row) => row.slice(2, 6))).toEqual(
      ['Rock', '', 'Rock', '', '', 'Rock', '', '', ''].map((word) => word.padEnd(4)),
    );
  },
};

/** Each size, at one density, in one painter's frame. */
function densities(painter: PainterName): Story {
  return {
    args: { size: 2 },
    render: () => (
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
        {DENSITIES.map((density) => (
          <div key={density} data-density={density}>
            <Frame title={density} painter={painter} cols={21} rows={11}>
              {textSizes.map((size) => (
                <div key={size}>
                  <Text size={size} inline data-testid={`${density} ${size}`}>
                    Go
                  </Text>
                </div>
              ))}
            </Frame>
          </div>
        ))}
      </div>
    ),
    play: async ({ canvas }) => {
      await settled();
      const heights = DENSITIES.map((density) => {
        for (const size of textSizes) {
          expectSized(canvas.getByTestId(`${density} ${size}`), 'Go', size);
        }
        return canvas.getByTestId(`${density} 2`).getBoundingClientRect().height;
      });
      // The same size is taller at each density: N rows are taller rows.
      for (let i = 1; i < heights.length; i++) {
        expect(heights[i]).toBeGreaterThan(heights[i - 1] as number);
      }
    },
  };
}

/**
 * Each size at every density, in the glyph painter's frame. Size N is N rows
 * of whatever the density makes a row, so the type grows with the density.
 */
export const DensitiesGlyph: Story = { ...densities('glyph'), name: 'Densities, glyph' };

/** The same, in the rule painter's frame. */
export const DensitiesRule: Story = { ...densities('rule'), name: 'Densities, rule' };

/** Faces whose glyph box is known, with it, in the order to look for them. */
const FACES = [
  { family: 'IBM Plex Mono', content: contentHeight['ibm-plex'] },
  { family: 'JetBrains Mono Variable', content: contentHeight.jetbrains },
] as const;

/** The first of those the workbench has loaded. */
async function knownFace(): Promise<(typeof FACES)[number]> {
  for (const face of FACES) {
    if ((await document.fonts.load(`16px "${face.family}"`)).length > 0) return face;
  }
  throw new Error(`the workbench loads none of ${FACES.map((f) => f.family).join(', ')}`);
}

/**
 * The glyphs fill the rows, in a face whose glyph box is known. Set in IBM
 * Plex Mono or JetBrains Mono, whichever the workbench loads, with its
 * content height, each size's glyph box, the face's ascent plus descent as
 * the engine lays it out, is its rows and starts on its first, at every
 * density. Within a pixel: Gecko and Chromium on Linux round the ascent and
 * the descent each to a whole pixel.
 */
export const FillsItsRows: Story = {
  name: 'Glyphs fill their rows',
  args: { size: 2 },
  render: () => (
    <div data-testid="face" data-density="dense">
      <Frame title="face" cols={36} rows={10}>
        {textSizes.map((size) => (
          <div key={size}>
            <Text size={size} inline data-testid={`fill ${size}`}>
              Rock
            </Text>
          </div>
        ))}
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    const { family, content } = await knownFace();
    const face = canvas.getByTestId('face');
    face.style.setProperty('--rk-font-family-mono', `"${family}"`);
    face.style.setProperty('--rk-font-content', String(content));
    for (const density of DENSITIES) {
      face.dataset.density = density;
      await settled();
      for (const size of textSizes) {
        const el = canvas.getByTestId(`fill ${size}`);
        const m = metricsOf(el);
        expect(
          getComputedStyle(el.querySelector('.rk-text-glyphs') as Element).fontFamily,
        ).toContain(family);
        expectSized(el, 'Rock', size);
        const box = el.getBoundingClientRect();
        const glyphs = runOf(el);
        const seen = `glyph box ${glyphs.top - box.top}px to ${glyphs.bottom - box.top}px, rows ${box.height}px`;
        expect(
          Math.abs(glyphs.height - size * m.height),
          `${density} ${size}: fills (${seen})`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(glyphs.top - box.top),
          `${density} ${size}: from the first row (${seen})`,
        ).toBeLessThanOrEqual(1);
      }
    }
  },
};

/**
 * A two-row heading in a frame. It is a block, so it takes the frame's inner
 * width; it is two rows, so the frame holds it in whole rows, and the frame's
 * lines meet around it in every cell (the continuity check after the story).
 */
export const HeadingInFrame: Story = {
  name: 'A heading in a frame',
  args: { size: 2 },
  render: () => (
    <Frame title="docs" cols={30} rows={5} data-testid="docs">
      <Text size={2} as="h1">
        Start
      </Text>
      <p style={{ margin: 0 }}>Install the packages.</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 1, name: 'Start' });
    const frame = canvas.getByTestId('docs');
    const m = metricsOf(heading);
    const box = heading.getBoundingClientRect();
    const origin = frame.getBoundingClientRect();
    // Rows one and two, inside the top border, and the paragraph on row three.
    expect(cells(box.top - origin.top, m.height)).toBe(1);
    expect(cells(box.height, m.height)).toBe(2);
    expect(cells(box.width, m.width)).toBe(26);
    const border = frameBuffer({ width: 30, height: 5 }, { title: 'docs' });
    const inside = (words: string) => `│ ${words.padEnd(26)} │`;
    expect(screenshot(frame, { legend: false, trimEnd: false })).toBe(
      [
        border.row(0),
        inside('Start'),
        inside(''),
        inside('Install the packages.'),
        border.row(4),
      ].join('\n'),
    );
  },
};

/**
 * A two-row heading in a page of prose, whose h1 and h2 shrink to their words
 * so the rule under them is as long as they are. Shrunk to scaled words a
 * heading would be a fraction of a cell wide, so a sized one takes the
 * measure, which is whole cells, and its rule runs the measure's length. The
 * check after the story holds every box to the grid.
 */
export const HeadingInProse: Story = {
  name: 'A heading in prose',
  args: { size: 2 },
  render: () => (
    <Frame title="prose" cols={30} rows={7}>
      <article className="rk-prose">
        <Text size={2} as="h2">
          Install
        </Text>
        <p>Add the packages.</p>
      </article>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 2, name: 'Install' });
    const m = metricsOf(heading);
    const box = heading.getBoundingClientRect();
    // Two rows of words and the rule's row under them, the measure across.
    expect(cells(box.height, m.height)).toBe(3);
    expect(cells(box.width, m.width)).toBe(26);
  },
};

/**
 * A three-row display line beside ordinary text. The line is exactly three
 * rows, and the ordinary text sits on its last row, on the grid, where the
 * large word's baseline is.
 */
export const DisplayLine: Story = {
  name: 'A display line beside ordinary text',
  args: { size: 3 },
  render: () => (
    <Frame title="hero" cols={44} rows={6} data-testid="hero">
      <div data-testid="line">
        <Text size={3} inline data-testid="display">
          Rock
        </Text>{' '}
        <span data-testid="ordinary">a system</span>
      </div>
      <p style={{ margin: 0 }}>for the terminal.</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const line = canvas.getByTestId('line');
    const m = metricsOf(line);
    expectSized(canvas.getByTestId('display'), 'Rock', 3);
    expect(cells(line.getBoundingClientRect().height, m.height)).toBe(3);
    // The ordinary text's line box is the last of the three rows.
    const range = document.createRange();
    range.selectNodeContents(canvas.getByTestId('ordinary'));
    const text = range.getBoundingClientRect();
    const top = line.getBoundingClientRect().top;
    const middle = (text.top + text.bottom) / 2 - top;
    expect(Math.floor(middle / m.height)).toBe(2);
    // And the box it is in starts on a column.
    const ordinary = canvas.getByTestId('ordinary').getBoundingClientRect();
    const left = (ordinary.left - line.getBoundingClientRect().left) / m.width;
    expect(Math.abs(left - Math.round(left)) * m.width).toBeLessThan(0.5);
  },
};

/**
 * Copied with the reader's own keys: the heading is selected with a triple
 * click and copied with the platform's copy chord, and what is copied is its
 * words alone. The padding is a box, not characters.
 */
export const Copy: Story = {
  name: 'Copied',
  args: { size: 2 },
  render: () => (
    <Frame title="copy" cols={28} rows={4}>
      <Text size={2} as="h1">
        Start
      </Text>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 1 });
    let copied: string | undefined;
    const listen = () => {
      copied = document.getSelection()?.toString();
    };
    document.addEventListener('copy', listen);
    try {
      await userEvent.tripleClick(heading);
      const mac = /Mac|iPhone|iPad/.test(navigator.platform);
      const run = runner();
      const chord = mac ? '{Meta>}c{/Meta}' : '{Control>}c{/Control}';
      await (run ? run.type(chord) : userEvent.keyboard(chord));
    } finally {
      document.removeEventListener('copy', listen);
    }
    // The words, and nothing after them: no padding, no rows of space.
    // Chromium and WebKit copy what the page shows, a heading's capitals
    // included (0075); Gecko copies the letters as written.
    expect([heading.innerText, heading.textContent]).toContain(copied?.replace(/\n+$/, ''));
    expect(copied?.trim().toLowerCase()).toBe('start');
  },
};

/** Under an ASCII theme the frame is ASCII, and so is everything read back. */
export const Ascii: Story = {
  name: 'ASCII',
  args: { size: 2 },
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={28} rows={4} data-testid="ascii">
        <Text size={2} as="h1">
          Start
        </Text>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await settled();
    const text = screenshot(canvas.getByTestId('ascii'), { legend: false });
    expect([...text].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
    expect(text.split('\n')[1]?.startsWith('| Start ')).toBe(true);
  },
};

/**
 * Strict conformance is one size (0072, 0296): a screen held to it reports
 * sized text as a violation of its own. The check after the story is off,
 * since this one fails it on purpose; the story runs the check itself.
 */
export const Strict: Story = {
  name: 'Refused at strict',
  args: { size: 2 },
  parameters: { conformance: false },
  render: () => (
    <div data-rk-conformance="strict">
      <Frame title="strict" cols={28} rows={4} data-testid="strict">
        <Text size={2} as="h1">
          Start
        </Text>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const report = checkConformance(canvas.getByTestId('strict'));
    expect(report.violations.map((v) => v.what)).toEqual(['size']);
  },
};

/**
 * With JavaScript off. A heading and a display word rendered on a server, in a
 * page that runs no script at all, are their rows and their cells: the
 * stylesheet does all of it.
 */
export const WithoutJavaScript: Story = {
  name: 'Sized with JavaScript off',
  args: { size: 2 },
  play: async () => {
    const run = runner();
    if (!run) return;
    const html = renderToString(
      <div style={{ inlineSize: '60ch' }}>
        <span data-measure="cell" style={{ display: 'inline-block' }}>
          {'0'.repeat(10)}
        </span>
        <Text size={2} as="h1" data-measure="heading">
          Start
        </Text>
        <Text size={3} inline data-measure="display">
          Rockaway
        </Text>
      </div>,
    );
    const css = [...document.styleSheets]
      .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('\n'))
      .join('\n');
    const page = `<!doctype html><html data-theme="light" data-density="normal"><style>${css}</style><body><script>document.body.dataset.ran = 'yes'</script>${html}</body></html>`;
    const read = await run.withoutScripts(page);
    expect(read.ran).toBe(false);
    const { cell, heading, display } = read.boxes;
    if (!cell || !heading || !display) throw new Error('a measured box is missing');
    const width = cell.width / 10;
    const height = cell.height;
    expect(cells(heading.height, height)).toBe(2);
    expect(cells(display.height, height)).toBe(3);
    const content = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--rk-font-content'),
    );
    expect(cells(display.width, width)).toBe(textCols('Rockaway', 3, { line: 1.5, content }));
  },
};

/** Forced colours: the words are the reader's text colour, and the frame still meets. */
export const ForcedColors: Story = {
  name: 'Forced colours',
  tags: ['forced-colors'],
  args: { size: 2 },
  render: () => (
    <Frame title="forced" cols={28} rows={4}>
      <Text size={2} as="h1">
        Start
      </Text>
    </Frame>
  ),
};

/**
 * Half-row sizes (0323): the glyphs a row and a half, or two and a half, tall,
 * padded up to whole rows. A run set inline is padded above its glyphs, so the
 * line it sits on is whole rows; a block is a seam, so a one-line heading at
 * 1.5 is two rows and a two-line one is three, whatever the density.
 */
export const HalfSizes: Story = {
  name: 'Half-row sizes',
  args: { size: 1.5 },
  render: () => (
    <Frame title="half" cols={30} rows={12} data-testid="half">
      {halfTextSizes.map((size) => (
        <div key={size}>
          <Text size={size} inline data-testid={`inline ${size}`}>
            Go
          </Text>
        </div>
      ))}
      <Text size={1.5} as="h2" data-testid="one line">
        Start
      </Text>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 12)', whiteSpace: 'normal' }}>
        <Text size={1.5} as="h2" data-testid="two lines">
          Start here
        </Text>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const size of halfTextSizes) {
      const run = canvas.getByTestId(`inline ${size}`);
      const m = metricsOf(run);
      expect(cells(run.getBoundingClientRect().height, m.height), `inline ${size}`).toBe(
        textRows(size),
      );
      // The glyphs are their size, at the bottom of the padded box.
      const glyphs = run.querySelector<HTMLElement>('.rk-text-glyphs');
      const line = Number.parseFloat(getComputedStyle(glyphs as HTMLElement).lineHeight);
      expect(cells(line, m.height), `glyphs ${size}`).toBe(size);
    }
    // A block closes to whole rows, however many lines it wrapped to: its
    // lines are a row and a half each, and the seam rounds them up.
    for (const id of ['one line', 'two lines']) {
      const block = canvas.getByTestId(id);
      const m = metricsOf(block);
      const glyphs = block.querySelector<HTMLElement>('.rk-text-glyphs') as HTMLElement;
      const lines = Math.round(
        glyphs.getBoundingClientRect().height /
          Number.parseFloat(getComputedStyle(glyphs).lineHeight),
      );
      expect(lines, id).toBe(id === 'one line' ? 1 : 2);
      expect(cells(block.getBoundingClientRect().height, m.height), id).toBe(
        Math.ceil(lines * 1.5),
      );
    }
  },
};
import { stringWidth } from '@rockaway/grid';
import {
  Frame,
  frameBuffer,
  GlyphProvider,
  type PainterName,
  Text,
  type TextSize,
  textCols,
  textScale,
  textSizes,
} from '@rockaway/react';
import { checkConformance, screenshot } from '@rockaway/react/testing';
import { contentHeight, glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { renderToString } from 'react-dom/server';
import { expect, userEvent } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Text',
  component: Text,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;

/** The cell an element is drawn in, and the line and face its sizes are worked from. */
function metricsOf(el: Element) {
  const style = getComputedStyle(el);
  const screen = el.closest('.rk-screen') ?? el;
  const cell = getComputedStyle(screen);
  return {
    width: Number.parseFloat(cell.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(cell.getPropertyValue('--rk-cell-height')),
    line: Number.parseFloat(style.getPropertyValue('--rk-cell-line')),
    content: Number.parseFloat(style.getPropertyValue('--rk-font-content')),
  };
}

/** Pixels as cells, to the nearest hundredth. */
const cells = (px: number, cell: number): number => Math.round((px / cell) * 100) / 100;

/** The box the words themselves take, as the scaled face lays them out. */
function runOf(el: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(el.querySelector('.rk-text-glyphs') ?? el);
  return range.getBoundingClientRect();
}

/**
 * A run set inline is `size` rows tall and a whole number of cells wide,
 * wherever it is: the block it is in, the density, the face. Its box covers
 * its words as the scaled face lays them out, which is not always the
 * ordinary advance scaled (a hinted face rounds each), and is never narrower
 * than the cells `textCols` counts; past the wider of the two it pads less
 * than a cell.
 */
function expectSized(el: HTMLElement, text: string, size: TextSize): void {
  const m = metricsOf(el);
  const box = el.getBoundingClientRect();
  expect(cells(box.height, m.height), `${text} at ${size}: rows`).toBe(size);
  const cols = cells(box.width, m.width);
  const counted = textCols(text, size, { line: m.line, content: m.content });
  const run = runOf(el).width;
  const scaled =
    stringWidth(text) * m.width * textScale(size, { line: m.line, content: m.content });
  const seen = `box ${box.width}px, words ${run}px, scaled ${scaled}px, cell ${m.width}px`;
  expect(Number.isInteger(cols), `${text} at ${size}: whole cells (${seen})`).toBe(true);
  expect(cols, `${text} at ${size}: at least the cells counted (${seen})`).toBeGreaterThanOrEqual(
    counted,
  );
  expect(box.width, `${text} at ${size}: covers its words (${seen})`).toBeGreaterThanOrEqual(
    run - 1 / 64,
  );
  expect(
    box.width - Math.max(run, scaled),
    `${text} at ${size}: pads less than a cell (${seen})`,
  ).toBeLessThan(m.width);
  // Its glyph box fills the rows exactly: the line box is the font's ascent
  // plus descent.
  const glyphs = el.querySelector('.rk-text-glyphs') as HTMLElement;
  const style = getComputedStyle(glyphs);
  expect(
    Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize),
    `${text} at ${size}: line box over font size`,
  ).toBeCloseTo(m.content, 3);
}

/**
 * Every size, set inline, one to a line: each `size` rows tall and a whole
 * number of cells wide, and read back as its word from the first cell, then
 * padding to the end of its box. The same at 200% zoom.
 */
export const EverySize: Story = {
  name: 'Every size',
  // Again at 200%, where every CSS pixel is two: the rows, the cells and the
  // glyphs scale together, so nothing changes in cells.
  tags: ['zoom'],
  render: () => (
    <Frame title="sizes" cols={40} rows={11} data-testid="sizes">
      {textSizes.map((size) => (
        <div key={size}>
          <Text size={size} inline data-testid={`size ${size}`}>
            Rock
          </Text>
        </div>
      ))}
    </Frame>
  ),
  args: { size: 2 },
  play: async ({ canvas }) => {
    await settled();
    for (const size of textSizes) {
      expectSized(canvas.getByTestId(`size ${size}`), 'Rock', size);
    }
    const rows = screenshot(canvas.getByTestId('sizes'), { legend: false }).split('\n');
    // Each word on the first row of its run, and the rows under it blank.
    expect(rows.slice(1, 10).map((row) => row.slice(2, 6))).toEqual(
      ['Rock', '', 'Rock', '', '', 'Rock', '', '', ''].map((word) => word.padEnd(4)),
    );
  },
};

/** Each size, at one density, in one painter's frame. */
function densities(painter: PainterName): Story {
  return {
    args: { size: 2 },
    render: () => (
      <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
        {DENSITIES.map((density) => (
          <div key={density} data-density={density}>
            <Frame title={density} painter={painter} cols={21} rows={11}>
              {textSizes.map((size) => (
                <div key={size}>
                  <Text size={size} inline data-testid={`${density} ${size}`}>
                    Go
                  </Text>
                </div>
              ))}
            </Frame>
          </div>
        ))}
      </div>
    ),
    play: async ({ canvas }) => {
      await settled();
      const heights = DENSITIES.map((density) => {
        for (const size of textSizes) {
          expectSized(canvas.getByTestId(`${density} ${size}`), 'Go', size);
        }
        return canvas.getByTestId(`${density} 2`).getBoundingClientRect().height;
      });
      // The same size is taller at each density: N rows are taller rows.
      for (let i = 1; i < heights.length; i++) {
        expect(heights[i]).toBeGreaterThan(heights[i - 1] as number);
      }
    },
  };
}

/**
 * Each size at every density, in the glyph painter's frame. Size N is N rows
 * of whatever the density makes a row, so the type grows with the density.
 */
export const DensitiesGlyph: Story = { ...densities('glyph'), name: 'Densities, glyph' };

/** The same, in the rule painter's frame. */
export const DensitiesRule: Story = { ...densities('rule'), name: 'Densities, rule' };

/** Faces whose glyph box is known, with it, in the order to look for them. */
const FACES = [
  { family: 'IBM Plex Mono', content: contentHeight['ibm-plex'] },
  { family: 'JetBrains Mono Variable', content: contentHeight.jetbrains },
] as const;

/** The first of those the workbench has loaded. */
async function knownFace(): Promise<(typeof FACES)[number]> {
  for (const face of FACES) {
    if ((await document.fonts.load(`16px "${face.family}"`)).length > 0) return face;
  }
  throw new Error(`the workbench loads none of ${FACES.map((f) => f.family).join(', ')}`);
}

/**
 * The glyphs fill the rows, in a face whose glyph box is known. Set in IBM
 * Plex Mono or JetBrains Mono, whichever the workbench loads, with its
 * content height, each size's glyph box, the face's ascent plus descent as
 * the engine lays it out, is its rows and starts on its first, at every
 * density. Within a pixel: Gecko and Chromium on Linux round the ascent and
 * the descent each to a whole pixel.
 */
export const FillsItsRows: Story = {
  name: 'Glyphs fill their rows',
  args: { size: 2 },
  render: () => (
    <div data-testid="face" data-density="dense">
      <Frame title="face" cols={36} rows={10}>
        {textSizes.map((size) => (
          <div key={size}>
            <Text size={size} inline data-testid={`fill ${size}`}>
              Rock
            </Text>
          </div>
        ))}
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    const { family, content } = await knownFace();
    const face = canvas.getByTestId('face');
    face.style.setProperty('--rk-font-family-mono', `"${family}"`);
    face.style.setProperty('--rk-font-content', String(content));
    for (const density of DENSITIES) {
      face.dataset.density = density;
      await settled();
      for (const size of textSizes) {
        const el = canvas.getByTestId(`fill ${size}`);
        const m = metricsOf(el);
        expect(
          getComputedStyle(el.querySelector('.rk-text-glyphs') as Element).fontFamily,
        ).toContain(family);
        expectSized(el, 'Rock', size);
        const box = el.getBoundingClientRect();
        const glyphs = runOf(el);
        const seen = `glyph box ${glyphs.top - box.top}px to ${glyphs.bottom - box.top}px, rows ${box.height}px`;
        expect(
          Math.abs(glyphs.height - size * m.height),
          `${density} ${size}: fills (${seen})`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(glyphs.top - box.top),
          `${density} ${size}: from the first row (${seen})`,
        ).toBeLessThanOrEqual(1);
      }
    }
  },
};

/**
 * A two-row heading in a frame. It is a block, so it takes the frame's inner
 * width; it is two rows, so the frame holds it in whole rows, and the frame's
 * lines meet around it in every cell (the continuity check after the story).
 */
export const HeadingInFrame: Story = {
  name: 'A heading in a frame',
  args: { size: 2 },
  render: () => (
    <Frame title="docs" cols={30} rows={5} data-testid="docs">
      <Text size={2} as="h1">
        Start
      </Text>
      <p style={{ margin: 0 }}>Install the packages.</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 1, name: 'Start' });
    const frame = canvas.getByTestId('docs');
    const m = metricsOf(heading);
    const box = heading.getBoundingClientRect();
    const origin = frame.getBoundingClientRect();
    // Rows one and two, inside the top border, and the paragraph on row three.
    expect(cells(box.top - origin.top, m.height)).toBe(1);
    expect(cells(box.height, m.height)).toBe(2);
    expect(cells(box.width, m.width)).toBe(26);
    const border = frameBuffer({ width: 30, height: 5 }, { title: 'docs' });
    const inside = (words: string) => `│ ${words.padEnd(26)} │`;
    expect(screenshot(frame, { legend: false, trimEnd: false })).toBe(
      [
        border.row(0),
        inside('Start'),
        inside(''),
        inside('Install the packages.'),
        border.row(4),
      ].join('\n'),
    );
  },
};

/**
 * A two-row heading in a page of prose, whose h1 and h2 shrink to their words
 * so the rule under them is as long as they are. Shrunk to scaled words a
 * heading would be a fraction of a cell wide, so a sized one takes the
 * measure, which is whole cells, and its rule runs the measure's length. The
 * check after the story holds every box to the grid.
 */
export const HeadingInProse: Story = {
  name: 'A heading in prose',
  args: { size: 2 },
  render: () => (
    <Frame title="prose" cols={30} rows={7}>
      <article className="rk-prose">
        <Text size={2} as="h2">
          Install
        </Text>
        <p>Add the packages.</p>
      </article>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 2, name: 'Install' });
    const m = metricsOf(heading);
    const box = heading.getBoundingClientRect();
    // Two rows of words and the rule's row under them, the measure across.
    expect(cells(box.height, m.height)).toBe(3);
    expect(cells(box.width, m.width)).toBe(26);
  },
};

/**
 * A three-row display line beside ordinary text. The line is exactly three
 * rows, and the ordinary text sits on its last row, on the grid, where the
 * large word's baseline is.
 */
export const DisplayLine: Story = {
  name: 'A display line beside ordinary text',
  args: { size: 3 },
  render: () => (
    <Frame title="hero" cols={44} rows={6} data-testid="hero">
      <div data-testid="line">
        <Text size={3} inline data-testid="display">
          Rock
        </Text>{' '}
        <span data-testid="ordinary">a system</span>
      </div>
      <p style={{ margin: 0 }}>for the terminal.</p>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const line = canvas.getByTestId('line');
    const m = metricsOf(line);
    expectSized(canvas.getByTestId('display'), 'Rock', 3);
    expect(cells(line.getBoundingClientRect().height, m.height)).toBe(3);
    // The ordinary text's line box is the last of the three rows.
    const range = document.createRange();
    range.selectNodeContents(canvas.getByTestId('ordinary'));
    const text = range.getBoundingClientRect();
    const top = line.getBoundingClientRect().top;
    const middle = (text.top + text.bottom) / 2 - top;
    expect(Math.floor(middle / m.height)).toBe(2);
    // And the box it is in starts on a column.
    const ordinary = canvas.getByTestId('ordinary').getBoundingClientRect();
    const left = (ordinary.left - line.getBoundingClientRect().left) / m.width;
    expect(Math.abs(left - Math.round(left)) * m.width).toBeLessThan(0.5);
  },
};

/**
 * Copied with the reader's own keys: the heading is selected with a triple
 * click and copied with the platform's copy chord, and what is copied is its
 * words alone. The padding is a box, not characters.
 */
export const Copy: Story = {
  name: 'Copied',
  args: { size: 2 },
  render: () => (
    <Frame title="copy" cols={28} rows={4}>
      <Text size={2} as="h1">
        Start
      </Text>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const heading = canvas.getByRole('heading', { level: 1 });
    let copied: string | undefined;
    const listen = () => {
      copied = document.getSelection()?.toString();
    };
    document.addEventListener('copy', listen);
    try {
      await userEvent.tripleClick(heading);
      const mac = /Mac|iPhone|iPad/.test(navigator.platform);
      const run = runner();
      const chord = mac ? '{Meta>}c{/Meta}' : '{Control>}c{/Control}';
      await (run ? run.type(chord) : userEvent.keyboard(chord));
    } finally {
      document.removeEventListener('copy', listen);
    }
    // The words, and nothing after them: no padding, no rows of space.
    // Chromium and WebKit copy what the page shows, a heading's capitals
    // included (0075); Gecko copies the letters as written.
    expect([heading.innerText, heading.textContent]).toContain(copied?.replace(/\n+$/, ''));
    expect(copied?.trim().toLowerCase()).toBe('start');
  },
};

/** Under an ASCII theme the frame is ASCII, and so is everything read back. */
export const Ascii: Story = {
  name: 'ASCII',
  args: { size: 2 },
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={28} rows={4} data-testid="ascii">
        <Text size={2} as="h1">
          Start
        </Text>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await settled();
    const text = screenshot(canvas.getByTestId('ascii'), { legend: false });
    expect([...text].every((ch) => ch.charCodeAt(0) < 0x7f)).toBe(true);
    expect(text.split('\n')[1]?.startsWith('| Start ')).toBe(true);
  },
};

/**
 * Strict conformance is one size (0072, 0296): a screen held to it reports
 * sized text as a violation of its own. The check after the story is off,
 * since this one fails it on purpose; the story runs the check itself.
 */
export const Strict: Story = {
  name: 'Refused at strict',
  args: { size: 2 },
  parameters: { conformance: false },
  render: () => (
    <div data-rk-conformance="strict">
      <Frame title="strict" cols={28} rows={4} data-testid="strict">
        <Text size={2} as="h1">
          Start
        </Text>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const report = checkConformance(canvas.getByTestId('strict'));
    expect(report.violations.map((v) => v.what)).toEqual(['size']);
  },
};

/**
 * With JavaScript off. A heading and a display word rendered on a server, in a
 * page that runs no script at all, are their rows and their cells: the
 * stylesheet does all of it.
 */
export const WithoutJavaScript: Story = {
  name: 'Sized with JavaScript off',
  args: { size: 2 },
  play: async () => {
    const run = runner();
    if (!run) return;
    const html = renderToString(
      <div style={{ inlineSize: '60ch' }}>
        <span data-measure="cell" style={{ display: 'inline-block' }}>
          {'0'.repeat(10)}
        </span>
        <Text size={2} as="h1" data-measure="heading">
          Start
        </Text>
        <Text size={3} inline data-measure="display">
          Rockaway
        </Text>
      </div>,
    );
    const css = [...document.styleSheets]
      .map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('\n'))
      .join('\n');
    const page = `<!doctype html><html data-theme="light" data-density="normal"><style>${css}</style><body><script>document.body.dataset.ran = 'yes'</script>${html}</body></html>`;
    const read = await run.withoutScripts(page);
    expect(read.ran).toBe(false);
    const { cell, heading, display } = read.boxes;
    if (!cell || !heading || !display) throw new Error('a measured box is missing');
    const width = cell.width / 10;
    const height = cell.height;
    expect(cells(heading.height, height)).toBe(2);
    expect(cells(display.height, height)).toBe(3);
    const content = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--rk-font-content'),
    );
    expect(cells(display.width, width)).toBe(textCols('Rockaway', 3, { line: 1.5, content }));
  },
};

/** Forced colours: the words are the reader's text colour, and the frame still meets. */
export const ForcedColors: Story = {
  name: 'Forced colours',
  tags: ['forced-colors'],
  args: { size: 2 },
  render: () => (
    <Frame title="forced" cols={28} rows={4}>
      <Text size={2} as="h1">
        Start
      </Text>
    </Frame>
  ),
};
