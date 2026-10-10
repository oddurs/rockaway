/**
 * Every page of the site, with its title and description (cairn 0150): what
 * the sitemap lists, what each social card draws and what each page's
 * metadata says, read from one place so a card never says something its page
 * does not. Server only.
 */
import type { Metadata } from 'next';
import { components, slugOf } from './components.ts';
import { docs } from './docs.ts';
import { absolute, asset } from './paths.ts';

export interface Page {
  /** Where it is, under the base, with no leading slash: `''` for home. */
  readonly path: string;
  /** As the tab says it, before ` — rockaway`. */
  readonly title: string;
  readonly description: string;
}

/** The pages whose words are no collection's. */
export const fixed = {
  home: {
    path: '',
    title: 'rockaway — terminal interfaces on the web',
    description:
      'A design system for terminal interfaces on the web. Every box is drawn on a grid of character cells, and every page is still a web page.',
  },
  components: {
    path: 'components/',
    title: 'Components',
    description:
      'Every component in @rockaway/react, each with its snapshot, a live example, its props, states, keyboard map and tokens, generated from its metadata.',
  },
  registry: {
    path: 'registry/',
    title: 'Registry',
    description:
      "Compositions you copy into your app and change: empty states, confirmations, panes. In shadcn's format, so its CLI installs them.",
  },
  missing: {
    path: '404.html',
    title: 'Not here',
    description: 'There is no page at this address. The map goes everywhere there is one.',
  },
} as const satisfies Record<string, Page>;

/** Every page, in the order the map shows them. */
export function allPages(): readonly Page[] {
  return [
    fixed.home,
    ...Object.entries(docs).map(([id, doc]) => ({
      path: `${id}/`,
      title: doc.title,
      description: doc.description,
    })),
    fixed.registry,
    fixed.components,
    ...components.map((meta) => ({
      path: `components/${slugOf(meta.name)}/`,
      title: meta.name,
      description: meta.summary.replaceAll('`', ''),
    })),
    fixed.missing,
  ];
}

/** A page's card, under the base: `cards/components/tree.png`, `cards/index.png`. */
export function cardPath(path: string): string {
  const name = path.replace(/\.html$/, '').replace(/\/$/, '');
  return `cards/${name === '' ? 'index' : name}.png`;
}

/** What the card and the tab call a page: home has its own title, every other is `X — rockaway`. */
export function fullTitle(page: Page): string {
  return page.path === '' ? page.title : `${page.title} — rockaway`;
}

/**
 * A page's metadata: its title and description, its address, and its card
 * for Open Graph and for the cards a chat draws.
 */
export function pageMetadata(path: string): Metadata {
  const page = allPages().find((p) => p.path === path);
  if (!page) throw new Error(`no page at ${path}: add it to lib/pages.ts`);
  const image = { url: absolute(cardPath(path)), width: 1200, height: 630, alt: fullTitle(page) };
  return {
    title: path === '' ? { absolute: page.title } : page.title,
    description: page.description,
    ...(path.endsWith('.html') ? {} : { alternates: { canonical: asset(path) } }),
    openGraph: {
      type: 'website',
      siteName: 'rockaway',
      title: fullTitle(page),
      description: page.description,
      url: absolute(path),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle(page),
      description: page.description,
      images: [image.url],
    },
  };
}
