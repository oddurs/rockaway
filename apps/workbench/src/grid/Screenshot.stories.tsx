import { Buffer, contentArea, drawBox, drawText, rect, type Size } from '@rockaway/grid';
import { Screen, screenshot } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

function draw({ width, height }: Size): Buffer {
  const area = rect(0, 0, width, height);
  return Buffer.create({ width, height }).draw((d) => {
    if (width < 4 || height < 3) return;
    drawBox(d, area, { title: 'publish' });
    drawText(d, { x: contentArea(area, 1).x, y: 2 }, 'release 0.4.0', { maxWidth: width - 4 });
  });
}

/** A screen with real elements over the painted chrome. */
function Composed() {
  return (
    <div data-testid="host">
      <Screen draw={draw} cols={30} rows={6}>
        <button
          type="button"
          data-attrs="reverse"
          style={{
            position: 'absolute',
            left: 'calc(var(--rk-cell-width) * 2)',
            top: 'calc(var(--rk-cell-height) * 4)',
            height: 'var(--rk-cell-height)',
            padding: 0,
            border: 'none',
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          [ publish ]
        </button>
      </Screen>
    </div>
  );
}

const meta = { title: 'Grid/Screenshot', component: Composed } satisfies Meta<typeof Composed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadsTheScreenBack: Story = {
  name: 'Reads the screen back as text',
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const screen = host.firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());

    const shot = screenshot(screen, { legend: false });
    const lines = shot.split('\n');

    // The chrome the engine drew.
    expect(lines[0]).toBe('┌ publish ───────────────────┐');
    expect(lines[5]).toBe('└────────────────────────────┘');
    expect(lines[2]).toContain('release 0.4.0');

    // And the real button, in the cell it actually occupies.
    expect(lines[4]).toContain('[ publish ]');
    expect((lines[4] as string).indexOf('[')).toBe(2);

    // Every row is the width of the screen, so a diff lines up.
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(30);
  },
};

export const ListsAttributes: Story = {
  name: 'Lists the attributes it saw',
  play: async ({ canvas }) => {
    const host = canvas.getByTestId('host');
    const screen = host.firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());

    const shot = screenshot(screen);
    expect(shot).toContain('— attributes —');
    expect(shot).toMatch(/reverse\s+2,4\s+\[ publish \]/);
  },
};

export const WorksOnABufferToo: Story = {
  name: 'Works on a buffer, with no DOM at all',
  play: async () => {
    const shot = screenshot(draw({ width: 20, height: 4 }));
    expect(shot.split('\n')[0]).toBe('┌ publish ─────────┐');
    expect(shot.split('\n')).toHaveLength(4);
  },
};
