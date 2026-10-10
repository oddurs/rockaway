import { Frame, Text } from '@rockaway/react';

export function Example() {
  return (
    <Frame title="text" cols={40} rows={7}>
      <Text size={2} as="h2">
        Install
      </Text>
      <p>
        <Text size={3} inline>
          npm
        </Text>{' '}
        i @rockaway/react
      </p>
    </Frame>
  );
}
