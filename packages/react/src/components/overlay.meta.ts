import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { backdropBuffer, overlayBuffer } from './overlay.pure.ts';

export const overlayMeta: ComponentMetaInput = defineMeta({
  name: 'OverlayPopover',
  summary: 'The overlay contract: what everything that floats above a screen is built on.',
  description:
    "React Aria places an overlay, contains focus, locks scroll and dismisses it; the contract puts it on the grid. OverlayPopover and OverlayModal are React Aria's Popover and ModalOverlay with a surface that is a screen of its own, framed heavy or double, moved onto the cell grid of the screen its trigger is in, and carrying its trigger's theme, mode and density across the portal. A modal fills the viewport behind it with the theme's light shade. Content taller than the overlay may be scrolls with no native scrollbar, its position shown in the frame's right edge. Under 60 cells, or at touch density, a modal is a sheet on the bottom rows and a popover is as wide as the viewport. Popover, Dialog, Menu, Select, Tooltip, Combobox and CommandPalette are built on these.",
  whenToUse: [
    'To build an overlay component: a popover, a dialog, a menu, a select’s list, a tooltip.',
    'OverlayPopover for what is anchored to a trigger and leaves the page usable; OverlayModal for what takes the whole page until it is answered.',
    'OverlayLayer once, around the app, inside whatever carries its theme.',
  ],
  whenNotToUse: [
    { text: 'To frame a region of the page that does not float.', instead: 'Frame' },
    { text: 'To group fields in a form.', instead: 'Fieldset' },
  ],
  related: [
    {
      name: 'Frame',
      why: 'An overlay’s surface is a screen framed as Frame frames one, one weight heavier.',
    },
    {
      name: 'List',
      why: 'A list in an overlay scrolls by its own rows and draws its own scrollbar column.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'OverlayPopover',
      description:
        "React Aria's Popover, its surface on the cell grid of its trigger's screen, on the row next to its trigger, framed heavy.",
    },
    {
      kind: 'import',
      name: 'OverlayModal',
      description:
        "React Aria's ModalOverlay and Modal: the backdrop over the viewport, and the surface centred on the cell grid, framed double.",
    },
    {
      kind: 'import',
      name: 'OverlayTooltip',
      description:
        "React Aria's Tooltip on the cell grid of its trigger's screen: one row of reverse video, or framed heavy when its words wrap, at most 40 cells wide. Never a sheet.",
    },
    {
      kind: 'import',
      name: 'OverlayLayer',
      description:
        'The portal root every overlay opens into, inside the app’s contexts. It draws nothing.',
    },
    {
      kind: 'element',
      name: 'surface',
      className: 'rk-overlay',
      chrome: false,
      description:
        'A screen of its own, as tall as its content in whole rows, moved onto the grid with a relative offset.',
    },
    {
      kind: 'element',
      name: 'body',
      className: 'rk-overlay-body',
      chrome: false,
      description:
        'The content, scrolling past `maxRows` or the rows there is room for, with no native scrollbar.',
    },
    {
      kind: 'element',
      name: 'backdrop',
      className: 'rk-overlay-scrim',
      chrome: true,
      description:
        "A screen of the theme's light shade over the viewport's whole cells, aria-hidden.",
    },
  ],
  states: [],
  accessibility: {
    name: 'The overlay’s content names it: a React Aria Dialog’s heading or `aria-label`, a Menu’s `aria-label`. The frame and the backdrop are aria-hidden.',
    keyboard: [
      { keys: ['esc'], action: 'Closes the innermost overlay; focus returns to its trigger.' },
    ],
    typeAhead: false,
    announces: '"Discard changes?, dialog" as focus moves in.',
    notes: [
      'A press outside a popover closes it; a press on a modal’s backdrop closes it only when `isDismissable`.',
      'A modal contains focus and locks the page’s scroll, through React Aria.',
      'There is no motion: an overlay is there on the next frame, fully drawn.',
    ],
  },
  snapshots: [
    {
      title: 'A popover and a modal',
      description:
        'Heavy for an overlay that leaves the page usable, double for one that does not.',
      text: [
        toText(overlayBuffer({ width: 16, height: 4 }, { kind: 'popover' })),
        toText(overlayBuffer({ width: 16, height: 4 }, { kind: 'modal' })),
      ].join('\n'),
    },
    {
      title: 'Scrolled',
      description: 'The thumb in the right edge, in whole cells.',
      text: toText(
        overlayBuffer({ width: 16, height: 6 }, { scroll: { total: 12, visible: 4, offset: 4 } }),
      ),
    },
    {
      title: 'The backdrop',
      text: toText(backdropBuffer({ width: 16, height: 2 })),
    },
  ],
});
