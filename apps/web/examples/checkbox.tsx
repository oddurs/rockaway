'use client';

import { Checkbox, CheckboxGroup, Form } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Form>
      <CheckboxGroup label="Branches" defaultValue={['main']} description="Where the hooks run.">
        <Checkbox value="main">main</Checkbox>
        <Checkbox value="develop">develop</Checkbox>
      </CheckboxGroup>
      <Checkbox defaultSelected>Sign commits</Checkbox>
    </Form>
  );
}
