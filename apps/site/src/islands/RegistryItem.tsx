/**
 * A registry item (cairn 0046), drawn and hydrated as the code a reader copies
 * in: the item's own module, its named component, with its defaults. Items
 * import each component from its own entry, so this ships what they use and
 * not the package.
 */
import type { ComponentType, ReactNode } from 'react';

const modules = import.meta.glob<Record<string, ComponentType>>('../registry/*/*.tsx', {
  eager: true,
});

export function RegistryItem({ file, component }: { file: string; component: string }): ReactNode {
  const Component = modules[`../registry/${file}`]?.[component];
  if (!Component) throw new Error(`src/registry/${file} does not export ${component}`);
  return <Component />;
}
