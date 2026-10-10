import { Buffer, drawBox, rect, type Size } from '@rockaway/grid';
import {
  Badge,
  Button,
  Checkbox,
  Frame,
  List,
  ListItem,
  OverlayPopover,
  Screen,
} from '@rockaway/react';
import {
  type ConformanceLevel,
  type ConformanceReport,
  checkConformance,
  expectConformance,
  formatReport,
} from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { Dialog, DialogTrigger } from 'react-aria-components';
import { expect, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

const draw = ({ width, height }: Size): Buffer =>
  Buffer.create({ width, height }).draw((d) => {
    if (width >= 2 && height >= 2) drawBox(d, rect(0, 0, width, height));
  });

const cells = (n: number, axis: 'width' | 'height' = 'width'): string =>
  `calc(var(--rk-cell-${axis}) * ${n})`;

const onGrid: CSSProperties = {
  position: 'absolute',
  left: cells(2),
  top: cells(2, 'height'),
  width: cells(10),
  height: cells(1, 'height'),
};

/** A screen in a host the play function can set a level on. */
function Host({
  children,
  painter,
  wide,
}: {
  children?: ReactNode;
  painter?: 'glyph' | 'rule';
  wide?: boolean;
}) {
  return (
    <div data-testid="host">
      <Screen
        draw={draw}
        cols={24}
        rows={6}
        {...(painter === undefined ? {} : { painter })}
        {...(wide ? { style: { width: '100%', height: '100%' } } : {})}
      >
        {children}
      </Screen>
    </div>
  );
}

function Conforming() {
  return (
    <Host>
      <div style={onGrid}>on the grid</div>
    </Host>
  );
}

async function screenOf(canvas: { getByTestId: (id: string) => HTMLElement }) {
  const host = canvas.getByTestId('host');
  const screen = host.firstElementChild as HTMLElement;
  await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());
  /** The report with the host declaring `level`, which the screen inherits. */
  const at = (level: ConformanceLevel): ConformanceReport => {
    host.dataset.rkConformance = level;
    try {
      return checkConformance(screen);
    } finally {
      delete host.dataset.rkConformance;
    }
  };
  return { host, screen, at };
}

const meta = { title: 'Grid/Conformance', component: Conforming } satisfies Meta<typeof Conforming>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTheGrid: Story = {
  name: 'On the grid',
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    const report = expectConformance(screen);
    expect(report.violations).toEqual([]);
    expect(report.checked).toBeGreaterThan(0);
  },
};

export const OffTheGrid: Story = {
  name: 'Off the grid, undeclared',
  // The failure case on purpose, so the check that runs after every story is
  // told to leave this one alone.
  parameters: { conformance: false },
  render: () => (
    <Host>
      <div style={{ ...onGrid, width: '37.5px' }}>off by a half</div>
    </Host>
  ),
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    const report = checkConformance(screen);
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.violations[0]?.what).toBe('width');
    expect(formatReport(report)).toMatch(/width 37\.50px/);
    expect(() => expectConformance(screen)).toThrow(/off the grid/);
  },
};

export const DeclaredException: Story = {
  name: 'Off the grid, declared',
  render: () => (
    <Host wide>
      <div
        data-rk-offgrid="the logo is 37px and the brand team won"
        style={{ ...onGrid, width: '37.5px' }}
      >
        declared
      </div>
    </Host>
  ),
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    const report = expectConformance(screen);
    expect(report.violations).toEqual([]);
    expect(report.exceptions).toHaveLength(1);
    expect(report.exceptions[0]?.reason).toBe('the logo is 37px and the brand team won');
    expect(formatReport(report)).toContain('1 exception declared, 1 reason');
  },
};

/**
 * An exception has to say why (0072). An empty reason, or one of only
 * spaces, is not a declaration but a violation, and it excuses nothing: the
 * box under it is measured too, so the report says what it was hiding.
 */
