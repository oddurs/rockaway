'use client';

import { KeyHint } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <p>
      <KeyHint keys="mod+s">save</KeyHint> <KeyHint keys="esc">close</KeyHint>
    </p>
  );
}
