import { Buffer, drawText, toText } from '@rockaway/grid';
import {
  Button,
  buttonBuffer,
  Description,
  FieldError,
  Fieldset,
  type FieldText,
  Form,
  Frame,
  fieldClass,
  fieldFrameBuffer,
  formBuffer,
  Label,
  useGlyphs,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  Input,
  Radio,
  RadioGroup,
  TextField,
  type TextFieldProps,
} from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * The field contract (cairn 0127), shown with fields sketched from its parts:
 * React Aria's own controls with our Label, Description and FieldError on
 * them, the way Text field, Checkbox and Radio group (0035, 0036, 0038) will
 * be built. The sketches are deliberately plain; what is under test is where
 * the parts sit, not the controls.
 */

/** A one-row text field: label, `[` input `]`, description, error. */
function SketchTextField({
  label,
  description,
  cols = 20,
  ...props
}: Omit<TextFieldProps, 'children' | 'className'> & {
  label: string;
  description?: string;
  cols?: number;
}): ReactNode {
  const { delimiter } = useGlyphs();
  const [open, close] = delimiter.control;
  const input: CSSProperties = {
    inlineSize: `calc(${cols} * var(--rk-cell-width))`,
    blockSize: 'var(--rk-cell-height)',
    padding: 0,
    margin: 0,
    border: 'none',
    font: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'var(--rk-bg-subtle)',
  };
  return (
    <TextField {...props} className={fieldClass()}>
      {({ isRequired }) => (
        <>
          <Label isRequired={isRequired}>{label}</Label>
          <span style={{ display: 'inline-flex' }}>
            <span aria-hidden="true">{open}</span>
            <Input style={input} />
            <span aria-hidden="true">{close}</span>
          </span>
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError />
        </>
      )}
    </TextField>
  );
}

/** A checkbox that carries its own words: `[✓] Sign commits`, in the control column. */
function SketchCheckbox({
  children,
  defaultSelected = false,
}: {
  children: string;
  defaultSelected?: boolean;
}): ReactNode {
  const { delimiter, mark } = useGlyphs();
  const [open, close] = delimiter.control;
  return (
    <CheckboxField className={fieldClass()} defaultSelected={defaultSelected}>
      <CheckboxButton>
        {({ isSelected }) => (
          <>
            <span aria-hidden="true">{`${open}${isSelected ? mark.check : mark.blank}${close}`}</span>
            {` ${children}`}
          </>
        )}
      </CheckboxButton>
    </CheckboxField>
  );
}

/** A radio group in a Fieldset, its legend set into the frame's edge. */
function SketchRadios({
  legend,
  isRequired = false,
}: {
  legend: string;
  isRequired?: boolean;
}): ReactNode {
  const { mark } = useGlyphs();
  const option = (value: string) => (
    <Radio value={value}>
      {({ isSelected }) => (
        <>
          <span aria-hidden="true">{isSelected ? mark.radio : mark['radio-empty']}</span>
          {` ${value}`}
        </>
      )}
    </Radio>
  );
  return (
    <RadioGroup className={fieldClass()} defaultValue="always" isRequired={isRequired}>
      {({ isRequired: required }) => (
        <Fieldset legend={legend} isRequired={required}>
          <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
            {option('always')}
            {option('never')}
          </div>
        </Fieldset>
      )}
    </RadioGroup>
  );
}

/** The form under test, on the page. */
function MixedForm(): ReactNode {
  return (
    <Form
      validationErrors={{ email: 'Enter an email address.' }}
      onSubmit={(e) => e.preventDefault()}
    >
      <SketchTextField label="Name" name="name" />
      <SketchTextField label="Email" name="email" isRequired description="Where the receipts go." />
      <SketchTextField label="Repository" name="repository" />
      <SketchCheckbox defaultSelected>Sign commits</SketchCheckbox>
      <SketchRadios legend="Notify" isRequired />
      <Button type="submit">Save</Button>
    </Form>
  );
}

/** The same form as text: what `formBuffer` says `MixedForm` should look like. */
function mixedModel(width: number): Buffer {
  const glyphs = themeGlyphs.default;
  const [open, close] = glyphs.delimiter.control;
  const line = (text: string) =>
    Buffer.create({ width: text.length, height: 1 }).draw((d) => {
      drawText(d, { x: 0, y: 0 }, text);
    });
  // An input's value is not text on the page, so the model's boxes are empty.
  const box = line(`${open}${' '.repeat(20)}${close}`);
  const fields: FieldText[] = [
    { label: 'Name', control: box },
    {
      label: 'Email',
      required: true,
      control: box,
      description: 'Where the receipts go.',
      error: 'Enter an email address.',
    },
    { label: 'Repository', control: box },
    { control: line(`${open}${glyphs.mark.check}${close} Sign commits`) },
    {
      control: (w) =>
        fieldFrameBuffer({ width: w, height: 3 }, { label: 'Notify', required: true }).draw((d) => {
          const row = `${glyphs.mark.radio} always  ${glyphs.mark['radio-empty']} never`;
          drawText(d, { x: 2, y: 1 }, row);
        }),
    },
    { control: buttonBuffer('Save') },
  ];
  return formBuffer(fields, { width });
}