export const NoReason: Story = {
  name: 'Off the grid, declared without a reason',
  parameters: { conformance: false },
  render: () => (
    <Host>
      <div data-rk-offgrid="" data-testid="empty" style={{ ...onGrid, width: '37.5px' }}>
        empty
      </div>
      <div data-rk-offgrid="   " data-testid="blank" style={{ ...onGrid, top: cells(4, 'height') }}>
        blank
      </div>
    </Host>
  ),
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    const report = checkConformance(screen);
    expect(report.exceptions).toEqual([]);
    const reasons = report.violations.filter((v) => v.what === 'reason');
    expect(reasons.map((v) => v.element)).toEqual(['div[empty]', 'div[blank]']);
    // The empty one also hid a box off the grid, and that is reported too.
    expect(report.violations).toContainEqual(
      expect.objectContaining({ what: 'width', element: 'div[empty]' }),
    );
    expect(() => expectConformance(screen)).toThrow(
      /div\[blank\] {2}data-rk-offgrid=" {3}" gives no reason, and an exception has to say why/,
    );
  },
};

/** "3 exceptions, 2 reasons": declarations are counted by reason, so a page can see its debt. */
export const ByReason: Story = {
  name: 'Exceptions, counted by reason',
  render: () => (
    <Host wide>
      {[2, 3].map((row) => (
        <div
          key={row}
          data-rk-offgrid="an icon font's glyph is wider than a cell"
          style={{ ...onGrid, top: cells(row, 'height'), width: '13px' }}
        />
      ))}
      <div
        data-rk-offgrid="the logo is 37px and the brand team won"
        style={{ ...onGrid, top: cells(4, 'height'), width: '37.5px' }}
      />
    </Host>
  ),
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    const report = expectConformance(screen);
    expect(report.exceptions).toHaveLength(3);
    expect(report.reasons.map(({ reason, count }) => ({ reason, count }))).toEqual([
      { reason: "an icon font's glyph is wider than a cell", count: 2 },
      { reason: 'the logo is 37px and the brand team won', count: 1 },
    ]);
    expect(formatReport(report)).toContain('3 exceptions declared, 2 reasons');
  },
};

/**
 * Each level's rule, passing at that level and failing at the next stricter
 * one (0072): half a cell is allowed inside a control at `standard` and not
 * at `strict`; the rule painter at `standard` and not at `strict`; and
 * anything inside a pane at `loose` but not at `standard`.
 */
function HalfCellControl() {
  return (
    <Host>
      <div data-rk-control="" style={onGrid}>
        <div
          data-testid="label"
          style={{
            marginLeft: cells(0.5),
            width: cells(9),
            height: cells(1, 'height'),
          }}
        >
          half in
        </div>
      </div>
    </Host>
  );
}

export const HalfCellInAControl: Story = {
  name: 'Levels: half a cell inside a control',
  render: () => <HalfCellControl />,
  play: async ({ canvas }) => {
    const { screen, at } = await screenOf(canvas);
    expect(at('standard').violations).toEqual([]);
    expect(at('strict').violations).toEqual([
      expect.objectContaining({ what: 'x', element: 'div[label]', level: 'strict', step: 1 }),
    ]);
    // Half a cell is the step at `standard`, not a licence: a quarter still fails.
    const label = canvas.getByTestId('label');
    label.style.marginLeft = cells(0.25);
    expect(at('standard').violations).toEqual([
      expect.objectContaining({ what: 'x', element: 'div[label]', step: 0.5 }),
    ]);
    label.style.marginLeft = cells(0.5);
    // A control's own box is whole cells at every level.
    const control = label.parentElement as HTMLElement;
    control.style.left = cells(2.5);
    expect(at('standard').violations).toContainEqual(
      expect.objectContaining({ what: 'x', element: 'div', step: 1 }),
    );
    control.style.left = cells(2);
    expect(checkConformance(screen).levels).toEqual(['standard']);
  },
};

