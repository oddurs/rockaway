/**
 * The repository's documents that are pages of the site (cairn 0107, 0143).
 * Each lives in `docs/` and is written for GitHub as much as for here, so it
 * carries no frontmatter; what a page needs besides its text is kept here. A
 * document in `docs/` that is not listed fails the build, so nothing is
 * published without a description.
 */
export interface Doc {
  /** For the tab and the card, after the page's own name. */
  readonly title: string;
  readonly description: string;
}

export const docs: Readonly<Record<string, Doc>> = {
  'component-recipe': {
    title: 'The component recipe',
    description:
      'How to add a component: the files and the lines that wire them in, its metadata, stories and changeset, and the ten rules with the test that proves each.',
  },
  concept: {
    title: 'The concept',
    description:
      'How a terminal UI becomes a web page: frames as data, two layers, painters over one geometry, and the rules a component is held to.',
  },
  'getting-started': {
    title: 'Getting started',
    description:
      'Install rockaway, import its CSS and render a screen, with Vite or with Next.js, in under twenty lines.',
  },
};

export function docFor(id: string): Doc {
  const doc = docs[id];
  if (!doc) throw new Error(`docs/${id}.md has no entry in apps/site/src/lib/docs.ts`);
  return doc;
}