/** The inside of a frame's screenshot: its rows and columns within the border and the pad. */
function inside(shot: string, cols: number): string {
  return shot
    .split('\n')
    .slice(1, -1)
    .map((row) =>
      [...row.padEnd(cols)]
        .slice(2, cols - 2)
        .join('')
        .trimEnd(),
    )
    .join('\n');
}

const meta = {
  title: 'Components/Form',
  component: Form,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const WIDE = 68;
const NARROW = 44;

/**
 * The artefact: a form of mixed fields, read back off the page, is the text
 * model cell for cell. Text fields, a checkbox, a fieldset and a button, and
 * every control starts in the same column of cells.
 */
export const MixedFields: Story = {
  name: 'Mixed fields, lined up',
  render: () => (
    <Frame title="new repository" cols={WIDE} rows={mixedModel(WIDE - 4).height + 2}>
      <MixedForm />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'new repository' });
    const page = inside(screenshot(frame, { legend: false }), WIDE);
    expect(page).toBe(toText(mixedModel(WIDE - 4)));
  },
};

/**
 * Both painters draw the same form: the same cells and the same text, the
 * model's, whatever strokes the frame around it. A form paints nothing of its
 * own; its fields' frames are each proved in their own files (0142).
 */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame
          key={painter}
          title={painter}
          painter={painter}
          cols={WIDE}
          rows={mixedModel(WIDE - 4).height + 2}
        >
          <MixedForm />
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const model = toText(mixedModel(WIDE - 4));
    for (const name of ['glyph', 'rule']) {
      const frame = canvas.getByRole('group', { name });
      expect(inside(screenshot(frame, { legend: false }), WIDE)).toBe(model);
    }
  },
};

/** Under 60 cells the same form stacks: each label on the row above its control. */
export const Stacked: Story = {
  name: 'Under 60 cells, stacked',
  render: () => (
    <Frame title="new repository" cols={NARROW} rows={mixedModel(NARROW - 4).height + 2}>
      <MixedForm />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'new repository' });
    const page = inside(screenshot(frame, { legend: false }), NARROW);
    expect(page).toBe(toText(mixedModel(NARROW - 4)));
    // The label column is gone: the label and its control start in the same cell.
    const field = canvas.getByRole('textbox', { name: 'Name' });
    const name = labelOf(field).getBoundingClientRect();
    const input = field.getBoundingClientRect();
    expect(Math.round(input.left - name.left)).toBe(
      Math.round(Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'))),
    );
    expect(input.top).toBeGreaterThan(name.top);
  },
};

/**
 * On submit, native validation: focus goes to the first invalid field, whose
 * description now holds its error, and nothing else announces it. That is the
 * error heard once, where the reader is.
 */
export const ErrorsOnSubmit: Story = {
  name: 'Errors on submit',
  render: () => (
    <Frame title="sign in" cols={56} rows={12}>
      <Form>
        <SketchTextField
          label="User"
          name="user"
          isRequired
          description="Your handle, not your email."
        />
        <SketchTextField label="Password" name="password" isRequired />
        <Button type="submit">Sign in</Button>
      </Form>
    </Frame>
  ),
  play: async ({ canvas, canvasElement }) => {
    const user = canvas.getByRole('textbox', { name: 'User' });
    const description = canvas.getByText('Your handle, not your email.');
    // The description is linked before anything has gone wrong.
    expect(user.getAttribute('aria-describedby')?.split(' ')).toContain(description.id);
    expect(user).toBeRequired();
    // No error rows until there is something to say.
    expect(canvasElement.querySelector('.rk-field-error')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(user).toHaveFocus());
    const errors = [...canvasElement.querySelectorAll<HTMLElement>('.rk-field-error')];
    expect(errors).toHaveLength(2);
    const [first] = errors;
    const ids = user.getAttribute('aria-describedby')?.split(' ') ?? [];
    // Described by its description, then its error: once each.
    expect(ids).toEqual([description.id, first?.id]);
    expect(user).toHaveAttribute('aria-invalid', 'true');
    // The cross is chrome: the words of the error hold no glyph.
    const mark = first?.querySelector('.rk-field-error-mark');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
    expect(first?.querySelector('.rk-field-error-message')?.textContent).not.toBe('');
    // Nothing on the form is a live region, so nothing says it a second time.
    expect(canvasElement.querySelector('[role="alert"], [aria-live], [role="status"]')).toBeNull();
  },
};

/**
 * Required, invalid and disabled, side by side with a field at rest: each
 * control starts in the same cell and is the same size in every state.
 */
