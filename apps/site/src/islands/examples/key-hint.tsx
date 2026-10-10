import { KeyHint } from '@rockaway/react';

export function Example() {
  return (
    <p>
      <KeyHint keys="mod+s">save</KeyHint> <KeyHint keys="esc">close</KeyHint>
    </p>
  );
}
