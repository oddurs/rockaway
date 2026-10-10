import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { dialogBuffer, dialogVariants } from './dialog.pure.ts';

const SIZE = { width: 32, height: 5 };

export const dialogMeta: ComponentMetaInput = defineMeta({
  name: 'Dialog',
  summary: 'A modal window for something the reader must finish or dismiss before going on.',
  description:
    "React Aria's Dialog in the overlay contract's modal (0128): the viewport behind it filled with the theme's light shade, the dialog framed double and centred on whole cells, its title set into the top edge, its content, and an action row of buttons at the bottom right. Under 60 cells, or at touch density, it is a full-width sheet on the bottom rows. AlertDialog is the destructive confirmation: role alertdialog, the caution mark before the title, and the safe action first in focus. React Aria contains focus, returns it to the trigger, closes on Escape and makes the page behind inert; content taller than the room scrolls with no native scrollbar, its position in the frame's right edge.",
  whenToUse: [
    'To ask for a decision the reader must make before going on: discard changes, delete a file.',
    'For a short form that belongs to one action: rename, invite, set a value.',
    'For a help screen or other content the page should wait behind.',
    'AlertDialog when the action cannot be undone.',
  ],
  whenNotToUse: [
    {
      text: 'For information the reader can glance at and leave, anchored to what it is about.',
      instead: 'OverlayPopover',
    },
    { text: 'For a note that is part of the text.', instead: 'Callout' },
    { text: 'For long content that deserves a page of its own: link to the page instead.' },
  ],
  related: [
    {
      name: 'OverlayPopover',
      why: 'The overlay contract a dialog is built on, with OverlayModal.',
    },
    { name: 'Button', why: 'The actions in the action row, and the trigger that opens it.' },
    { name: 'Callout', why: 'The same caution mark carries an alert.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Dialog',
      role: 'dialog',
      description:
        "React Aria's Dialog in an OverlayModal, named by its title. Put it in DialogTrigger, re-exported here from React Aria, with its button, or control it with isOpen.",
    },
    {
      kind: 'import',
      name: 'AlertDialog',
      role: 'alertdialog',
      description:
        'A Dialog with the alert variant, a destructive action and a safe one, the safe one focused first and the backdrop not dismissing it.',
    },
    {
      kind: 'element',
      name: 'frame',
      className: 'rk-frame',
      chrome: true,
      description:
        "The modal's double line, the title set into its top edge, the alert's caution mark before it, over the overlay contract's backdrop of shade. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'content',
      className: 'rk-dialog-content',
      chrome: false,
      description: 'The prose and controls, wrapping as text does.',
    },
    {
      kind: 'element',
      name: 'actions',
      className: 'rk-dialog-actions',
      chrome: false,
      description: 'The action row, at the bottom right, a blank row under the content.',
    },
  ],
  variants: describeVariants(dialogVariants, {
    variant: {
      description: 'What the dialog is for, which its role and its heading say.',
      values: {
        default: 'role="dialog": a question, a form, a help screen.',
        alert:
          'role="alertdialog", the caution mark before the title: a destructive confirmation. AlertDialog sets it.',
      },
    },
  }),
  states: [],
  accessibility: {
    name: "The title, through aria-label. The title in the frame is chrome; the mark before an alert's is not part of its name.",
    keyboard: [
      { keys: ['esc'], action: 'Closes the dialog; focus returns to its trigger.' },
      { keys: ['tab'], action: 'Moves through the dialog, and wraps: focus stays inside.' },
    ],
    typeAhead: false,
    announces: '"Discard changes?, dialog", then the focused control.',
    notes: [
      'Focus starts on the dialog itself, so its name and content are heard first, and Tab goes to its first control; autoFocus on a control starts there instead. In an AlertDialog it starts on the safe action.',
      'The page behind is inert and does not scroll, through React Aria.',
      'A press on the backdrop closes it only when isDismissable; never an AlertDialog.',
      'There is no motion: data-entering and data-exiting are not used.',
    ],
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: a one-row dialog.
    min: toText(dialogBuffer({ width: 12, height: 3 }, { title: 'x' })),
    // The default: the dialog in its snapshot.
    default: toText(dialogBuffer(SIZE, { title: 'Rename file' })),
  },
  snapshots: [
    {
      title: 'A dialog and an alert',
      description:
        "The title in the top edge; an alert carries the caution mark, so it reads without colour. The rows inside are the content's.",
      text: [
        toText(dialogBuffer(SIZE, { title: 'Rename file' })),
        toText(dialogBuffer(SIZE, { title: 'Discard changes?', variant: 'alert' })),
      ].join('\n'),
    },
    {
      title: 'Under an ASCII theme',
      text: toText(
        dialogBuffer(
          { width: 32, height: 3 },
          { title: 'Discard changes?', variant: 'alert' },
          glyphsFor({ borderSet: 'ascii' }),
        ),
      ),
    },
  ],
});