export const RulePainter: Story = {
  name: 'Levels: the rule painter',
  render: () => (
    <Host painter="rule">
      <div style={onGrid}>hairlines</div>
    </Host>
  ),
  play: async ({ canvas }) => {
    const { at } = await screenOf(canvas);
    expect(at('standard').violations).toEqual([]);
    const strict = at('strict');
    expect(strict.violations).toEqual([
      expect.objectContaining({ what: 'painter', painter: 'rule', level: 'strict' }),
    ]);
    expect(formatReport(strict)).toContain('painted by the rule painter');
  },
};

function Pane() {
  return (
    <Host>
      <div
        data-rk-pane=""
        data-testid="pane"
        style={{ ...onGrid, left: cells(1), top: cells(1, 'height'), height: cells(3, 'height') }}
      >
        <div data-testid="free" style={{ width: '37.5px', height: '13px', marginLeft: '3px' }}>
          free
        </div>
      </div>
    </Host>
  );
}

export const InsideAPane: Story = {
  name: 'Levels: anything inside a pane',
  render: () => <Pane />,
  // Held to `loose` after the story, too: free inside a pane is the point.
  globals: { conformance: 'loose' },
  play: async ({ canvas }) => {
    const { at } = await screenOf(canvas);
    expect(at('loose').violations).toEqual([]);
    expect(at('standard').violations.map((v) => v.element)).toContain('div[free]');
    // The pane itself still holds the grid at `loose`.
    const pane = canvas.getByTestId('pane');
    pane.style.width = '37.5px';
    expect(at('loose').violations).toEqual([
      expect.objectContaining({ what: 'width', element: 'div[pane]', level: 'loose' }),
    ]);
    pane.style.width = cells(10);
  },
};

/**
 * With no element declaring a level, the theme's `--rk-conformance` token
 * decides, and without that, `standard`. The workbench declares one on its
 * root, so this story lifts it for the length of the check.
 */
export const FromTheTheme: Story = {
  name: 'Levels: from the theme',
  render: () => <Conforming />,
  play: async ({ canvas }) => {
    const { host, screen } = await screenOf(canvas);
    const root = document.documentElement;
    const declared = root.dataset.rkConformance;
    delete root.dataset.rkConformance;
    try {
      // The generated tokens carry the default theme's level.
      expect(getComputedStyle(screen).getPropertyValue('--rk-conformance').trim()).toBe('standard');
      expect(checkConformance(screen).levels).toEqual(['standard']);
      host.style.setProperty('--rk-conformance', 'strict');
      expect(checkConformance(screen).levels).toEqual(['strict']);
      // A declaration beats the token.
      host.dataset.rkConformance = 'loose';
      expect(checkConformance(screen).levels).toEqual(['loose']);
    } finally {
      host.style.removeProperty('--rk-conformance');
      delete host.dataset.rkConformance;
      if (declared !== undefined) root.dataset.rkConformance = declared;
    }
  },
};

/** A typo in the level is reported, not read as the default. */
export const UnknownLevel: Story = {
  name: 'Levels: one that does not exist',
  parameters: { conformance: false },
  render: () => <Conforming />,
  play: async ({ canvas }) => {
    const { at } = await screenOf(canvas);
    const report = at('stirct' as ConformanceLevel);
    expect(report.levels).toEqual(['standard']);
    expect(report.violations).toEqual([
      expect.objectContaining({ what: 'level', declared: 'stirct', level: 'standard' }),
    ]);
  },
};

/**
 * One story pinned at each level, so the check after every story runs at all
 * three. `standard` is the workbench's default and the level every other story
 * is held to.
 */
export const Strict: Story = {
  name: 'Pinned: strict',
  globals: { conformance: 'strict' },
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    expect(expectConformance(screen).levels).toEqual(['strict']);
  },
};

