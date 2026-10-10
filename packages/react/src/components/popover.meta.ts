import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { popoverBuffer } from './popover.pure.ts';

const BRANCHES = ['main', 'develop', 'release/0.1'];

export const popoverMeta: ComponentMetaInput = defineMeta({
  name: 'Popover',
  summary: 'A framed box anchored to its trigger, for content that belongs to it.',
  description:
    "A filter form, a colour picker, help for a field: content that hangs from the thing that opened it and leaves the page usable. React Aria's Popover places it, moves focus in and back to the trigger, and dismisses it on Escape and on a press outside. The overlay contract puts it on the cell grid of its trigger's screen, on the row next to the trigger and starting in its column, with no gap, framed heavy, one weight above the page. It flips to the other side in whole cells when there is no room, and it is never narrower than its trigger. Menu, Select, Tooltip and Combobox are built on it.",
  whenToUse: [
    'For content that belongs to a control and is used beside it: a filter, a picker, a field’s help.',
    'As the box a menu, a select’s list or a combobox’s suggestions open in.',
  ],
  whenNotToUse: [
    {
      text: 'For something the reader must answer before going on: a popover leaves the page usable. Use a modal, OverlayModal until Dialog (0039) lands.',
    },
    { text: 'For a region of the page that does not float.', instead: 'Frame' },
    { text: 'For a list of actions. Menu is built on Popover and adds the keyboard a menu needs.' },
  ],
  related: [
    {
      name: 'OverlayPopover',
      why: 'The overlay contract Popover is built on. OverlayModal, beside it, is for what must be answered first.',
    },
    { name: 'Button', why: 'The usual trigger, inside a React Aria DialogTrigger.' },
    {
      name: 'List',
      why: 'A list inside a popover scrolls by its own rows and draws its own scrollbar column.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Popover',
      description:
        "React Aria's Popover on the overlay contract: a dialog unless a Dialog is nested inside it, carrying `data-placement` (the side it ended up on) and `data-trigger` (what opened it).",
    },
    {
      kind: 'element',
      name: 'popover',
      className: 'rk-popover',
      chrome: false,
      description:
        'The element React Aria positions. With `minCols="trigger"`, the default, its surface is at least as wide as `--trigger-width`, rounded up to whole cells.',
    },
  ],
  states: [],
  accessibility: {
    name: 'Name it with `aria-label` on Popover or on the Dialog inside it, or with a Heading in that Dialog. The frame is aria-hidden.',
    keyboard: [
      { keys: ['enter', 'space'], action: 'On the trigger, opens the popover and moves focus in.' },
      { keys: ['tab'], action: 'Moves through what the popover holds; focus stays inside it.' },
      { keys: ['esc'], action: 'Closes the popover; focus returns to its trigger.' },
    ],
    typeAhead: false,
    announces: '"Branches, dialog" as focus moves in.',
    notes: [
      'A press outside closes it, and focus returns to the trigger.',
      'Under 60 cells across, or at touch density, it is as wide as the viewport, under its trigger, so every row in it is a finger-sized target.',
      'There is no motion: it is there on the next frame, fully drawn.',
    ],
  },
  snapshots: [
    {
      title: 'Under its trigger',
      description:
        'On the next row, from the trigger’s first column, with no gap: framed heavy, one weight above the page.',
      text: toText(popoverBuffer({ lines: BRANCHES, trigger: 'Branches' })),
    },
    {
      title: 'Flipped',
      description: 'With no room below, above, ending on the row before the trigger.',
      text: toText(popoverBuffer({ lines: BRANCHES, trigger: 'Branches', placement: 'top' })),
    },
    {
      title: 'As wide as its trigger',
      description:
        'Content narrower than the trigger: the popover takes the trigger’s width, so a Select’s list lines up with the Select.',
      text: toText(popoverBuffer({ lines: ['main'], trigger: 'Branches' })),
    },
    {
      title: 'Scrolled',
      description: 'More rows than `maxRows`: the thumb in the frame’s right edge, in whole cells.',
      text: toText(
        popoverBuffer({
          lines: ['one', 'two', 'three', 'four', 'five', 'six'],
          maxRows: 3,
          offset: 3,
        }),
      ),
    },
  ],
});
