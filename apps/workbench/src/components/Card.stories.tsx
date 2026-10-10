import { type Comfort, toText } from '@rockaway/grid';
import { Card, cardText } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 36;
const BLOCKS = ['Twelve today, all green.', 'The last one went out at 14:02.'];
const COMFORTS: readonly Comfort[] = ['compact', 'comfortable', 'spacious'];

/**
 * A column `cols` cells wide, as a page would give a card. A pixel more than
 * `cols` in `1ch`: the screen measures its cell from the font, which can be a
 * hair wider than `1ch`, and a hair short of `cols` cells is `cols - 1`.
 */
function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      style={{
        inlineSize: `calc(var(--rk-cell-width) * ${COLS} + 1px)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rk-y-1)',
      }}
    >
      {children}
    </div>
  );
}

function Comforts(): ReactNode {
  return (
    <Column>
      {COMFORTS.map((comfort) => (
        <Card key={comfort} title="Deploys" comfort={comfort} label={comfort}>
          {BLOCKS.map((block) => (
            <p key={block} style={{ margin: 0 }}>
              {block}
            </p>
          ))}
        </Card>
      ))}
    </Column>
  );
}

/** A card read back off the page, row by row. */
const read = (el: HTMLElement): string => screenshot(el, { legend: false });

/** The rows a box spans, in the cell of the screen it is. */
function rowsOf(el: HTMLElement): number {
  const cell = Number.parseFloat(getComputedStyle(el).lineHeight);
  return el.getBoundingClientRect().height / cell;
}

/**
 * Each comfort, read back off the page and held to the text model cell for
 * cell, at every density the matrix walks. The padding and the gap are rhythm,
 * on half-steps inside the card; the card itself is whole rows, so it passes
 * at `standard`, the level for app UI (0311).
 */
export const Comforts_: Story = {
  name: 'Every comfort',
  render: () => <Comforts />,
  play: async ({ canvas }) => {
    await settled();
    for (const comfort of COMFORTS) {
      const card = canvas.getByRole('group', { name: comfort });
      const want = cardText(BLOCKS, { cols: COLS, title: 'Deploys', comfort });
      await waitFor(() => expect(read(card), comfort).toBe(toText(want)));
      const rows = rowsOf(card);
      expect(Math.abs(rows - Math.round(rows)), `${comfort}: ${rows} rows`).toBeLessThan(1 / 32);
      expect(Math.round(rows)).toBe(want.height);
    }
  },
};

/**
 * A row of cards on a dashboard: each as tall as its content, each whole
 * rows, so the rows of cards line up on the grid however their insides are
 * spaced.
 */
export const Dashboard: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)', alignItems: 'start' }}>
      {[
        ['Deploys', ['Twelve today.']],
        ['Errors', ['None in the last hour.', 'Three yesterday.']],
        ['Latency', ['p50 42 ms', 'p95 180 ms', 'p99 410 ms']],
      ].map(([title, lines]) => (
        <div key={title as string} style={{ inlineSize: 'calc(var(--rk-cell-width) * 24 + 1px)' }}>
          <Card title={title as string}>
            {(lines as string[]).map((line) => (
              <p key={line} style={{ margin: 0 }}>
                {line}
              </p>
            ))}
          </Card>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('.rk-card')];
    expect(cards).toHaveLength(3);
    await waitFor(() => {
      for (const card of cards) {
        const rows = rowsOf(card);
        expect(Math.abs(rows - Math.round(rows)), `${rows} rows`).toBeLessThan(1 / 32);
        expect(read(card).split('\n').at(-1)).toMatch(/^└─+┘$/);
      }
    });
  },
};
