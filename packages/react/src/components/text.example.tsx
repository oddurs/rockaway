import { Frame, Text } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    // A heading two rows tall, then a line three rows tall whose ordinary
    // words sit on its last row: five rows inside the frame's border.
    <Frame title="text" cols={40} rows={7}>
      <Text size={2} as="h2">
        Install
      </Text>
      <p style={{ margin: 0 }}>
        <Text size={3} inline>
          npm
        </Text>{' '}
        i @rockaway/react
      </p>
    </Frame>
  );
}
