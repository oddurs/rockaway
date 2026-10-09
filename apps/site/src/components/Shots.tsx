/**
 * The landing page's product shots (cairn 0108): three screens of software,
 * each made of the system's real components and rendered on the server. They
 * are pictures of an app, not the app: the page makes them inert, so a
 * reader tabs past them, and each says what it is in its caption. The live
 * versions are on each component's page, and the example apps (0151) will
 * be linked here as they land.
 *
 * Every screen is a fixed number of cells, so the server draws it at exactly
 * its size and nothing moves when the page's script arrives.
 */
import { Badge, Button, Frame, KeyHint, Screen, useGlyphs } from '@rockaway/react';
import { LinkTree } from '@rockaway/react/link-tree';
import { Pane, Panes } from '@rockaway/react/panes';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import { tableBuffer } from '@rockaway/react/table';
import type { ReactNode } from 'react';
import { DEPLOYS, GIT_STATUS } from '../lib/shots.ts';

/** How wide every shot is, in cells: inside the measure, with room for the scroller's marks. */
export const SHOT_COLS = 72;

const segment = (name: (typeof GIT_STATUS)[number]['name']) => {
  const found = GIT_STATUS.find((s) => s.name === name);
  return {
    priority: found?.priority ?? 0,
    ...(found && 'align' in found ? { align: found.align } : {}),
  };
};

/** A git client: the changed files, the diff, and the status bar under them. */
export function GitClient(): ReactNode {
  const files = [
    {
      title: 'src',
      href: '#src',
      children: [
        { title: 'panes.tsx', href: '#panes' },
        { title: 'status-bar.tsx', href: '#status-bar' },
      ],
    },
    { title: 'README.md', href: '#readme' },
  ];
  const diff: readonly [string, string][] = [
    ['rk-syntax-comment', '@@ -40,6 +40,9 @@ export function Panes'],
    ['', '   const layout = useLayout(split);'],
    ['rk-syntax-deleted', '-  return <Screen draw={layout.draw} />;'],
    ['rk-syntax-inserted', '+  return ('],
    ['rk-syntax-inserted', '+    <Screen draw={layout.draw}>'],
    ['rk-syntax-inserted', '+      {layout.panes.map(place)}'],
    ['rk-syntax-inserted', '+    </Screen>'],
    ['rk-syntax-inserted', '+  );'],
    ['', ' }'],
  ];
  return (
    <div className="site-shot-stack">
      <Panes cols={SHOT_COLS} rows={14} label="changes and diff">
        <Pane title="changes" size={24}>
          <LinkTree items={files} current="#panes" />
        </Pane>
        <Pane title="panes.tsx">
          {diff.map(([role, line], i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed picture, never reordered.
            <div key={i} className={role || undefined}>
              {line}
            </div>
          ))}
        </Pane>
      </Panes>
      <StatusBar cols={SHOT_COLS} label="git status">
        <StatusSegment variant="mode" {...segment('mode')}>
          DIFF
        </StatusSegment>
        <StatusSegment {...segment('branch')}>main, 2 ahead</StatusSegment>
        <StatusMessage />
        <StatusSegment {...segment('keys')}>
          <KeyHint keys="c">commit</KeyHint>
        </StatusSegment>
        <StatusSegment {...segment('changes')}>2 files</StatusSegment>
      </StatusBar>
    </div>
  );
}

/** A settings screen: choices, two checkboxes and the buttons that keep them. */
export function Settings(): ReactNode {
  const { mark, delimiter } = useGlyphs();
  const [open, close] = delimiter.control;
  const box = (on: boolean) => `${open}${on ? mark.check : mark.blank}${close}`;
  const radio = (on: boolean) => (on ? mark.radio : mark['radio-empty']);
  return (
    <Frame title="settings" cols={SHOT_COLS} rows={11} pad={{ x: 2, y: 1 }}>
      <div>{`Theme     ${open} sunset ${close}`}</div>
      <div>{`Density   ${radio(false)} dense  ${radio(true)} normal  ${radio(false)} airy`}</div>
      <div> </div>
      <div>{`${box(true)} Sign commits`}</div>
      <div>{`${box(false)} Push on save`}</div>
      <div> </div>
      <div className="site-shot-actions">
        <Button>Cancel</Button> <Button variant="fill">Save</Button>
      </div>
    </Frame>
  );
}

/**
 * A dashboard: the deploys, in a table, and how many are in each state. The
 * table is drawn by Table's own buffer, the drawing its live grid is laid
 * over, since a picture needs no grid to take the keys.
 */
export function Deploys(): ReactNode {
  const glyphs = useGlyphs();
  const table = tableBuffer(
    {
      columns: [
        { header: 'Service', width: '1fr', sortable: true, sort: 'ascending' },
        { header: 'Status', width: 10 },
        { header: 'Age', width: 5, align: 'end' },
      ],
      rows: DEPLOYS.map((deploy) => ({
        cells: [deploy.service, deploy.status, deploy.age],
        ...(deploy.id === 'worker' ? { cursor: true } : {}),
      })),
      width: SHOT_COLS - 6,
    },
    glyphs,
  );
  return (
    <Frame title="deploys" cols={SHOT_COLS} rows={table.height + 5} pad={{ x: 2, y: 1 }}>
      <Screen draw={() => table} cols={table.width} rows={table.height} />
      <div> </div>
      <div className="site-shot-actions">
        <Badge tone="success">2 live</Badge> <Badge tone="danger">1 failed</Badge>{' '}
        <Badge>1 building</Badge>
      </div>
    </Frame>
  );
}