export const Standard: Story = {
  name: 'Pinned: standard',
  globals: { conformance: 'standard' },
  render: () => <HalfCellControl />,
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    expect(expectConformance(screen).levels).toEqual(['standard']);
  },
};

export const Loose: Story = {
  name: 'Pinned: loose',
  globals: { conformance: 'loose' },
  render: () => <Pane />,
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    expect(expectConformance(screen).levels).toEqual(['loose']);
  },
};

/**
 * Real components, held to each level (0182). A control marks itself
 * `data-rk-control` and a pane `data-rk-pane`, so the levels' rules reach the
 * components themselves and not only the test boxes above: a button's label
 * may sit half a cell in at `standard`, and a list holds whole cells at
 * `loose`. These stories are also what the metadata reads a component's level
 * from (0167): a component in the passing `strict` one has been held to it.
 */
function RealPage({ nudge = false }: { nudge?: boolean }) {
  return (
    <div data-testid="host">
      <Frame title="settings" cols={36} rows={10} className={nudge ? 'rk-real-nudge' : undefined}>
        <div>
          <Button>Save</Button>
        </div>
        <div>
          <Checkbox>Sign commits</Checkbox>
        </div>
        <div>
          <Badge tone="success">passing</Badge>
        </div>
        <div style={{ inlineSize: cells(20) }}>
          <List aria-label="Files" rows={3}>
            <ListItem id="a">a.ts</ListItem>
            <ListItem id="b">b.ts</ListItem>
          </List>
        </div>
      </Frame>
      {nudge ? (
        // Half a cell in, without changing any box's size. After the frame, which `screenOf` finds first.
        <style>
          {
            '.rk-real-nudge .rk-button-label { position: relative; left: calc(var(--rk-cell-width) / 2); }'
          }
        </style>
      ) : null}
    </div>
  );
}

export const RealStrict: Story = {
  name: 'Real components: strict',
  globals: { conformance: 'strict' },
  render: () => <RealPage />,
  play: async ({ canvas }) => {
    const { screen } = await screenOf(canvas);
    expect(expectConformance(screen).levels).toEqual(['strict']);
    // Each carries the mark the levels read.
    expect(screen.matches('[data-rk-pane]')).toBe(true);
    expect(canvas.getByRole('button', { name: 'Save' }).matches('[data-rk-control]')).toBe(true);
    expect(screen.querySelector('.rk-checkbox-row')?.matches('[data-rk-control]')).toBe(true);
    expect(screen.querySelector('.rk-list')?.matches('[data-rk-pane]')).toBe(true);
    expect(screen.querySelector('.rk-badge')?.matches('[data-rk-control], [data-rk-pane]')).toBe(
      false,
    );
  },
};

export const RealStandard: Story = {
  name: 'Real components: standard',
  globals: { conformance: 'standard' },
  render: () => <RealPage nudge />,
  play: async ({ canvas }) => {
    const { screen, at } = await screenOf(canvas);
    // Half a cell in is allowed inside a button, which is a control...
    expect(expectConformance(screen).levels).toEqual(['standard']);
    expect(at('strict').violations).toContainEqual(
      expect.objectContaining({ what: 'x', element: 'span.rk-button-label', step: 1 }),
    );
    // ...and not inside a badge, which is not.
    const mark = screen.querySelector<HTMLElement>('.rk-badge-mark') as HTMLElement;
    mark.style.position = 'relative';
    mark.style.left = cells(0.5);
    try {
      expect(at('standard').violations).toContainEqual(
        expect.objectContaining({ what: 'x', element: 'span.rk-badge-mark', step: 1 }),
      );
    } finally {
      mark.style.removeProperty('position');
      mark.style.removeProperty('left');
    }
  },
};

