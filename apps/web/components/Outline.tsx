/**
 * A page's outline, for the shell's outline pane: its sections, and the
 * sections within them, as links to places in the page.
 */
import { LinkTree } from '@rockaway/react/link-tree';
import type { ReactNode } from 'react';

export interface Section {
  readonly title: string;
  readonly href: string;
  readonly children: readonly { readonly title: string; readonly href: string }[];
}

export function Outline({ sections }: { readonly sections: readonly Section[] }): ReactNode {
  if (sections.length === 0) return null;
  return (
    <LinkTree
      items={sections.map((s) => ({ ...s, children: [...s.children] }))}
      currentKind="location"
    />
  );
}
