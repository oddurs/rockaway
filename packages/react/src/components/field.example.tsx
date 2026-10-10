import { Form, TextField } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Form>
      <TextField label="Name" isRequired description="As it appears on the commit." />
      <TextField label="Email" description="Where the receipts go." />
    </Form>
  );
}
