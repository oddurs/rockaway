import { CodeBlock } from '@rockaway/react';

const code = [
  "import { Frame } from '@rockaway/react';",
  '',
  'export const panel = <Frame title="tokens" />;',
].join('\n');

export function Example() {
  return <CodeBlock code={code} lang="tsx" title="panel.tsx" lineNumbers />;
}
