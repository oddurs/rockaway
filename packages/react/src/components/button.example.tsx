import { Button } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <p>
      <Button variant="fill" keys="mod+s">
        Publish
      </Button>{' '}
      <Button>Preview</Button> <Button variant="danger">Discard</Button>
    </p>
  );
}
