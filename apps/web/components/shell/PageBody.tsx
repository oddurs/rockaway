/**
 * A page in the page's pane (cairn 0104): its border, titled with the page's
 * name, and its own scroller. Every page brings its own, so a new page starts
 * at its top, and the pane's title is the page's from the server's first
 * byte, with no script to set it.
 */
import type { ReactNode } from 'react';
import { PaneChrome } from './PaneChrome.tsx';

export function PageBody({
  title,
  children,
}: {
  /** The page's name, in the pane's top border. */
  readonly title: string;
  readonly children: ReactNode;
}): ReactNode {
  return (
    <>
      <PaneChrome title={title} />
      <div className="rk-scroll site-scroll site-page" data-site-scroll="page">
        {children}
      </div>
    </>
  );
}
