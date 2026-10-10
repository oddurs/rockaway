import { Badge } from '@rockaway/react';

export function Example() {
  return (
    <p>
      The build is <Badge tone="success">passing</Badge> on main and{' '}
      <Badge tone="danger">failing</Badge> on the branch.
    </p>
  );
}
