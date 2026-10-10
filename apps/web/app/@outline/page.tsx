import type { ReactNode } from 'react';
import { Outline } from '../../components/Outline.tsx';

/** Home's sections. */
export default function HomeOutline(): ReactNode {
  return (
    <Outline
      sections={[
        { title: 'Software, not pages', href: '#software', children: [] },
        { title: 'Forms on the grid', href: '#forms', children: [] },
        { title: 'Data, in columns', href: '#data', children: [] },
        { title: 'Three rules', href: '#rules', children: [] },
        { title: 'Ten lines', href: '#code', children: [] },
        { title: 'Install', href: '#install', children: [] },
      ]}
    />
  );
}
