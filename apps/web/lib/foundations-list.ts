/**
 * The foundations pages (cairn 0106), in the order to read them: plain data,
 * for the map as much as for the pages.
 */
export interface Foundation {
  readonly id: string;
  readonly title: string;
  /** For the tab, the card and the index. */
  readonly description: string;
}

/** The pages, in the order to read them. */
export const FOUNDATION_PAGES: readonly Foundation[] = [
  {
    id: 'grid',
    title: 'The grid',
    description:
      'The cell is one character wide and one row tall, every size is a count of cells, and density is how tall a row is.',
  },
  {
    id: 'strictness',
    title: 'Strictness',
    description:
      'Three levels of strictness, a check that holds a screen to its level, and the one way to break the grid, which is to say why.',
  },
  {
    id: 'glyphs',
    title: 'Glyphs',
    description:
      'The border sets, the junction table that resolves every seam, the marks that carry state, and what happens to wide characters and emoji.',
  },
  {
    id: 'colour',
    title: 'Colour',
    description:
      'The ANSI 16 and the role slots, the semantic tokens components read, the contrast gate every pair passes, and how a terminal theme becomes a rockaway one.',
  },
  {
    id: 'themes',
    title: 'Themes',
    description:
      'Every theme that ships, in each mode it declares, drawn in its own border set and colours, with its files for Ghostty, kitty, Alacritty and iTerm2.',
  },
  {
    id: 'tokens',
    title: 'Tokens',
    description:
      'Every token, read from the DTCG files the package ships when the site is built, with the custom property CSS reads and what it is for.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    description:
      'What is tested on every component, how, and where the system is still thin, written down so it is a known limit rather than a surprise.',
  },
];

export function foundation(id: string): Foundation {
  const page = FOUNDATION_PAGES.find((p) => p.id === id);
  if (!page) throw new Error(`no foundations page is ${id}`);
  return page;
}
