/**
 * The shell's shape (cairn 0104), written once: the panes, the status bar's
 * segments and the keys. The server renders the system's components from it,
 * and the page's script lays them out and binds the keys from it, so the two
 * can never describe a different shell.
 */
import { layoutPanes, type PaneSpec, type SplitSpec } from '@rockaway/react/panes';
import type { NavNode } from './nav.ts';
import type { Heading } from './outline.ts';

/** Narrower than this, in cells, and the panes stack. */
export const STACK_BELOW = 64;

/** The size the server draws the panes at: a guess the script replaces before anyone sees it. */
export const SERVER_SIZE = { width: 120, height: 40 } as const;

/**
 * Wide enough never to fit: a pane that should be collapsed whatever the room,
 * the outline when the panes are stacked or the page has no sections.
 */
const NEVER = 100_000;

export interface ShellShape {
  /** Under `STACK_BELOW` cells, the map is over the page rather than beside it. */
  readonly stacked: boolean;
  /** What the page's pane says in its border. */
  readonly title: string;
  /** Whether the page has sections to outline. */
  readonly outline: boolean;
}

/**
 * The three panes, in order: the map, the page and its outline. The outline
 * is always there, so the panes are the same boxes at every width; it is the
 * first to collapse, and collapses for good when the panes stack.
 */
export function shellSplit({ stacked, title, outline }: ShellShape): SplitSpec {
  const panes: PaneSpec[] = [
    { title: 'rockaway', size: stacked ? 6 : 26, min: stacked ? 3 : 18, priority: 2 },
    { title, size: '1fr', min: stacked ? 6 : 36, priority: 3 },
    // A pane's fixed size is its minimum, and outranks `min`: the outline that
    // should never show is given a size that never fits, not only a minimum.
    stacked || !outline
      ? { title: 'on this page', size: NEVER, min: NEVER, priority: 1 }
      : { title: 'on this page', size: 28, min: 18, priority: 1 },
  ];
  return { direction: stacked ? 'column' : 'row', panes };
}

/** A phone's screen, in cells: where the stacked panes are measured for the first frame. */
const PHONE = { width: 40, height: 40 } as const;

/** Where a pane's content is, and how much narrower and shorter than the screen. */
interface Placed {
  readonly x: number;
  readonly y: number;
  readonly lessCols: number;
  readonly lessRows: number;
}

/** A shell's shape, stacked or not. */
type ShellShapeOf = Omit<ShellShape, 'stacked'>;

/** The page's pane at one stacked size, or nothing if it has no room. */
function stackedAt(size: { width: number; height: number }, shape: ShellShapeOf): Placed | null {
  const { panes } = layoutPanes(size, shellSplit({ ...shape, stacked: true }));
  const page = panes.find((pane) => pane.path.length === 1 && pane.path[0] === 1);
  if (!page || page.collapsed) return null;
  const { x, y, width, height } = page.content;
  return { x, y, lessCols: size.width - width, lessRows: size.height - height };
}

/**
 * Where the page's pane is when the panes are stacked (0152): its corner, in
 * cells from the screen's, and how many cells narrower and shorter than the
 * screen it is. Stacked, those are the same at every size from `minRows` rows
 * of panes up, so a phone can be shown the page where the script will put it
 * before the script has arrived, and nothing moves when it does. Shorter than
 * that, the map is the pane that goes, and the page moves up.
 */
export function stackedPage(shape: ShellShapeOf): Placed & { readonly minRows: number } {
  const placed = stackedAt(PHONE, shape);
  if (!placed) throw new Error('a phone has no room for the page');
  let minRows = PHONE.height;
  const same = (other: Placed | null) =>
    other !== null &&
    other.x === placed.x &&
    other.y === placed.y &&
    other.lessCols === placed.lessCols &&
    other.lessRows === placed.lessRows;
  while (minRows > 1 && same(stackedAt({ width: PHONE.width, height: minRows - 1 }, shape))) {
    minRows -= 1;
  }
  return { ...placed, minRows };
}

/** The status bar's segments, in order, as `StatusSegment` gives them: the message line is not one. */
export const STATUS_SEGMENTS = [
  { name: 'mode', priority: 4 },
  { name: 'where', priority: 1 },
  { name: 'look', priority: -1, align: 'end' },
  { name: 'copy', priority: 0, align: 'end' },
  { name: 'keys', priority: 2, align: 'end' },
  { name: 'position', priority: 3, align: 'end' },
] as const;

/** What a key does, by name: the script has the functions, the server only the words. */
export type Action =
  | 'down'
  | 'up'
  | 'page-down'
  | 'page-up'
  | 'top'
  | 'bottom'
  | 'help'
  | 'back'
  | 'copy-text'
  | 'copy-ansi'
  | 'theme'
  | 'theme-back'
  | 'mode'
  | 'density'
  | `go:${string}`;

export interface ShellBinding {
  readonly keys: string;
  readonly description: string;
  readonly action: Action;
}

/**
 * Every key the shell binds, in the order the help screen lists them. Every
 * `g` jump is a row of the map too, so every route is also a link.
 */
export function shellBindings(nav: readonly NavNode[]): readonly ShellBinding[] {
  const go = (key: string, id: string): ShellBinding[] => {
    const node = nav.find((n) => n.id === id);
    return node ? [{ keys: `g ${key}`, description: node.title, action: `go:${node.href}` }] : [];
  };
  return [
    { keys: 'j', description: 'Down a line', action: 'down' },
    { keys: 'k', description: 'Up a line', action: 'up' },
    { keys: 'down', description: 'Down a line', action: 'down' },
    { keys: 'up', description: 'Up a line', action: 'up' },
    { keys: 'space', description: 'Down a screen', action: 'page-down' },
    { keys: 'shift+space', description: 'Up a screen', action: 'page-up' },
    { keys: 'g g', description: 'To the top', action: 'top' },
    // `shift+g` rather than `G`, which the keymap reads as `g`.
    { keys: 'shift+g', description: 'To the bottom', action: 'bottom' },
    ...go('h', 'home'),
    ...go('s', 'getting-started'),
    ...go('d', 'concept'),
    ...go('f', 'foundations'),
    ...go('c', 'components'),
    { keys: 'y', description: 'Copy the screen as text', action: 'copy-text' },
    {
      keys: 'shift+y',
      description: 'Copy the screen as ANSI, for a terminal',
      action: 'copy-ansi',
    },
    { keys: 't', description: 'The next theme', action: 'theme' },
    { keys: 'shift+t', description: 'The theme before', action: 'theme-back' },
    { keys: 'm', description: 'Light, dark, or as the system says', action: 'mode' },
    { keys: 'd', description: 'The next density', action: 'density' },
    { keys: '?', description: 'These keys', action: 'help' },
  ];
}

/** Bound only while the keys are showing. */
export const HELP_BINDINGS: readonly ShellBinding[] = [
  { keys: 'esc', description: 'Back to the page', action: 'back' },
];

/** A page's outline as link-tree rows: each section, and the sections within it. */
export function outlineItems(headings: readonly Heading[]): {
  title: string;
  href: string;
  children: { title: string; href: string }[];
}[] {
  const sections: { title: string; href: string; children: { title: string; href: string }[] }[] =
    [];
  for (const heading of headings) {
    const row = { title: heading.text, href: `#${heading.id}` };
    const last = sections.at(-1);
    if (heading.depth === 3 && last !== undefined) last.children.push(row);
    else sections.push({ ...row, children: [] });
  }
  return sections;
}