export const States: Story = {
  render: () => (
    <Frame title="states" cols={64} rows={12}>
      <Form validationErrors={{ invalid: 'Not a branch name.' }}>
        <SketchTextField label="Rest" name="rest" />
        <SketchTextField label="Required" name="required" isRequired />
        <SketchTextField label="Invalid" name="invalid" />
        <SketchTextField
          label="Disabled"
          name="disabled"
          isDisabled
          description="Set by the server."
        />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const boxes = ['Rest', 'Required', 'Invalid', 'Disabled'].map((name) => {
      const box = canvas.getByRole('textbox', { name }).getBoundingClientRect();
      return { left: box.left, width: box.width, height: box.height };
    });
    for (const box of boxes) expect(box).toEqual(boxes[0]);

    // Required: the mark in the cell after the label, hidden from the name.
    const required = canvas.getByRole('textbox', { name: 'Required' });
    expect(required).toBeRequired();
    const mark = labelOf(required).querySelector('.rk-label-mark');
    expect(mark?.textContent).toBe(themeGlyphs.default.mark.required);
    expect(mark?.getAttribute('aria-hidden')).toBe('true');

    // Invalid: the error row, with the cross before it.
    expect(canvas.getByRole('textbox', { name: 'Invalid' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(canvas.getByText('Not a branch name.')).toBeVisible();

    // Disabled: the label dims.
    const disabled = canvas.getByRole('textbox', { name: 'Disabled' });
    const label = labelOf(disabled);
    expect(getComputedStyle(label).color).toBe(resolved('--rk-fg-disabled', label));
    // The description keeps its contrast: it is still help worth reading.
    const help = canvas.getByText('Set by the server.');
    expect(getComputedStyle(help).color).toBe(resolved('--rk-fg-muted', help));
    expect(disabled).toBeDisabled();
  },
};

/** A label column given in cells: labels longer than it wrap inside it. */
export const LabelWidth: Story = {
  name: 'Label width in cells',
  render: () => (
    <Frame title="commit" cols={64} rows={6}>
      <Form labelWidth={11}>
        <SketchTextField label="Branch" name="branch" cols={16} />
        <SketchTextField label="Commit message" name="message" cols={16} />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'commit' });
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    for (const name of ['Branch', 'Commit message']) {
      const input = canvas.getByRole('textbox', { name }).getBoundingClientRect();
      const origin = frame.getBoundingClientRect();
      // Border, pad, eleven cells of label column, then the delimiter.
      expect(Math.round((input.left - origin.left) / cell)).toBe(2 + 11 + 1);
    }
  },
};

/** The same form at every density: taller cells, the same columns. */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={WIDE} rows={mixedModel(WIDE - 4).height + 2}>
            <MixedForm />
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const frame = canvas.getByRole('group', { name: density });
      expect(inside(screenshot(frame, { legend: false }), WIDE)).toBe(toText(mixedModel(WIDE - 4)));
    }
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="new repository" cols={WIDE} rows={mixedModel(WIDE - 4).height + 2}>
      <MixedForm />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const error = canvas.getByText('Enter an email address.');
    expect(getComputedStyle(error).color).toBe(resolved('--rk-fg-danger', error));
  },
};

/**
 * Forced colors: the reader's palette replaces ours. Required is still a
 * mark, invalid still a cross and a heavier frame, disabled the reader's grey.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={WIDE} rows={14}>
      <Form validationErrors={{ email: 'Enter an email address.' }}>
        <SketchTextField label="Email" name="email" isRequired />
        <SketchTextField label="Disabled" name="disabled" isDisabled />
        <RadioGroup className={fieldClass()} isInvalid defaultValue="always">
          <Fieldset legend="Notify">
            <Radio value="always">always</Radio>
          </Fieldset>
          <FieldError>Pick one.</FieldError>
        </RadioGroup>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const label = labelOf(canvas.getByRole('textbox', { name: 'Disabled' }));
    expect(getComputedStyle(label).color).toBe(resolved('GrayText', label));
    const email = labelOf(canvas.getByRole('textbox', { name: 'Email' }));
    expect(email.querySelector('.rk-label-mark')?.textContent).toBe('*');
    const mark = canvas.getByText('Enter an email address.').previousElementSibling;
    expect(mark?.textContent).toBe(themeGlyphs.default.mark.cross);
    // The invalid fieldset's frame is drawn heavy, which no palette can undo.
    const group = canvas.getByRole('radiogroup', { name: 'Notify' });
    expect(group.querySelector('.rk-frame')?.textContent).toContain('┏');
  },
};

/** The label React Aria linked to a control. */
function labelOf(control: HTMLElement): HTMLLabelElement {
  const label = (control as HTMLInputElement).labels?.[0];
  if (!label) throw new Error('the control has no label');
  return label;
}

/** What a semantic token (or a system colour) resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}
