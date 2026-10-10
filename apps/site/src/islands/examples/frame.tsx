import { Frame } from '@rockaway/react';

export function Example() {
  return (
    <Frame title="tokens" cols={32} rows={5} dividers={[2]}>
      <p>fg.default</p>
      <p>fg.muted</p>
    </Frame>
  );
}
