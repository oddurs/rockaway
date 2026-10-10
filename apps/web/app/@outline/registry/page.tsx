import type { ReactNode } from 'react';
import { Outline } from '../../../components/Outline.tsx';
import { items } from '../../../registry/items.ts';

/** The registry's items. */
export default function RegistryOutline(): ReactNode {
  return (
    <Outline
      sections={items.map((item) => ({ title: item.title, href: `#${item.name}`, children: [] }))}
    />
  );
}
