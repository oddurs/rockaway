/**
 * Every page of the site, with its title and description (cairn 0150): what
 * the sitemap lists and each social card draws, read from the same places the
 * pages read them, so a card never says something its page does not.
 *
 * A page whose words are written in its own `.astro` file gets them from here
 * instead (`fixed`), so they are written once.
 */
import { getCollection } from 'astro:content';
import { components, slugOf } from './components.ts';
import { docFor } from './docs.ts';

export interface Page {
  /** Where it is, under the base, with no leading slash: `''` for the home page. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
}

/** The pages whose words are no collection's. */
export const fixed = {
  home: {
    path: '',
    title: 'rockaway — a TUI design system for the web',
    description:
      'A design system for terminal interfaces on the web. Every box is drawn on a grid of character cells, and every page is still a web page.',
  },
  foundations: {
    path: 'foundations/',
    title: 'Foundations — rockaway',
    description:
      'What every rockaway component stands on: the grid, strictness, glyphs, colour, the themes, the tokens and accessibility.',
  },
  components: {
    path: 'components/',
    title: 'Components — rockaway',
    description:
      'Every component in @rockaway/react, each with its snapshot, a live example, its props, states, keyboard map and tokens, generated from its metadata.',
  },
  missing: {
    path: '404.html',
    title: 'Not here — rockaway',
    description: 'There is no page at this address. The map goes everywhere there is one.',
  },
} as const satisfies Record<string, Page>;

/** Every page, in the order the map shows them. */
export async function allPages(): Promise<readonly Page[]> {
  const docs = await getCollection('docs');
  const foundations = (await getCollection('foundations')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  return [
    fixed.home,
    ...docs.map((entry) => {
      const doc = docFor(entry.id);
      return {
        path: `${entry.id}/`,
        title: `${doc.title} — rockaway`,
        description: doc.description,
      };
    }),
    fixed.foundations,
    ...foundations.map((entry) => ({
      path: `foundations/${entry.id}/`,
      title: `${entry.data.title} — rockaway`,
      description: entry.data.description,
    })),
    fixed.components,
    ...components.map((meta) => ({
      path: `components/${slugOf(meta.name)}/`,
      title: `${meta.name} — rockaway`,
      description: meta.summary.replaceAll('`', ''),
    })),
    fixed.missing,
  ];
}

/** A page's card, under the base: `cards/foundations/grid.png`, `cards/index.png`. */
export function cardPath(path: string): string {
  const name = path.replace(/\.html$/, '').replace(/\/$/, '');
  return `cards/${name === '' ? 'index' : name}.png`;
}
