import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { tooltipBuffer } from './tooltip.pure.ts';

export const tooltipMeta: ComponentMetaInput = defineMeta({
  name: 'Tooltip',
  summary: 'A one-line hint on hover or keyboard focus.',
  description:
    "What an icon-only control does, or the whole of a truncated label. React Aria's Tooltip on the overlay contract (0128): on whole cells of its trigger's screen, on the row next to it with no gap. When its words fit on one row it is that row in reverse video; when they wrap it is framed heavy, as a popover is; either way at most 40 cells wide. React Aria shows it on hover after a delay and at once on keyboard focus, links it by aria-describedby, hides it on Escape, and never moves focus. It is never shown on touch, so it is never the only place something is said.",
  whenToUse: [
    'To say what an icon-only control does.',
    'To show the whole of a label cut short with an ellipsis.',
    'For a keyboard shortcut beside the control it belongs to.',
  ],
  whenNotToUse: [
    {
      text: 'For anything a reader must know: a touch reader never sees a tooltip. Say it on the page.',
    },
    { text: 'For content with links or controls in it.', instead: 'OverlayPopover' },
    { text: 'For an error or a hint on a field.', instead: 'Fieldset' },
  ],
  related: [
    { name: 'OverlayPopover', why: 'The same contract, for content a reader can act on.' },
    { name: 'KeyHint', why: 'A shortcut in a tooltip is a KeyHint.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Tooltip',
      description:
        'React Aria\'s Tooltip through OverlayTooltip, role="tooltip" as React Aria writes it once shown (a server renders no tooltip, so its stories assert the role). Put it in TooltipTrigger, re-exported here from React Aria, beside the element it describes.',
    },
    {
      kind: 'element',
      name: 'body',
      className: 'rk-tooltip',
      chrome: false,
      description:
        'The words, wrapping at 36 cells, a word longer than that broken rather than pushing the tooltip past 40.',
    },
  ],
  states: [],
  accessibility: {
    name: 'A tooltip describes its trigger, through aria-describedby; it is not its name. An icon-only trigger still needs its own aria-label.',
    keyboard: [{ keys: ['esc'], action: 'Hides the tooltip. Focus stays on the trigger.' }],
    typeAhead: false,
    announces:
      'The trigger\'s name, then the tooltip\'s words as its description: "Save, button, Write the file to disk".',
    notes: [
      'Shown at once on keyboard focus, and after a delay on hover; never on touch.',
      'Focus never moves into a tooltip: it holds nothing to operate.',
      'Placement is data-placement on the tooltip, as React Aria writes it. Open is its presence: a closed tooltip renders nothing.',
      'There is no motion: data-entering and data-exiting are not used.',
    ],
  },
  snapshots: [
    {
      title: 'One row, and wrapped',
      description:
        'A row of reverse video, the ground of the words on it; and the frame a tooltip takes when its words wrap.',
      text: [
        toText(tooltipBuffer({ width: 20, height: 1 }), { trimEnd: false }),
        toText(tooltipBuffer({ width: 20, height: 4 })),
      ].join('\n'),
    },
  ],
});
