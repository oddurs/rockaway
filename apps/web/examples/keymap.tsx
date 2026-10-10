'use client';

import { Keymap, KeymapHelp, useKeymap } from '@rockaway/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  useKeymap([{ keys: 'c c', description: 'Count one more', action: () => setCount((c) => c + 1) }]);
  return <p>Pressed {count} times. Press c twice.</p>;
}

export function Example(): ReactNode {
  return (
    <Keymap>
      <Counter />
      <KeymapHelp />
    </Keymap>
  );
}
