import { CodeBlock } from '@rockaway/react';

const code = `const greeting = "Hello, world!";
console.log(greeting);`;

export function Example() {
  return <CodeBlock language="javascript" title="Example code" code={code} />;
}
