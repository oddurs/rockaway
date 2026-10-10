import { Switch } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Switch defaultSelected>Wrap lines</Switch>
      <Switch>Show hidden files</Switch>
    </div>
  );
}
