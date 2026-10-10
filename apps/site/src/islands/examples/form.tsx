import { Form, TextField } from '@rockaway/react';

export function Example() {
  return (
    <Form>
      <TextField label="Name" isRequired description="As it appears on the commit." />
      <TextField label="Email" description="Where the receipts go." />
    </Form>
  );
}
