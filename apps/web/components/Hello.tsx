'use client';

/** What home's ten lines draw, and the install line in its frame (cairn 0108). */
import { Button, Frame } from '@rockaway/react';
import type { ReactNode } from 'react';

export const INSTALL = 'npm install @rockaway/react @rockaway/css @rockaway/tokens';

export function Hello(): ReactNode {
  return (
    <Frame title="hello" cols={32} rows={5}>
      <p>A screen, in cells.</p>
      <Button>Continue</Button>
    </Frame>
  );
}

export function Install(): ReactNode {
  return (
    <Frame title="install" cols={INSTALL.length + 6} rows={3} pad={{ x: 2, y: 0 }}>
      <code>{INSTALL}</code>
    </Frame>
  );
}
