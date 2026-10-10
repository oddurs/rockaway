/**
 * A page's outline, for the shell's outline pane: its sections, and the
 * sections within them, as links to places in the page. A page with none
 * renders nothing, and the stylesheet gives its column to the page.
 */
import type { ReactNode } from 'react';
import { SiteTree } from './shell/SiteTree.tsx';

export interface Section {
  readonly title: string;
  readonly href: string;
  readonly children: readonly { readonly title: string; readonly href: string }[];
}

export function Outline({ sections }: { readonly sections: readonly Section[] }): ReactNode {
  if (sections.length === 0) return null;
  return <SiteTree items={sections} />;
}
