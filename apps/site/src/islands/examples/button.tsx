import { Button } from '@rockaway/react';

export function Example() {
  return (
    <p>
      <Button variant="fill" keys="mod+s">
        Publish
      </Button>{' '}
      <Button>Preview</Button> <Button variant="danger">Discard</Button>
    </p>
  );
}
