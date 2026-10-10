import { Button, Frame, SkipLink } from '@rockaway/react';
import type { ReactNode } from 'react';

/** Tab into the frame: the skip link shows on focus, and Enter jumps to Publish. */
export function Example(): ReactNode {
  return (
    <Frame title="editor" cols={34} rows={4}>
      <SkipLink target="publish">Skip to Publish</SkipLink>
      <Button id="publish">Publish</Button>
    </Frame>
  );
}
