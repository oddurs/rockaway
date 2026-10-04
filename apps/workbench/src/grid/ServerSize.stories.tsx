import { Callout, Divider, Fieldset, Frame } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode, useMemo } from 'react';
import { renderToString } from 'react-dom/server';
import { expect } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * A screen the page sizes, as a page with no script shows it (cairn 0126 and
 * its server fix). Each case is rendered twice in boxes of the same width:
 * once as the server's markup, put in the page and never hydrated, and once
 * as the live component, which measures itself. The server's frame has to be
 * the size the live one settles at, and its chrome has to reach the box's
 * edges, or a reader with no script sees the wrong frame, and every reader
 * sees the page jump when it hydrates.
 */

interface Case {
  readonly name: string;
  /** The box the page gives it: a width in cells, and a height when the page sets one. */
  readonly width: number;
  readonly height?: number;
  readonly element: ReactElement;
}

const CASES: readonly Case[] = [
  {
    name: 'a one-line callout',
    width: 40,
    element: <Callout tone="note">One line of prose.</Callout>,
  },
  {
    name: 'a callout that wraps',
    width: 32,
    element: (
      <Callout tone="warning" title="Before you publish">
        <p style={{ margin: 0 }}>
          A paragraph long enough to wrap onto a second and a third line in a box this narrow.
        </p>
      </Callout>
    ),
  },
  {
    name: 'a fieldset',
    width: 36,
    element: (
      <Fieldset legend="Notifications">
        <span>Email me when a release is published.</span>
      </Fieldset>
    ),
  },
  {
    name: 'a frame the page sizes',
    width: 30,
    height: 6,
    element: <Frame title="files" style={{ blockSize: '100%' }} />,
  },
  {
    name: 'a divider the page sizes',
    width: 30,
    element: <Divider label="files" />,
  },
];

function Box({ width, height, children }: { width: number; height?: number; children: ReactNode }) {
  return (
    <div
      style={{
        inlineSize: `calc(${width} * 1ch)`,
        ...(height === undefined ? {} : { blockSize: `calc(${height} * 1lh)` }),
      }}
    >
      {children}
    </div>
  );
}

/** The server's markup for one case: never hydrated, as a page with no script has it. */
function Server({ element }: { element: ReactElement }) {
  const html = useMemo(() => renderToString(element), [element]);
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the server's own markup, rendered here
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Both() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '1lh 4ch' }}>
      {CASES.map((c) => [
        <div key={`${c.name} server`} data-testid={`${c.name}, server`}>
          <Box width={c.width} {...(c.height === undefined ? {} : { height: c.height })}>
            <Server element={c.element} />
          </Box>
        </div>,
        <div key={`${c.name} live`} data-testid={`${c.name}, live`}>
          <Box width={c.width} {...(c.height === undefined ? {} : { height: c.height })}>
            {c.element}
          </Box>
        </div>,
      ])}
    </div>
  );
}

const meta = {
  title: 'Grid/Server size',
  component: Both,
  parameters: {
    layout: 'padded',
    // The server's copies are markup with no script: two of a name, and a
    // screen that has not measured. The live copies beside them are checked.
    a11y: { test: 'off' },
    conformance: false,
    continuity: false,
    targets: false,
    fields: false,
  },
} satisfies Meta<typeof Both>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Where a screen's box and its chrome end, in pixels from the box's corner. */
function geometry(host: HTMLElement) {
  const screen = host.querySelector<HTMLElement>('.rk-screen');
  if (!screen) throw new Error('no screen');
  const box = screen.getBoundingClientRect();
  const rows = [...screen.querySelectorAll<HTMLElement>(':scope > .rk-frame > .rk-row')];
  const first = rows[0]?.lastElementChild?.getBoundingClientRect();
  const last = rows.at(-1)?.getBoundingClientRect();
  return {
    width: box.width,
    height: box.height,
    chromeRight: (first?.right ?? 0) - box.left,
    chromeBottom: (last?.bottom ?? 0) - box.top,
  };
}

export const MatchesTheLiveSize: Story = {
  name: 'The server draws the size the page settles at',
  play: async ({ canvas }) => {
    // Only the live copies measure; the server's never will.
    for (const c of CASES) await measured(canvas.getByTestId(`${c.name}, live`));
    for (const c of CASES) {
      const server = geometry(canvas.getByTestId(`${c.name}, server`));
      const live = geometry(canvas.getByTestId(`${c.name}, live`));
      // The page does not move when it hydrates...
      expect(server.height, `${c.name}: height`).toBeCloseTo(live.height, 0);
      expect(server.width, `${c.name}: width`).toBeCloseTo(live.width, 0);
      // ...and the chrome the server sent reaches the edges of its box, as the
      // live one does, rather than running past them or stopping short.
      expect(server.chromeRight, `${c.name}: chrome across`).toBeCloseTo(server.width, 0);
      expect(server.chromeBottom, `${c.name}: chrome down`).toBeCloseTo(server.height, 0);
      expect(live.chromeBottom, `${c.name}: live chrome down`).toBeCloseTo(live.height, 0);
    }
  },
};
