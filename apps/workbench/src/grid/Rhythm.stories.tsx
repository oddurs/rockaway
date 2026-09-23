import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

/**
 * The grid rhythm (cairn 0093): counts become lengths, density is the line
 * box, and state reads as an attribute rather than a new colour.
 */
function Rhythm() {
  return (
    <div style={{ padding: 'var(--rk-y-1) var(--rk-x-2)' }}>
      <div data-testid="two" style={{ inlineSize: 'var(--rk-x-2)', blockSize: 'var(--rk-y-2)' }} />
      <p data-testid="prose">Space is counted in cells.</p>
      <button type="button" data-testid="fill" data-rk-fill="">
        [ publish ]
      </button>
      <span data-testid="dim" data-attrs="dim">
        dim
      </span>
      <span data-testid="reverse" data-attrs="reverse">
        reverse
      </span>
      <div className="rk-container" data-testid="container" style={{ inlineSize: '40ch' }}>
        <div data-testid="inside">forty cells</div>
      </div>
    </div>
  );
}

const meta = { title: 'Grid/Rhythm', component: Rhythm } satisfies Meta<typeof Rhythm>;

export default meta;
type Story = StoryObj<typeof meta>;

const px = (value: string): number => Number.parseFloat(value);

export const CountsBecomeLengths: Story = {
  name: 'Counts become lengths',
  play: async ({ canvas }) => {
    const box = canvas.getByTestId('two');
    const root = getComputedStyle(document.documentElement);

    // A count multiplied by the cell, and the cell comes from the font.
    const cellWidth = px(getComputedStyle(box).inlineSize) / 2;
    const cellHeight = px(getComputedStyle(box).blockSize) / 2;
    expect(cellWidth).toBeGreaterThan(4);
    expect(cellHeight).toBeGreaterThan(8);
    expect(root.getPropertyValue('--rk-space-2').trim()).toBe('2');

    // The line box is the density, and one row is one line box.
    const line = px(getComputedStyle(canvas.getByTestId('prose')).lineHeight);
    expect(Math.abs(line - cellHeight)).toBeLessThan(0.5);
  },
};

export const StateIsAnAttribute: Story = {
  name: 'State is an attribute',
  play: async ({ canvas }) => {
    const dim = getComputedStyle(canvas.getByTestId('dim'));
    const reverse = getComputedStyle(canvas.getByTestId('reverse'));
    const body = getComputedStyle(document.body);

    // Dim is a colour, not an opacity: it survives a screenshot and a printer.
    expect(dim.opacity).toBe('1');
    expect(dim.color).not.toBe(body.color);

    // Reverse swaps ground and figure, the way a terminal does.
    expect(reverse.backgroundColor).toBe(body.color);
    expect(reverse.color).toBe(body.backgroundColor);
  },
};

export const FilledControlsTakeReverseFocus: Story = {
  name: 'A filled control takes reverse focus',
  play: async ({ canvas, userEvent }) => {
    const fill = canvas.getByTestId('fill');
    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(fill));

    const focused = getComputedStyle(fill);
    expect(focused.outlineStyle).toBe('solid');
    expect(focused.backgroundColor).toBe(getComputedStyle(document.body).color);
  },
};
