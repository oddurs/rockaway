import { Form, TextField } from '@rockaway/react';

export function Example() {
  return (
    <Form>
      <TextField label="Name" />
      <TextField label="Email" isRequired description="Where the receipts go." />
      <TextField label="Message" multiline rows={2} />
    </Form>
  );
}
