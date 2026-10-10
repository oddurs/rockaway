import { ComboBox, ComboBoxItem, OverlayLayer } from '@rockaway/react';
import type { ReactNode } from 'react';

const AUTHORS = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Margaret Hamilton'];

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <ComboBox label="Author" cols={20} placeholder="Find an author">
        {AUTHORS.map((name) => (
          <ComboBoxItem key={name} id={name}>
            {name}
          </ComboBoxItem>
        ))}
      </ComboBox>
    </OverlayLayer>
  );
}
