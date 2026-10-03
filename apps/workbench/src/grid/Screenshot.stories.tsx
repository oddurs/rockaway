import { Buffer, contentArea, drawBox, drawText, rect, type Size } from '@rockaway/grid';
import { Fieldset, Frame, List, ListItem, Screen } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
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

const months = ['jan', 'february, the short one', 'mar', 'apr', 'may', 'jun', 'jul', 'aug'];

/**
 * Eight rows in a three-row list. The other five are in the DOM, above or below
 * the list's box, and a reader cannot see them, so neither does the screenshot
 * (cairn 0160). A label too long for its row is cut where the row cuts it.
 */
export const ClipsToTheScrollContainer: Story = {
  name: 'Shows only what a scroll container shows',
  render: () => (
    <Frame title="months" cols={20} rows={5}>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 16)' }}>
        <List aria-label="Months" rows={3} total={months.length}>
          {months.map((month) => (
            <ListItem key={month} id={month}>
              {month}
            </ListItem>
          ))}
        </List>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'months' });
    const scrollbar = (): string => frame.querySelector('.rk-list-scrollbar')?.textContent ?? '';
    await waitFor(() => expect(scrollbar()).toBe('█░░'));

    expect(screenshot(frame, { legend: false })).toBe(
      [
        '┌ months ──────────┐',
        '│  jan           █ │',
        '│  february, the ░ │',
        '│  mar           ░ │',
        '└──────────────────┘',
      ].join('\n'),
    );

    // Scroll by whole rows, the way the list itself does.
    const box = frame.querySelector('.rk-list-box') as HTMLElement;
    const row = (frame.querySelector('.rk-list-item') as HTMLElement).offsetHeight;
    box.scrollTop = row * 3;
    await waitFor(() => expect(scrollbar()).toBe('░█░'));

    expect(screenshot(frame, { legend: false })).toBe(
      [
        '┌ months ──────────┐',
        '│  apr           ░ │',
        '│  may           █ │',
        '│  jun           ░ │',
        '└──────────────────┘',
      ].join('\n'),
    );
  },
};

/**
 * A screen inside a screen — a fieldset in a frame — paints chrome of its own,
 * and it is read back where it sits, over the outer chrome, not stacked under
 * it from the first column.
 */
export const NestedScreens: Story = {
  name: 'Reads a screen inside a screen',
  render: () => (
    <Frame title="outer" cols={24} rows={6}>
      <Fieldset legend="inner">
        <span>body</span>
      </Fieldset>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const outer = canvas.getByRole('group', { name: 'outer' });
    // The inner screen measures itself after the outer one has, so wait for it.
    await waitFor(() =>
      expect(`\n${screenshot(outer, { legend: false })}`).toBe(`
┌ outer ───────────────┐
│ ┌ inner ───────────┐ │
│ │ body             │ │
│ └──────────────────┘ │
│                      │
└──────────────────────┘`),
    );
  },
};
