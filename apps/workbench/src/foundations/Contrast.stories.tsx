import { Badge, Button, Frame, List, ListItem } from '@rockaway/react';
import { checkConformance } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';

/**
 * Increased contrast (cairn 0065): `prefers-contrast: more`, or
 * `data-rk-contrast="more"` on any element, answered the way a terminal would.
 * The same palette, read differently: muted text is the foreground, colour
 * takes the bright slot, a fill is reverse video, lines are heavier, the focus
 * ring is thicker, and disabled is struck through as well as dimmed. Nothing
 * moves a cell.
 */
function Sample({ name }: { name: string }) {
  return (
    <Frame title={name} cols={34} rows={8}>
      <p style={{ margin: 0, color: 'var(--rk-fg-muted)' }} data-testid="muted">
        2 files changed
      </p>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 30)' }}>
        <List aria-label={`${name} files`} rows={2} disabledKeys={['b']}>
          <ListItem id="a">src/index.ts</ListItem>
          <ListItem id="b">src/locked.ts</ListItem>
        </List>
      </div>
      <div style={{ display: 'flex', gap: 'var(--rk-x-1)' }}>
        <Button variant="fill">Commit</Button>
        <Button isDisabled>Merge</Button>
        <Badge tone="danger">failing</Badge>
      </div>
    </Frame>
  );
}

function Island({ contrast }: { contrast?: 'more' | 'standard' }) {
  const name = contrast ?? 'from the system';
  return (
    <section
      aria-label={name}
      {...(contrast === undefined ? {} : { 'data-rk-contrast': contrast })}
      style={{
        background: 'var(--rk-bg-page)',
        color: 'var(--rk-fg-default)',
        padding: 'var(--rk-y-1) var(--rk-x-2)',
      }}
    >
      <Sample name={name} />
    </section>
  );
}

function Both() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)' }}>
      <Island contrast="standard" />
      <Island contrast="more" />
    </div>
  );
}

const meta = {
  title: 'Foundations/Contrast',
  component: Both,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Both>;

export default meta;
type Story = StoryObj<typeof meta>;

const style = (el: Element) => getComputedStyle(el);
const token = (el: Element, name: string) => style(el).getPropertyValue(name).trim();

/** What a reader who asked for more contrast gets, against what everyone else does. */
function reading(island: HTMLElement) {
  const muted = island.querySelector('[data-testid="muted"]') as HTMLElement;
  const disabled = [...island.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Merge'),
  );
  const screen = island.querySelector('.rk-screen') as HTMLElement;
  return {
    mutedIsDefault: style(muted).color === style(island).color,
    stroke: token(screen, '--rk-stroke-glyph-light'),
    focus: token(island, '--rk-focus-width'),
    struck: style(disabled as HTMLElement).textDecorationLine.includes('line-through'),
    box: screen.getBoundingClientRect(),
    cells: `${screen.dataset.rkCols}×${screen.dataset.rkRows}`,
  };
}

/** `data-rk-contrast` on an element, beside one that keeps the standard reading. */
export const OnAnElement: Story = {
  name: 'On an element',
  play: async ({ canvas }) => {
    const standard = reading(canvas.getByRole('region', { name: 'standard' }));
    const more = reading(canvas.getByRole('region', { name: 'more' }));

    expect(standard).toMatchObject({
      mutedIsDefault: false,
      stroke: '0.08',
      focus: '2px',
      struck: false,
    });
    expect(more).toMatchObject({
      mutedIsDefault: true,
      stroke: '0.12',
      focus: '3px',
      struck: true,
    });

    // Nothing moves a cell: the same frame, the same size, on the grid in both.
    expect(more.cells).toBe(standard.cells);
    expect(more.box.width).toBe(standard.box.width);
    expect(more.box.height).toBe(standard.box.height);
    for (const name of ['standard', 'more']) {
      expect(checkConformance(canvas.getByRole('region', { name })).violations, name).toEqual([]);
    }
  },
};

/**
 * `prefers-contrast: more` from the reader's system applies it to a page that
 * has not chosen, and `data-rk-contrast="standard"` keeps an element out.
 */
export const FromTheSystem: Story = {
  name: 'From the system',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)' }}>
      <Island />
      <Island contrast="standard" />
    </div>
  ),
  play: async ({ canvas }) => {
    const run = runner();
    if (!run) return;
    const system = () => reading(canvas.getByRole('region', { name: 'from the system' }));
    const kept = () => reading(canvas.getByRole('region', { name: 'standard' }));
    expect(system().mutedIsDefault).toBe(false);

    await run.contrast('more');
    try {
      await waitFor(() => expect(matchMedia('(prefers-contrast: more)').matches).toBe(true));
      expect(system()).toMatchObject({ mutedIsDefault: true, stroke: '0.12', struck: true });
      expect(kept()).toMatchObject({ mutedIsDefault: false, stroke: '0.08', struck: false });
    } finally {
      await run.contrast('no-preference');
    }
    expect(system().mutedIsDefault).toBe(false);
  },
};
