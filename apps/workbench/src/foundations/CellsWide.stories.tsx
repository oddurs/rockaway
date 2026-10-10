import { useCellsWide } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useRef, useState } from 'react';
import { expect, waitFor } from 'storybook/test';

/*
 * `useCellsWide` (cairn 0279): the count of whole cells an element is wide,
 * kept current as it resizes. The box is sized in cells, so the count is exact
 * at every density, and a button narrows it to see the count follow.
 */
const meta = { title: 'Foundations/Cells wide' } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Readout(): ReactNode {
  const box = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(40);
  const cells = useCellsWide(box);
  return (
    <div style={{ fontFamily: 'var(--rk-font-family-mono)' }}>
      <button type="button" onClick={() => setCols(24)}>
        Narrow
      </button>
      <div ref={box} style={{ inlineSize: `${cols}ch` }}>
        <output data-testid="cells">{cells}</output>
      </div>
    </div>
  );
}

export const Counts: Story = {
  render: () => <Readout />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByTestId('cells').textContent).toBe('40'));
    canvas.getByRole('button', { name: 'Narrow' }).click();
    await waitFor(() => expect(canvas.getByTestId('cells').textContent).toBe('24'));
  },
};
