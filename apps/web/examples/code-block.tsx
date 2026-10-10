'use client';

import { CodeBlock } from '@rockaway/react';

const CODE = `export function Greeting() {
  return <Frame title="hello">
    Rockaway
  </Frame>;
}`;

export function Example() {
  return <CodeBlock code={CODE} title="greeting.tsx" lang="tsx" lineNumbers cols={34} />;
}
