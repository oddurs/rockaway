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
  /** A section with no page of its own has none: its row opens and closes it. */
  readonly href?: string;
  readonly children?: readonly NavNode[];
}

export interface SitePages {
  readonly foundations: readonly { readonly id: string; readonly title: string }[];
  readonly components: readonly { readonly slug: string; readonly name: string }[];
}

/** The tree, given the pages the collections hold. */
export function siteNav({ foundations, components }: SitePages): readonly NavNode[] {
  return [
    { id: 'home', title: 'Home', href: href('') },
    {
      id: 'guides',
      title: 'Guides',
      children: [
        { id: 'getting-started', title: 'Getting started', href: href('getting-started/') },
        { id: 'concept', title: 'The concept', href: href('concept/') },
        { id: 'component-recipe', title: 'The component recipe', href: href('component-recipe/') },
      ],
    },
    ...(foundations.length === 0
      ? []
      : [
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
        ]),
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

/** Every row of the tree, depth first. */
export function flatten(nodes: readonly NavNode[]): NavNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
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
  if (top === undefined) return 'ROCKAWAY';
  return 'GUIDE';
}
