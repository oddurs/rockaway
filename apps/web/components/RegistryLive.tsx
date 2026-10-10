'use client';

/**
 * The registry's items (cairn 0046), each drawn by its own code and hydrated
 * as it nears the view, so what is drawn is what a reader copies in. Items
 * import each component from its own entry, so this loads what they use and
 * not the package.
 */
import type { ReactNode } from 'react';
import { deferred } from './Deferred.tsx';

const live: Readonly<Record<string, () => ReactNode>> = {
  'empty-state': deferred(() =>
    import('../registry/empty-state/empty-state.tsx').then((m) => m.EmptyState),
  ),
  'confirm-panel': deferred(() =>
    import('../registry/confirm-panel/confirm-panel.tsx').then((m) => m.ConfirmPanel),
  ),
  'file-browser': deferred(() =>
    import('../registry/file-browser/file-browser.tsx').then((m) => m.FileBrowser),
  ),
  'confirm-destructive': deferred(() =>
    import('../registry/confirm-destructive/confirm-destructive.tsx').then(
      (m) => m.ConfirmDestructive,
    ),
  ),
  'git-client': deferred(() =>
    import('../registry/git-client/git-client.tsx').then((m) => m.GitClient),
  ),
  top: deferred(() => import('../registry/top/top.tsx').then((m) => m.SystemMonitor)),
  settings: deferred(() => import('../registry/settings/settings.tsx').then((m) => m.Settings)),
};

export function RegistryItem({ name }: { readonly name: string }): ReactNode {
  const Item = live[name];
  if (!Item) throw new Error(`registry/${name} is not drawn by components/RegistryLive.tsx`);
  return <Item />;
}
