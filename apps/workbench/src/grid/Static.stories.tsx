/**
 * The DOM halves (cairn 0104) against the components, cell for cell.
 *
 * A page can render Panes, StatusBar and KeymapHelp on a server and lay them
 * out with no React, through `@rockaway/react/dom` and the keymap engine; the
 * site's shell does. That is only honest while the two ways agree. So each
 * story renders the component with React at a size, renders the same element
 * on the "server" (`renderToStaticMarkup`, at another size), lays the static
 * markup out with the DOM half at the first size, and reads both back: the
 * same characters in the same cells, and the same chrome, node for node.
 */
import type { SplitSpec } from '@rockaway/react';
import {
  fitStatusBar,
  Keymap,
  KeymapHelp,
  Pane,
  Panes,
  relayoutPanes,
  StatusBar,
  StatusMessage,
  StatusSegment,
  type StatusSegmentFit,
  useKeymap,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

const meta = { title: 'Grid/Static' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** A server's render of `element`, put in `host`: markup, with no React behind it. */
function serve(host: HTMLElement, element: ReactElement): HTMLElement {
  host.innerHTML = renderToStaticMarkup(element);
  return host.firstElementChild as HTMLElement;
}

/** The chrome as markup, for a node-for-node comparison. */
const chromeOf = (screen: HTMLElement): string =>
  screen.querySelector(':scope > .rk-frame')?.innerHTML ?? '';

// ── Panes ────────────────────────────────────────────────────────────────

const SPLIT: SplitSpec = {
  direction: 'row',
  panes: [
    { title: 'files', size: 14, min: 8, priority: 2 },
    {
      split: {
        direction: 'column',
        panes: [{ title: 'diff', size: '2fr' }, { title: 'log' }],
      },
    },
    { title: 'outline', size: 16, min: 10, priority: 1 },
  ],
};

/**
 * `SPLIT` as `Pane`s, with something in each leaf to place. Unnamed, so the
 * two copies of each are not two regions with one name.
 */
function Split(props: {
  cols?: number;
  rows?: number;
  fallback?: { width: number; height: number };
}) {
  const [files, , outline] = SPLIT.panes;
  return (
    <Panes {...props} direction="row">
      <Pane {...files} label="">
        <p>a.ts</p>
      </Pane>
      <Pane>
        <Panes direction="column">
          <Pane title="diff" size="2fr" label="">
            <p>+1 -1</p>
          </Pane>
          <Pane title="log" label="">
            <p>fix</p>
          </Pane>
        </Panes>
      </Pane>
      <Pane {...outline} label="">
        <p>top</p>
      </Pane>
    </Panes>
  );
}

const PANE_SIZES = [
  { cols: 60, rows: 8 },
  // Too narrow for the outline: it collapses, as the component collapses it.
  { cols: 34, rows: 6 },
] as const;

export const PanesLikeTheComponent: Story = {
  name: 'Panes, laid out without React, as the component lays them out',
  // The static half is laid out once, by a script that measures the cell
  // when it runs, as a page with no React would; it does not watch for a new
  // density. The matrix after the story only switches the root, so it would
  // find the cell the play measured at (cairn 0125).
  parameters: {
    matrix: {
      skip: (['dense', 'airy', 'touch'] as const).map((density) => ({
        density,
        reason: 'the static half is laid out once, at the density the play measured',
      })),
    },
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1lh' }}>
      {PANE_SIZES.map(({ cols, rows }) => (
        <div key={cols} style={{ display: 'grid', gap: '1lh' }}>
          <div data-testid={`react ${cols}`}>
            <Split cols={cols} rows={rows} />
          </div>
          <div data-testid={`static ${cols}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await measured(canvasElement);
    for (const { cols, rows } of PANE_SIZES) {
      const react = canvas.getByTestId(`react ${cols}`).firstElementChild as HTMLElement;
      // Rendered at the server's guess, then sized and laid out at the real size.
      const screen = serve(
        canvas.getByTestId(`static ${cols}`),
        <Split fallback={{ width: 120, height: 40 }} />,
      );
      screen.style.width = `calc(var(--rk-cell-width) * ${cols})`;
      screen.style.height = `calc(var(--rk-cell-height) * ${rows})`;
      relayoutPanes(screen, SPLIT);
      await waitFor(() => expect(react.dataset.rkCols).toBe(String(cols)));
      expect(screen.dataset.rkCols).toBe(String(cols));
      expect(screen.dataset.rkRows).toBe(String(rows));
      expect(chromeOf(screen), `chrome at ${cols}`).toBe(chromeOf(react));
      expect(screenshot(screen, { legend: false }), `text at ${cols}`).toBe(
        screenshot(react, { legend: false }),
      );
      const placed = (root: HTMLElement) =>
        [...root.querySelectorAll<HTMLElement>('.rk-pane')].map((pane) =>
          ['x', 'y', 'cols', 'rows']
            .map((v) => pane.style.getPropertyValue(`--rk-pane-${v}`))
            .concat(pane.hidden ? 'hidden' : 'shown')
            .join(' '),
        );
      expect(placed(screen), `panes at ${cols}`).toEqual(placed(react));
    }
  },
};

// ── StatusBar ────────────────────────────────────────────────────────────

const SEGMENTS: readonly (StatusSegmentFit & { text: string; variant?: 'mode' })[] = [
  { text: 'NORMAL', variant: 'mode', priority: 3 },
  { text: 'src/components/status-bar.tsx', priority: 1 },
  { text: '? help  : command', align: 'end', priority: -1 },
  { text: '12:4', align: 'end', priority: 2 },
];

function Bar({ cols, label }: { cols?: number; label: string }) {
  return (
    <StatusBar label={label} {...(cols === undefined ? {} : { cols })}>
      {SEGMENTS.slice(0, 2).map(({ text, ...fit }) => (
        <StatusSegment key={text} {...fit}>
          {text}
        </StatusSegment>
      ))}
      <StatusMessage />
      {SEGMENTS.slice(2).map(({ text, ...fit }) => (
        <StatusSegment key={text} {...fit}>
          {text}
        </StatusSegment>
      ))}
    </StatusBar>
  );
}

// Wide enough for all of it, cut, and down to the mode alone.
const BAR_WIDTHS = [80, 48, 30, 12] as const;

export const StatusBarLikeTheComponent: Story = {
  name: 'StatusBar, fitted without React, as the component fits it',
  // The static half is laid out once, by a script that measures the cell
  // when it runs, as a page with no React would; it does not watch for a new
  // density. The matrix after the story only switches the root, so it would
  // find the cell the play measured at (cairn 0125).
  parameters: {
    matrix: {
      skip: (['dense', 'airy', 'touch'] as const).map((density) => ({
        density,
        reason: 'the static half is laid out once, at the density the play measured',
      })),
    },
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1lh' }}>
      {BAR_WIDTHS.map((cols) => (
        <div key={cols} style={{ display: 'grid', gap: '1lh' }}>
          <div data-testid={`react ${cols}`}>
            <Bar cols={cols} label={`React, ${cols}`} />
          </div>
          <div data-testid={`static ${cols}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    await measured(canvasElement);
    for (const cols of BAR_WIDTHS) {
      const react = canvas.getByTestId(`react ${cols}`).firstElementChild as HTMLElement;
      await waitFor(() => {
        for (const s of react.querySelectorAll<HTMLElement>('.rk-status-segment')) {
          expect(s.style.visibility).not.toBe('hidden');
        }
      });
      // The server cannot measure a segment, so its bar arrives unplaced.
      const bar = serve(
        canvas.getByTestId(`static ${cols}`),
        <Bar cols={cols} label={`Static, ${cols}`} />,
      );
      expect(bar.querySelector<HTMLElement>('.rk-status-segment')?.style.visibility).toBe('hidden');
      fitStatusBar(bar, SEGMENTS);
      expect(chromeOf(bar), `ground at ${cols}`).toBe(chromeOf(react));
      expect(screenshot(bar, { legend: false }), `text at ${cols}`).toBe(
        screenshot(react, { legend: false }),
      );
      const placed = (root: HTMLElement) =>
        [...root.querySelectorAll<HTMLElement>('.rk-status-segment')].map((s) =>
          [
            s.style.getPropertyValue('--rk-status-x'),
            s.style.getPropertyValue('--rk-status-cols'),
            s.style.getPropertyValue('--rk-status-room'),
            s.dataset.truncated === undefined ? '' : 'truncated',
            s.hidden ? 'hidden' : '',
            s.querySelector('.rk-status-ellipsis')?.textContent ?? '',
          ].join('|'),
        );
      expect(placed(bar), `segments at ${cols}`).toEqual(placed(react));
    }
  },
};

// ── KeymapHelp ───────────────────────────────────────────────────────────

const BINDINGS = [
  { keys: 'j', description: 'Down a line' },
  { keys: 'g h', description: 'Home' },
  { keys: 'shift+g', description: 'To the bottom' },
  { keys: 'mod+k', description: 'The palette' },
  { keys: '?', description: 'These keys' },
] as const;

function Bound() {
  useKeymap(BINDINGS.map((b) => ({ ...b, action: () => {} })));
  return null;
}

export const KeymapHelpFromItsBindings: Story = {
  name: 'KeymapHelp, from a list of bindings, as from the keymap',
  render: () => (
    <div style={{ display: 'grid', gap: '1lh' }}>
      <div data-testid="react">
        <Keymap>
          <Bound />
          <KeymapHelp platform="other" />
        </Keymap>
      </div>
      <div data-testid="static" />
    </div>
  ),
  play: async ({ canvas }) => {
    const react = canvas.getByTestId('react');
    await waitFor(() => expect(react.querySelectorAll('.rk-keymap-help-row').length).toBe(5));
    // The server's: no keymap, no effects, the same list.
    const server = canvas.getByTestId('static');
    serve(server, <KeymapHelp bindings={BINDINGS} platform="other" />);
    // A server writes a style as React does on a server; the browser writes it back its own way.
    const markup = (root: HTMLElement) => {
      for (const el of root.querySelectorAll<HTMLElement>('[style]')) {
        el.setAttribute('style', el.style.cssText);
      }
      return root.innerHTML;
    };
    expect(markup(server)).toBe(markup(react));
  },
};
