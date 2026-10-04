import { toText } from '@rockaway/grid';
import { type PainterName, Tab, TabList, TabPanel, Tabs, tabsText } from '@rockaway/react';
import { expectContinuity, screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const DENSITIES = ['dense', 'normal', 'airy', 'touch'] as const;
const LABELS = ['files', 'log', 'diff'];
const MANY = ['files', 'log', 'diff', 'blame', 'stash', 'remotes', 'tags'];

/** A repository's views, one at a time, in one frame. */
function Views({
  labels = LABELS,
  cols = 36,
  rows = 5,
  painter,
  disabled,
  name = 'View',
  manual,
}: {
  readonly labels?: readonly string[];
  readonly cols?: number;
  readonly rows?: number;
  readonly painter?: PainterName;
  readonly disabled?: readonly string[];
  readonly name?: string;
  readonly manual?: boolean;
}) {
  return (
    <Tabs
      cols={cols}
      rows={rows}
      {...(painter === undefined ? {} : { painter })}
      {...(disabled === undefined ? {} : { disabledKeys: disabled })}
      {...(manual ? { keyboardActivation: 'manual' as const } : {})}
    >
      <TabList aria-label={name}>
        {labels.map((label) => (
          <Tab key={label} id={label}>
            {label}
          </Tab>
        ))}
      </TabList>
      {labels.map((label) => (
        <TabPanel key={label} id={label}>
          <p style={{ margin: 0 }}>the {label} view</p>
        </TabPanel>
      ))}
    </Tabs>
  );
}

const screenOf = (tablist: HTMLElement): HTMLElement =>
  tablist.closest('.rk-screen') as HTMLElement;

/**
 * The tab list sits in the panel frame's top edge, a cell of line between two
 * tabs; the selected tab is reverse video and bold, and its panel fills the
 * frame. The page reads back as the layout's text.
 */
export const Default: Story = {
  render: () => <Views />,
  play: async ({ canvas }) => {
    await settled();
    const tablist = canvas.getByRole('tablist', { name: 'View' });
    const screen = screenOf(tablist);
    await waitFor(() =>
      expect(screenshot(screen, { legend: false }).split('\n')[0]).toBe(
        toText(tabsText({ width: 36, height: 5 }, LABELS, 0)).split('\n')[0],
      ),
    );
    const files = canvas.getByRole('tab', { name: 'files' });
    expect(files.getAttribute('aria-selected')).toBe('true');
    expect(Number(getComputedStyle(files).fontWeight)).toBeGreaterThanOrEqual(700);
    // Reverse video: the tab's own pair swapped, the text's colour as its ground.
    const log = canvas.getByRole('tab', { name: 'log' });
    const ink = getComputedStyle(canvas.getByRole('tabpanel')).color;
    expect(getComputedStyle(files).backgroundColor).toBe(ink);
    expect(getComputedStyle(files).color).not.toBe(getComputedStyle(log).color);
    expect(canvas.getByRole('tabpanel').textContent).toBe('the files view');
  },
};

/**
 * From the keyboard: Tab reaches the selected tab, the arrows move and select,
 * Home and End jump, and Tab again leaves for the panel. All React Aria's.
 */
export const Keyboard: Story = {
  render: () => <Views />,
  play: async ({ canvas }) => {
    await settled();
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('tab', { name: 'files' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(canvas.getByRole('tab', { name: 'log' }));
    expect(canvas.getByRole('tab', { name: 'log' }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(canvas.getByRole('tab', { name: 'diff' }));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(canvas.getByRole('tab', { name: 'files' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(canvas.getByRole('tabpanel'));
  },
};

/**
 * Too many tabs for the edge: they scroll by whole tabs, with the overflow
 * marks at the ends, and moving to a tab out of view brings it in. The
 * selected tab is always shown.
 */
export const Overflow: Story = {
  render: () => <Views labels={MANY} cols={28} />,
  play: async ({ canvas }) => {
    await settled();
    const tablist = canvas.getByRole('tablist', { name: 'View' });
    const screen = screenOf(tablist);
    const top = () => screenshot(screen, { legend: false }).split('\n')[0];
    const expected = (i: number) =>
      toText(tabsText({ width: 28, height: 5 }, MANY, i)).split('\n')[0];
    await waitFor(() => expect(top()).toBe(expected(0)));
    // Every tab is in the tab list, out of view or not: a reader hears them all.
    expect(canvas.getAllByRole('tab')).toHaveLength(MANY.length);
    await userEvent.click(canvas.getByRole('tab', { name: 'files' }));
    for (let i = 1; i < MANY.length; i++) {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(top(), MANY[i]).toBe(expected(i)));
      const tab = canvas.getByRole('tab', { name: MANY[i] as string });
      expect(document.activeElement).toBe(tab);
      expect(tab.getBoundingClientRect().width).toBeGreaterThan(0);
    }
  },
};

/** Hovering underlines the label; a disabled tab is dim and cannot be chosen. */
export const States: Story = {
  render: () => <Views disabled={['diff']} />,
  play: async ({ canvas }) => {
    await settled();
    const log = canvas.getByRole('tab', { name: 'log' });
    await userEvent.hover(log);
    await waitFor(() => expect(log.dataset.hovered).toBe('true'));
    const label = log.querySelector('.rk-tab-label') as HTMLElement;
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
    await userEvent.unhover(log);
    const diff = canvas.getByRole('tab', { name: 'diff' });
    expect(diff.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(diff);
    expect(diff.getAttribute('aria-selected')).toBe('false');
  },
};

/** Manual activation: the arrows move focus, and Enter selects. */
export const Manual: Story = {
  render: () => <Views manual />,
  play: async ({ canvas }) => {
    await settled();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    const log = canvas.getByRole('tab', { name: 'log' });
    expect(document.activeElement).toBe(log);
    expect(log.getAttribute('aria-selected')).toBe('false');
    await userEvent.keyboard('{Enter}');
    expect(log.getAttribute('aria-selected')).toBe('true');
  },
};

/**
 * Manual activation with too many tabs for the edge (0216): the arrows move
 * focus without selecting, and the focused tab is brought into view, not the
 * selected one, so the ring is never on a tab that is not there. When focus
 * leaves the list, the window goes back to the selected tab.
 */
export const ManualOverflow: Story = {
  name: 'Manual, overflowing',
  render: () => <Views labels={MANY} cols={28} manual />,
  play: async ({ canvas }) => {
    await settled();
    const screen = screenOf(canvas.getByRole('tablist', { name: 'View' }));
    const top = () => screenshot(screen, { legend: false }).split('\n')[0];
    const expected = (i: number) =>
      toText(tabsText({ width: 28, height: 5 }, MANY, i)).split('\n')[0];
    await userEvent.tab();
    const files = canvas.getByRole('tab', { name: 'files' });
    expect(document.activeElement).toBe(files);
    for (let i = 1; i < MANY.length; i++) {
      await userEvent.keyboard('{ArrowRight}');
      const tab = canvas.getByRole('tab', { name: MANY[i] as string });
      expect(document.activeElement).toBe(tab);
      expect(tab.getAttribute('aria-selected')).toBe('false');
      await waitFor(() => expect(top(), MANY[i]).toBe(expected(i)));
      expect(tab.getBoundingClientRect().width).toBeGreaterThan(0);
    }
    expect(files.getAttribute('aria-selected')).toBe('true');
    // Out of the list, the selected tab is what the edge shows again.
    await userEvent.tab();
    await waitFor(() => expect(top()).toBe(expected(0)));
  },
};

/** Both painters draw the same frame, gaps and all, in the same cells. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Views painter="glyph" name="glyph" />
      <Views painter="rule" name="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const read = (name: string) =>
      screenshot(screenOf(canvas.getByRole('tablist', { name })), { legend: false });
    await waitFor(() => expect(read('rule')).toBe(read('glyph')));
    expect(read('glyph').split('\n')[0]).toBe(
      toText(tabsText({ width: 36, height: 5 }, LABELS, 0)).split('\n')[0],
    );
  },
};

/**
 * The frame, its gaps and the overflow marks meet at every density with both
 * stroke styles (cairn 0117). The zoom browser runs this at 200%.
 */
export const Continuity: Story = {
  tags: ['zoom'],
  // The play function runs the check itself and asserts what it covered.
  parameters: { continuity: false },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {DENSITIES.flatMap((density) =>
        (['glyph', 'rule'] as const).map((painter) => (
          <div key={`${density} ${painter}`} data-density={density}>
            <Views
              labels={MANY}
              cols={28}
              rows={3}
              painter={painter}
              name={`${density}, ${painter}`}
            />
          </div>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const run = runner();
    if (!run) return;
    const report = await expectContinuity(canvasElement, { capture: run.capture });
    expect(report.layers).toBe(8);
    expect(report.joins).toBeGreaterThan(200);
  },
};

/** Held to `strict`: the frame, the tabs and the panel are whole cells. */
export const Strict: Story = {
  render: () => (
    <div data-rk-conformance="strict">
      <Views />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(canvas.getByRole('tablist', { name: 'View' })).toBeVisible();
  },
};

/** Touch density: a tab is a finger's height. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Views />
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(
      canvas.getByRole('tab', { name: 'files' }).getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(32);
  },
};

/** Dark mode: the same tabs on the dark palette, and axe on them. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Views />,
  play: async ({ canvas }) => {
    expect(document.documentElement.dataset.theme).toBe('dark');
    await settled();
    expect(canvas.getByRole('tab', { name: 'files' })).toBeVisible();
  },
};

/**
 * Forced colors: the selected tab is still reversed, in the reader's pair and
 * with no backplate behind its label, and still bold.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Views />,
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    const files = canvas.getByRole('tab', { name: 'files' });
    const probe = (colour: string) => {
      const el = document.createElement('span');
      el.style.color = colour;
      files.append(el);
      const value = getComputedStyle(el).color;
      el.remove();
      return value;
    };
    expect(getComputedStyle(files).forcedColorAdjust).toBe('none');
    expect(getComputedStyle(files).backgroundColor).toBe(probe('CanvasText'));
    expect(Number(getComputedStyle(files).fontWeight)).toBeGreaterThanOrEqual(700);
  },
};
