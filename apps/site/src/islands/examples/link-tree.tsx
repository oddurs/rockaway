import { LinkTree } from '@rockaway/react';

const site = [
  { title: 'Home', href: '#home' },
  {
    title: 'Foundations',
    href: '#foundations',
    children: [
      { title: 'The grid', href: '#grid' },
      { title: 'Glyphs', href: '#glyphs' },
    ],
  },
  { title: 'Components', href: '#components' },
];

export function Example() {
  return (
    <nav aria-label="Example site">
      <LinkTree items={site} current="#grid" />
    </nav>
  );
}
