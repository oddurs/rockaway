import { checkTargets } from '@rockaway/react/testing';
import { densities, modes } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import { cellsOf, type Plan, readsPixels, skipFor, walk } from '../../.storybook/matrix.ts';

/**
 * A screen that claims a 10 × 24px cell, holding a box one line box tall. At
 * `normal` the line box is 24px and the two agree; at every other density the
 * box moves with the line box and the screen does not, so it is off the grid
 * there and nowhere else.
 */
const cell = { '--rk-cell-width': '10px', '--rk-cell-height': '24px' } as CSSProperties;

function OnlyAtNormal() {
  return (
    <div className="rk-screen" data-testid="screen" style={cell}>
      <div style={{ inlineSize: '100px', blockSize: '1lh' }}>one line box</div>
    </div>
  );
}

const meta = {
  title: 'Grid/Matrix',
  component: OnlyAtNormal,
  parameters: {
    // Off the grid on purpose everywhere but `normal`, to show the walk naming
    // the cells it failed in; the walk after the story is told so, out loud.
    matrix: {
      skip: (['dense', 'airy', 'touch'] as const).map((density) => ({
        density,
        reason: 'this story is off the grid here on purpose, to show the failure naming its cell',
      })),
    },
  },
} satisfies Meta<typeof OnlyAtNormal>;

export default meta;
type Story = StoryObj<typeof meta>;

const everyDensity: Plan = { densities, modes: [], continuity: 'own', axe: false };

/** A failure says where: the density and mode it failed at, every one of them. */
export const NamesTheCell: Story = {
  name: 'A failure names its cell',
  play: async ({ canvasElement }) => {
    const walked = walk(
      'grid-matrix--names-the-cell',
      canvasElement,
      {},
      {
        plan: everyDensity,
        axe: async () => {},
      },
    );
    await expect(walked).rejects.toThrow(/the matrix failed in 3 cell\(s\)/);
    const message = await walked.catch((error: Error) => error.message);
    for (const density of ['dense', 'airy', 'touch']) {
      expect(message).toContain(`at ${density}, light:`);
    }
    expect(message).not.toContain('at normal');
    // The walk puts the root back the way it found it.
    expect(document.documentElement.getAttribute('data-density')).toBe('normal');
  },
};

/** Leaving a cell needs a reason, as an exception to the grid does. */
export const SkipNeedsAReason: Story = {
  name: 'Leaving a cell needs a reason',
  play: async () => {
    const cell = { density: 'touch', mode: 'dark' } as const;
    expect(() => skipFor(cell, [{ density: 'touch', reason: '  ' }])).toThrow(/gives no reason/);
    expect(skipFor(cell, [{ density: 'touch', reason: 'why' }])?.reason).toBe('why');
    expect(skipFor(cell, [{ mode: 'light', reason: 'why' }])).toBeUndefined();
  },
};

/** The story's own cell first, then the rest; pixels read across, not in all eight. */
export const Plans: Story = {
  name: 'What a plan walks',
  play: async () => {
    const own = { density: 'airy', mode: 'dark' } as const;
    const plan: Plan = { densities, modes, continuity: 'across', axe: true };
    const cells = cellsOf(plan, own);
    expect(cells).toHaveLength(8);
    expect(cells[0]).toBe(own);
    expect(cells.filter((cell) => readsPixels(plan, own, cell))).toHaveLength(5);
    expect(cellsOf({ ...plan, densities: [] }, own)).toHaveLength(2);
    expect(cellsOf({ ...plan, densities: [], modes: [] }, own)).toEqual([own]);
  },
};

const box = (height: number, extra: CSSProperties = {}): CSSProperties => ({
  display: 'block',
  inlineSize: '40px',
  blockSize: `${height}px`,
  ...extra,
});

/**
 * WCAG 2.5.8, as the check reads it: 24px, or room for a 24px circle; a link
 * in a sentence is exempt; and the touch height is asked for separately.
 */
export const Targets: Story = {
  name: 'Target size',
  // Two crowded buttons, too small on purpose; the play function is the check.
  parameters: { targets: false },
  render: () => (
    <div style={{ display: 'grid', gap: '40px' }}>
      <div data-testid="spaced">
        <button type="button" style={box(16)}>
          small, with room
        </button>
      </div>
      <div data-testid="crowded">
        <button type="button" style={box(16)}>
          one
        </button>
        <button type="button" style={box(16)}>
          two
        </button>
      </div>
      <p data-testid="sentence">
        A link <a href="#in-a-sentence">in a sentence</a> takes its height from the line.
      </p>
      <div data-testid="big">
        <button type="button" style={box(32)}>
          big
        </button>
      </div>
      {/* React Aria's checkbox: the native input sits in a clipped wrapper,
          and the label around it is what a pointer meets. */}
      <div data-testid="visually-hidden">
        <label style={{ display: 'block', blockSize: '44px' }}>
          <span
            style={{
              position: 'absolute',
              inlineSize: '1px',
              blockSize: '1px',
              overflow: 'hidden',
              clipPath: 'inset(50%)',
            }}
          >
            <input type="checkbox" />
          </span>
          a checkbox drawn in cells
        </label>
      </div>
      {/* The same hidden input with no label around it: nothing to press. */}
      <div data-testid="unlabelled">
        <span
          style={{
            position: 'absolute',
            inlineSize: '1px',
            blockSize: '1px',
            overflow: 'hidden',
            clipPath: 'inset(50%)',
          }}
        >
          <input type="checkbox" aria-label="nothing to press" />
        </span>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    expect(checkTargets(canvas.getByTestId('spaced')).failures).toEqual([]);
    const crowded = checkTargets(canvas.getByTestId('crowded')).failures;
    expect(crowded.map((f) => f.rule)).toEqual(['size', 'size']);
    expect(crowded[0]?.crowdedBy).toContain('two');
    expect(checkTargets(canvas.getByTestId('sentence'))).toEqual({ targets: 0, failures: [] });
    const big = canvas.getByTestId('big');
    expect(checkTargets(big).failures).toEqual([]);
    expect(checkTargets(big, { minHeight: 44 }).failures).toEqual([
      expect.objectContaining({ rule: 'height', height: 32 }),
    ]);
    // A visually hidden input is measured by the label around it, which is
    // what a pointer meets: here 44px tall, so it passes even at minHeight 44.
    const hidden = checkTargets(canvas.getByTestId('visually-hidden'), { minHeight: 44 });
    expect(hidden).toEqual({ targets: 1, failures: [] });
    // With no label, it is no target at all, however big its box claims to be.
    expect(checkTargets(canvas.getByTestId('unlabelled'), { minHeight: 44 })).toEqual({
      targets: 0,
      failures: [],
    });
  },
};
