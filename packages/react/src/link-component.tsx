'use client';

/**
 * A way for the app to supply a custom link component that Link, TreeItem, and
 * other link-rendering components use. This enables client-side routing
 * (e.g., Next.js Link with prefetch) while keeping components framework-free.
 *
 * Without a supplied component, links render as regular `<a>` tags, which works
 * on the server and without JavaScript.
 *
 * cairn 0300: render every link through the app's own link.
 */

import { createContext, type ReactNode, useContext } from 'react';

/**
 * A link component that the app supplies. It receives the same props as an
 * `<a>` tag and renders a link. The app can use this to integrate with
 * frameworks like Next.js.
 *
 * Example with Next.js Link:
 *
 *   import Link from 'next/link';
 *   <LinkComponentProvider component={Link}>
 *     <YourApp />
 *   </LinkComponentProvider>
 */
export type LinkComponent = React.ComponentType<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly children?: ReactNode;
  }
>;

/**
 * Context to provide a custom link component to the app. If not provided,
 * links render as regular `<a>` tags.
 */
const LinkComponentContext = createContext<LinkComponent | undefined>(undefined);

export interface LinkComponentProviderProps {
  readonly component: LinkComponent;
  readonly children: ReactNode;
}

/**
 * Provide a custom link component for the app. All links inside will use this
 * component instead of regular `<a>` tags.
 *
 *   import Link from 'next/link';
 *   export default function App({ children }: { children: React.ReactNode }) {
 *     return (
 *       <LinkComponentProvider component={Link}>
 *         {children}
 *       </LinkComponentProvider>
 *     );
 *   }
 */
export function LinkComponentProvider({ component, children }: LinkComponentProviderProps): ReactNode {
  return (
    <LinkComponentContext.Provider value={component}>
      {children}
    </LinkComponentContext.Provider>
  );
}

/**
 * Use the custom link component if one was provided, otherwise return the
 * default `<a>` tag component.
 */
export function useLinkComponent(): LinkComponent {
  const component = useContext(LinkComponentContext);
  if (component) return component;
  // Default to regular <a> tag
  return 'a' as unknown as LinkComponent;
}
