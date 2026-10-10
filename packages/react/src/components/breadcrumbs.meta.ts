import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { breadcrumbsBuffer } from './breadcrumbs.pure.ts';

const PATH = ['rockaway', 'docs', 'components', 'Breadcrumbs'];

export const breadcrumbsMeta: ComponentMetaInput = defineMeta({
  name: 'Breadcrumbs',
  summary: 'Where a page sits, as a path of links on one row.',
  description:
    "Text on the grid, every character a cell: each level a Link, through the app's own link component, the theme's separator between them with a cell of air either side, and the current page last, bold and not a link. A path longer than `maxItems` keeps its first level and its last ones and folds the middle into the theme's ellipsis, a button one cell wide that opens a Menu of the levels it hides. React Aria's Breadcrumbs: a list in a nav, the current page aria-current.",
  whenToUse: [
    'At the top of a page deep in a hierarchy: docs, settings, a file browser.',
    'In a toolbar or a status bar, where a path is the context for what is below it.',
  ],
  whenNotToUse: [
    { text: 'For the steps of a task in order: a path is where a page is, not a sequence.' },
    { text: 'For the main navigation of an app: a path is where you are, not where you can go.' },
  ],
  related: [
    { name: 'Link', why: 'Each level is one, through the app’s own link.' },
    { name: 'Menu', why: 'The folded middle opens one.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Breadcrumbs',
      description: 'A nav, named by `label`, holding the list of levels.',
    },
    {
      kind: 'element',
      name: 'separator',
      className: 'rk-breadcrumb-separator',
      chrome: true,
      description:
        "The theme's separator mark, muted, with a cell of air either side. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'current',
      className: 'rk-breadcrumb-current',
      chrome: false,
      description: 'The current page, last: bold, in the body colour, aria-current="page".',
    },
    {
      kind: 'element',
      name: 'more',
      className: 'rk-breadcrumb-more',
      chrome: false,
      description:
        "The folded middle: the theme's ellipsis, a button one cell wide, named by `moreLabel`, opening a Menu of the hidden levels.",
    },
  ],
  states: [
    {
      state: 'focus-unframed',
      part: 'more',
      note: 'The ring the focus layer draws round a control with no frame (focus.css).',
    },
    {
      state: 'pressed',
      part: 'more',
      note: 'Reverse video in the link colour, as a pressed link is. The levels are Links, with their own states.',
    },
  ],
  accessibility: {
    name: 'The nav is named by `label`, "Breadcrumbs" by default; each level by its words.',
    keyboard: [
      { keys: ['tab'], action: 'Moves through the levels, and the folded middle, in order.' },
      { keys: ['enter'], action: 'Follows a level, or opens the folded middle’s menu.' },
    ],
    typeAhead: false,
    announces:
      '"Breadcrumbs, navigation, list, 4 items", then each level; the last "current page".',
    notes: ['The separators are aria-hidden: the list says where each level is.'],
  },
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: one crumb, the current page.
    min: toText(breadcrumbsBuffer(['Home'])),
    // The default: the path.
    default: toText(breadcrumbsBuffer(PATH)),
  },
  snapshots: [
    {
      title: 'A path',
      description: 'Four levels, the current page last and bold.',
      text: toText(breadcrumbsBuffer(PATH)),
    },
    {
      title: 'Folded',
      description:
        'At `maxItems={3}`: the first level, the ellipsis for the middle, and the current page.',
      text: toText(breadcrumbsBuffer(PATH, { maxItems: 3 })),
    },
  ],
});
