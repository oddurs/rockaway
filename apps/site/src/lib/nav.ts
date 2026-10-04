/**
 * The site's map (cairn 0104): every page, in the order the navigation tree
 * shows it, and the keys that jump to the sections.
 *
 * It is plain data, so the shell's island can take it as a prop and the tests
 * can read it. Every row is a page with an `href`, a section included, so
 * every place in the tree is an ordinary link.
 */
import { href } from './paths.ts';

export interface NavNode {
  /** Unique in the tree. */
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly children?: readonly NavNode[];
}

/** A section a `g` sequence jumps to: `g` then `key`. */
export interface Jump {
  readonly key: string;
  readonly title: string;
  readonly href: string;
}

export interface SitePages {
  readonly foundations: readonly { readonly id: string; readonly title: string }[];
  readonly components: readonly { readonly slug: string; readonly name: string }[];
}

/** The tree, given the pages the collections hold. */
export function siteNav({ foundations, components }: SitePages): readonly NavNode[] {
  return [
    { id: 'home', title: 'Home', href: href('') },
    { id: 'getting-started', title: 'Getting started', href: href('getting-started/') },
    { id: 'concept', title: 'The concept', href: href('concept/') },
    {
      id: 'foundations',
      title: 'Foundations',
      href: href('foundations/'),
      children: foundations.map((page) => ({
        id: `foundations/${page.id}`,
        title: page.title,
        href: href(`foundations/${page.id}/`),
      })),
    },
    {
      id: 'components',
      title: 'Components',
      href: href('components/'),
      children: components.map((c) => ({
        id: `components/${c.slug}`,
        title: c.name,
        href: href(`components/${c.slug}/`),
      })),
    },
  ];
}

/** `g` then a letter. Each is also a row of the tree, so each is a link too. */
export function siteJumps(): readonly Jump[] {
  return [
    { key: 'h', title: 'Home', href: href('') },
    { key: 's', title: 'Getting started', href: href('getting-started/') },
    { key: 'd', title: 'The concept', href: href('concept/') },
    { key: 'f', title: 'Foundations', href: href('foundations/') },
    { key: 'c', title: 'Components', href: href('components/') },
  ];
}

/** The rows from the top of the tree down to the one at `current`, or nothing. */
export function trail(nodes: readonly NavNode[], current: string): readonly NavNode[] {
  for (const node of nodes) {
    if (node.href === current) return [node];
    const below = trail(node.children ?? [], current);
    if (below.length > 0) return [node, ...below];
  }
  return [];
}

/** What the status bar's mode segment says on a page: the part of the site it is in. */
export function modeOf(path: readonly NavNode[]): string {
  const top = path[0]?.id;
  if (top === 'home') return 'HOME';
  if (top === 'foundations' || top === 'components') return top.toUpperCase();
  return 'GUIDE';
}