export const RealLoose: Story = {
  name: 'Real components: loose',
  globals: { conformance: 'loose' },
  render: () => <RealPage />,
  play: async ({ canvas }) => {
    const { screen, at } = await screenOf(canvas);
    expect(expectConformance(screen).levels).toEqual(['loose']);
    // Inside a pane is the app's business at `loose`: a box of any size passes.
    const free = document.createElement('div');
    free.style.width = '37.5px';
    free.style.height = '13px';
    screen.querySelector('.rk-content')?.append(free);
    try {
      expect(at('loose').violations).toEqual([]);
      expect(at('standard').violations.length).toBeGreaterThan(0);
    } finally {
      free.remove();
    }
    // A pane is still whole cells: the list's own box, off the grid, fails.
    const list = screen.querySelector<HTMLElement>('.rk-list') as HTMLElement;
    list.style.width = `calc(${cells(20)} + 3px)`;
    try {
      expect(at('loose').violations).toContainEqual(
        expect.objectContaining({ what: 'width', element: 'div.rk-list', level: 'loose' }),
      );
    } finally {
      list.style.removeProperty('width');
    }
  },
};

/**
 * Inside a visually hidden box is hidden too: a checkbox or a radio keeps its
 * native input in a clipped span, a box of its own size inside a box of none.
 */
export const InsideVisuallyHidden: Story = {
  name: 'Inside a visually hidden box',
  render: () => (
    <div data-testid="host">
      <Screen draw={draw} cols={24} rows={6}>
        <span
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
          }}
        >
          <input type="checkbox" aria-label="hidden" style={{ width: '13px', height: '13px' }} />
        </span>
      </Screen>
    </div>
  ),
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('host').firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());
    expect(checkConformance(screen).violations).toEqual([]);
  },
};

/**
 * An overlay is a screen of its own, so the check measures its boxes from its
 * own corner, and that corner is on someone else's grid: the one it was moved
 * onto, of the screen its trigger is in (cairn 0128). The surface says which
 * that is, and the check holds its corner there: placed, it passes; half a
 * cell off across or down, it fails, naming the axis and the screen.
 */
export const AnchoredOverlay: Story = {
  name: "An overlay on its anchor's grid",
  render: () => (
    <Frame title="page" cols={40} rows={10}>
      <DialogTrigger defaultOpen>
        <Button>Branches</Button>
        <OverlayPopover>
          <Dialog aria-label="Branches">
            <p style={{ margin: 0 }}>main</p>
          </Dialog>
        </OverlayPopover>
      </DialogTrigger>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await measured(document.body);
    const surface = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('.rk-overlay');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const anchors = (report: ConformanceReport) =>
      report.violations.filter((v) => v.what === 'anchor');

    // Placed, it is on the grid of the frame it was opened from.
    await waitFor(() => expect(anchors(checkConformance(canvasElement))).toEqual([]));

    // Moved half a cell either way, it is not, and the check says where from.
    const page = canvasElement.querySelector<HTMLElement>('.rk-frame-box') as HTMLElement;
    const style = getComputedStyle(page);
    const half = {
      x: Number.parseFloat(style.getPropertyValue('--rk-cell-width')) / 2,
      y: Number.parseFloat(style.getPropertyValue('--rk-cell-height')) / 2,
    };
    const was = { left: surface.style.left, top: surface.style.top };
    try {
      for (const axis of ['x', 'y'] as const) {
        const side = axis === 'x' ? 'left' : 'top';
        surface.style[side] = `${(Number.parseFloat(was[side]) || 0) + half[axis]}px`;
        const report = checkConformance(canvasElement);
        expect(anchors(report)).toEqual([
          expect.objectContaining({ what: 'anchor', axis, anchor: 'div.rk-screen.rk-frame-box' }),
        ]);
        expect(formatReport(report)).toContain('which it was opened from');
        surface.style[side] = was[side];
      }
    } finally {
      surface.style.left = was.left;
      surface.style.top = was.top;
    }
    await waitFor(() => expect(anchors(checkConformance(canvasElement))).toEqual([]));
  },
};
