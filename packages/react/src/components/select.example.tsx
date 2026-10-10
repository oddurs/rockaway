import { OverlayLayer, Select, SelectItem } from '@rockaway/react';
import type { ReactNode } from 'react';

const THEMES = ['default', 'sunset', 'paper', 'ink'];

export function Example(): ReactNode {
  return (
    <OverlayLayer>
      <Select label="Theme" cols={16} defaultSelectedKey="default">
        {THEMES.map((theme) => (
          <SelectItem key={theme} id={theme}>
            {theme}
          </SelectItem>
        ))}
      </Select>
    </OverlayLayer>
  );
}
