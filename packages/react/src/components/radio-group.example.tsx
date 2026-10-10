import { Radio, RadioGroup } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <RadioGroup label="Branch" defaultValue="main">
      <Radio value="main">main</Radio>
      <Radio value="develop">develop</Radio>
      <Radio value="release">release/0.1</Radio>
    </RadioGroup>
  );
}
