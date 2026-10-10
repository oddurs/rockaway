'use client';

import { Fieldset, fieldClass, useGlyphs } from '@rockaway/react';
import type { ReactNode } from 'react';
import { Radio, RadioGroup } from 'react-aria-components';

export function Example(): ReactNode {
  const { delimiter, mark } = useGlyphs();
  const [open, close] = delimiter.control;
  const option = (value: string) => (
    <Radio value={value}>
      {({ isSelected }) => (
        <>
          <span aria-hidden="true">{`${open}${isSelected ? mark.radio : mark['radio-empty']}${close}`}</span>
          {` ${value}`}
        </>
      )}
    </Radio>
  );
  return (
    <RadioGroup className={fieldClass()} defaultValue="main">
      <Fieldset legend="Branch">
        {option('main')}
        {option('develop')}
      </Fieldset>
    </RadioGroup>
  );
}
