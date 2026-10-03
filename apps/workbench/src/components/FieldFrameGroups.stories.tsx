import { FieldError, FieldFrame, Form, Frame, fieldClass } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import {
  DateField,
  DateInput,
  DateSegment,
  Group,
  Input,
  NumberField,
} from 'react-aria-components';
import { expect, userEvent } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * FieldFrame inside React Aria fields whose input is a group of its own
 * (cairn 0204). NumberField and DateField hand that group's props, its
 * labelling and its press handling, to any Group beneath them. FieldFrame is
 * a Group, and those props are not its: the frame takes none of them and
 * passes them on to the group it frames, so each lands once, where React Aria
 * meant it to.
 */

const box: CSSProperties = {
  inlineSize: 'calc(12 * var(--rk-cell-width))',
  blockSize: 'var(--rk-cell-height)',
  padding: 0,
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  background: 'var(--rk-bg-subtle)',
};

function Page({ children }: { children?: ReactNode }): ReactNode {
  return (
    <Frame title="groups" cols={40} rows={11}>
      <Form>{children}</Form>
    </Frame>
  );
}

const meta = {
  title: 'Components/FieldFrame in groups',
  component: Page,
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The frame's own attributes, and what React Aria's group under it carries. */
function attributesOf(el: Element): Record<string, string | null> {
  return {
    role: el.getAttribute('role'),
    labelledby: el.getAttribute('aria-labelledby'),
    pressable: el.getAttribute('data-react-aria-pressable'),
    invalid: el.getAttribute('data-invalid'),
    disabled: el.getAttribute('data-disabled'),
  };
}

export const NumberAndDate: Story = {
  name: 'NumberField and DateField, framed',
  render: () => (
    <Page>
      <NumberField className={fieldClass()} isRequired isInvalid defaultValue={3}>
        {({ isRequired, isInvalid }) => (
          <>
            <FieldFrame label="Retries" isRequired={isRequired} isInvalid={isInvalid}>
              <Group>
                <Input style={box} />
              </Group>
            </FieldFrame>
            <FieldError>Too many.</FieldError>
          </>
        )}
      </NumberField>
      <DateField className={fieldClass()} isDisabled>
        {({ isDisabled }) => (
          <FieldFrame label="Due" isDisabled={isDisabled}>
            <DateInput style={{ display: 'flex' }}>
              {(segment) => <DateSegment segment={segment} />}
            </DateInput>
          </FieldFrame>
        )}
      </DateField>
    </Page>
  ),
  play: async ({ canvas, canvasElement }) => {
    await measured(document.body);
    const [retries, due] = [...canvasElement.querySelectorAll('.rk-field-frame')];
    if (!retries || !due) throw new Error('two frames');

    // NumberField: the frame is no group and takes no props of the field's;
    // React Aria's group under it is the group, and is invalid once.
    expect(attributesOf(retries)).toEqual({
      role: 'presentation',
      labelledby: null,
      pressable: null,
      invalid: 'true',
      disabled: null,
    });
    const numberGroup = retries.querySelector('.react-aria-Group') as Element;
    expect(attributesOf(numberGroup).role).toBe('group');
    expect(attributesOf(numberGroup).invalid).toBe('true');
    const input = canvas.getByRole('textbox', { name: 'Retries' });
    expect(input).toBeRequired();
    expect(retries.querySelector('.rk-frame .rk-row')?.textContent).toMatch(/^┏ Retries\* ━+┓$/);

    // DateField: its group's label and press handling land on the date input,
    // not on the frame around it.
    expect(attributesOf(due)).toEqual({
      role: 'presentation',
      labelledby: null,
      pressable: null,
      invalid: null,
      disabled: 'true',
    });
    const dateInput = due.querySelector('.react-aria-DateInput') as Element;
    expect(dateInput.getAttribute('role')).toBe('group');
    expect(dateInput.getAttribute('aria-labelledby')).not.toBeNull();
    expect(dateInput.getAttribute('data-react-aria-pressable')).not.toBeNull();
    expect(canvas.getByRole('group', { name: 'Due' })).toBe(dateInput);
    // Exactly one element is named Due, and one is labelled by the field.
    expect(canvas.getAllByRole('group', { name: 'Due' })).toHaveLength(1);
  },
};

/** The number group still steps from the keyboard: the field's handlers reached it. */
export const Stepping: Story = {
  render: () => (
    <Page>
      <NumberField className={fieldClass()} defaultValue={3}>
        <FieldFrame label="Retries">
          <Group>
            <Input style={box} />
          </Group>
        </FieldFrame>
      </NumberField>
    </Page>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const input = canvas.getByRole('textbox', { name: 'Retries' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveValue('5');
  },
};
