import { Description, FieldError, Form, fieldClass, Label } from '@rockaway/react';
import { Input, TextField } from 'react-aria-components';

export function Example() {
  return (
    <Form>
      <TextField className={fieldClass()} isRequired>
        {({ isRequired }) => (
          <>
            <Label isRequired={isRequired}>Name</Label>
            <Input />
            <Description>As it appears on the commit.</Description>
            <FieldError />
          </>
        )}
      </TextField>
    </Form>
  );
}
