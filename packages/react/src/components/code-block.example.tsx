import { CodeBlock } from '@rockaway/react';
import type { ReactNode } from 'react';

const CODE = `export function Greeting() {
  return <Frame title="hello">
    Rockaway
  </Frame>;
}`;

export function Example(): ReactNode {
  return <CodeBlock code={CODE} title="greeting.tsx" lang="tsx" lineNumbers cols={34} />;
}
