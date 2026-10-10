import { Keymap, KeymapHelp, useKeymap } from '@rockaway/react';
import { type ReactNode, useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  useKeymap([{ keys: 'g c', description: 'Count one more', action: () => setCount((c) => c + 1) }]);
  return <p>Pressed {count} times. Press g, then c.</p>;
}

export function Example(): ReactNode {
  return (
    <Keymap>
      <Counter />
      <KeymapHelp />
    </Keymap>
  );
}
