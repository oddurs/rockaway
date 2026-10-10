'use client';

import { Form, TextField } from '@rockaway/react';
import type { ReactNode } from 'react';

export function Example(): ReactNode {
  return (
    <Form>
      <TextField label="Name" />
      <TextField label="Email" isRequired description="Where the receipts go." />
      <TextField label="Message" multiline rows={2} />
    </Form>
  );
}
