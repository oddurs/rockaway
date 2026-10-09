import { toText } from '@rockaway/grid';
import {
  FieldError,
  FieldFrame,
  Fieldset,
  Form,
  Frame,
  fieldClass,
  fieldFrameBuffer,
  GlyphProvider,
  Label,
  useGlyphs,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  CheckboxGroup,
  Input,
  Radio,
  RadioGroup,
  TextArea,
  TextField,
} from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * FieldFrame and Fieldset (cairn 0127): a label set into a frame's top edge,
 * shown with groups and a framed control sketched from React Aria's own
 * controls, the way Checkbox, Radio group and Text field (0036, 0038, 0035)
 * will be built.
 */

const field: CSSProperties = {
  inlineSize: 'calc(16 * var(--rk-cell-width))',
  blockSize: 'var(--rk-cell-height)',
  padding: 0,
  margin: 0,
  border: 'none',
  font: 'inherit',
  lineHeight: 'inherit',
  color: 'inherit',
  background: 'var(--rk-bg-subtle)',
};

function Checkboxes({ isInvalid = false, isDisabled = false, isRequired = false }): ReactNode {
  const { delimiter, mark } = useGlyphs();
  const [open, close] = delimiter.control;
  const box = (value: string) => (
    <CheckboxField value={value} className={fieldClass()}>
      <CheckboxButton>
        {({ isSelected }) => (
          <>
            <span aria-hidden="true">{`${open}${isSelected ? mark.check : mark.blank}${close}`}</span>
            {` ${value}`}
          </>
        )}
      </CheckboxButton>
    </CheckboxField>
  );
  return (
    <CheckboxGroup
      className={fieldClass()}
      defaultValue={['main']}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      isRequired={isRequired}
    >
      {({ isRequired: required }) => (
        <>
          <Fieldset legend="Branches" isRequired={required}>
            {box('main')}
            {box('develop')}
          </Fieldset>
          <FieldError>Pick at least one.</FieldError>
        </>
      )}
    </CheckboxGroup>
  );
}

/** The cell size a screen measured, read off the screen itself. */
function cellOf(screen: Element): number {
  return Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-width'));
}

/** The painted top edge of the frame inside a group. */
function edge(group: Element): string {
  return group.querySelector('.rk-frame .rk-row')?.textContent ?? '';
}

const meta = {
  title: 'Components/Fieldset',
  component: Fieldset,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The legend is the group's name. On its own, the fieldset is the group;
 * around a React Aria radio or checkbox group, that group keeps its role and
 * the legend becomes its label. Either way the name holds no glyph.
 */
export const Legend: Story = {
  name: 'The legend is the name',
  args: { legend: 'Address' },
  render: () => (
    <Frame title="legend" cols={48} rows={17}>
      <Form>
        <Fieldset legend="Address">
          <TextField className={fieldClass()}>
            <Label>Street</Label>
            <Input style={field} />
          </TextField>
          <TextField className={fieldClass()}>
            <Label>Postcode</Label>
            <Input style={field} />
          </TextField>
        </Fieldset>
        <RadioGroup className={fieldClass()} defaultValue="main">
          <Fieldset legend="Branch">
            <Radio value="main">main</Radio>
          </Fieldset>
        </RadioGroup>
        <Checkboxes />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const address = canvas.getByRole('group', { name: 'Address' });
    // Named by a real label with the legend's words, and nothing else.
    const id = address.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(id)?.textContent).toBe('Address');
    // The frame and the legend drawn into it are chrome.
    const chrome = address.querySelector('.rk-frame');
    expect(chrome?.getAttribute('aria-hidden')).toBe('true');
    expect(edge(address)).toMatch(/^┌ Address ─+┐$/);

    // Inside a radio group: one group, the radiogroup, named by the legend.
    const branch = canvas.getByRole('radiogroup', { name: 'Branch' });
    expect(branch.querySelector('[role="group"]')).toBeNull();
    expect(edge(branch)).toMatch(/^┌ Branch ─+┐$/);

    // Inside a checkbox group: the group, named by the legend.
    const branches = canvas.getByRole('group', { name: 'Branches' });
    expect(branches.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect(canvas.getByRole('checkbox', { name: 'main' })).toBeChecked();

    // The fields inside the fieldset line up with each other.
    const street = canvas.getByRole('textbox', { name: 'Street' }).getBoundingClientRect();
    const postcode = canvas.getByRole('textbox', { name: 'Postcode' }).getBoundingClientRect();
    expect(street.left).toBe(postcode.left);
  },
};

/**
 * Fields in a fieldset line up as a form's do, inside the frame, and stack as
 * a form's do when the fieldset is under 60 cells.
 */
export const Fields: Story = {
  name: 'Fields inside, lined up',
  args: { legend: 'Address' },
  render: () => (
    <Frame title="fields" cols={70} rows={6}>
      <Fieldset legend="Address">
        <TextField className={fieldClass()}>
          <Label>Street</Label>
          <Input style={field} />
        </TextField>
        <TextField className={fieldClass()} isRequired>
          {({ isRequired }) => (
            <>
              <Label isRequired={isRequired}>Postcode</Label>
              <Input style={field} />
            </>
          )}
        </TextField>
      </Fieldset>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'fields' });
    // The fieldset's own chrome, read back where it sits inside the frame's.
    expect(`\n${screenshot(frame, { legend: false })}`).toBe(`
┌ fields ────────────────────────────────────────────────────────────┐
│ ┌ Address ───────────────────────────────────────────────────────┐ │
│ │ Street                                                         │ │
│ │ Postcode*                                                      │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘`);
    const street = canvas.getByRole('textbox', { name: 'Street' }).getBoundingClientRect();
    const postcode = canvas.getByRole('textbox', { name: 'Postcode' }).getBoundingClientRect();
    expect(street.left).toBe(postcode.left);
    // Postcode, its mark cell and two of air: the controls start at cell 15.
    const origin = frame.getBoundingClientRect();
    expect(Math.round((street.left - origin.left) / cellOf(frame))).toBe(4 + 11);
  },
};

/**
 * Every state, from the group around it: required puts the mark after the
 * legend, invalid makes the line heavy in border.danger, disabled dims. The
 * frame is the same size in every one.
 */
export const States: Story = {
  args: { legend: 'Branches' },
  render: () => (
    <Frame title="states" cols={36} rows={22}>
      <Form>
        <Checkboxes />
        <Checkboxes isRequired />
        <Checkboxes isInvalid />
        <Checkboxes isDisabled />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const [rest, required, invalid, disabled] = canvas.getAllByRole('group', { name: 'Branches' });
    if (!rest || !required || !invalid || !disabled) throw new Error('four groups');
    const sizes = [rest, required, invalid, disabled].map((g) => {
      const box = g.querySelector('.rk-field-frame')?.getBoundingClientRect();
      return [box?.width, box?.height];
    });
    for (const size of sizes) expect(size).toEqual(sizes[0]);

    expect(edge(rest)).toMatch(/^┌ Branches ─+┐$/);
    expect(edge(required)).toMatch(/^┌ Branches\* ─+┐$/);
    expect(edge(invalid)).toMatch(/^┏ Branches ━+┓$/);
    expect(edge(disabled)).toMatch(/^┌ Branches ─+┐$/);

    // The mark is chrome: the required group is still named "Branches", which
    // is how all four were found above.
    expect(required.querySelector('.rk-frame')?.getAttribute('aria-hidden')).toBe('true');
    // Invalid: the frame's colour is the state's, and the error row is there.
    const frame = (g: Element) => g.querySelector('.rk-field-frame .rk-frame') as Element;
    expect(getComputedStyle(frame(invalid)).color).toBe(
      resolved('--rk-border-danger', frame(invalid)),
    );
    expect(invalid.querySelector('.rk-field-error')).not.toBeNull();
    // Disabled: the frame dims, and so do its words.
    expect(getComputedStyle(frame(disabled)).color).toBe(
      resolved('--rk-fg-disabled', frame(disabled)),
    );
    expect(canvas.getAllByRole('checkbox', { name: 'main' }).at(-1)).toBeDisabled();
  },
};

/** A framed control: an `lg` text field's frame goes heavy, in border.focus, while it has focus. */
export const FramedControl: Story = {
  name: 'A framed control',
  args: { legend: 'Message' },
  render: () => (
    <Frame title="framed" cols={40} rows={8}>
      <Form>
        <TextField className={fieldClass()} isRequired>
          {({ isRequired, isInvalid }) => (
            <FieldFrame label="Message" isRequired={isRequired} isInvalid={isInvalid}>
              {/* A textarea scrolls, so the browser draws no bar of its own (0207). */}
              <TextArea
                rows={2}
                className="rk-scroll"
                style={{
                  ...field,
                  inlineSize: '100%',
                  blockSize: 'calc(2 * var(--rk-cell-height))',
                  resize: 'none',
                  display: 'block',
                }}
              />
            </FieldFrame>
          )}
        </TextField>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const message = canvas.getByRole('textbox', { name: 'Message' });
    const frame = message.closest('.rk-field-frame') as HTMLElement;
    // No group of its own: the text field is the thing a reader meets.
    expect(frame.getAttribute('role')).toBe('presentation');
    expect(edge(frame)).toMatch(/^┌ Message\* ─+┐$/);
    const size = frame.getBoundingClientRect();

    await userEvent.tab();
    expect(message).toHaveFocus();
    await waitFor(() => expect(edge(frame)).toMatch(/^┏ Message\* ━+┓$/));
    const ink = frame.querySelector('.rk-frame') as Element;
    expect(getComputedStyle(ink).color).toBe(resolved('--rk-border-focus', ink));
    // Heavier, and not one cell bigger.
    const focused = frame.getBoundingClientRect();
    expect([focused.width, focused.height]).toEqual([size.width, size.height]);
    await userEvent.tab();
    await waitFor(() => expect(edge(frame)).toMatch(/^┌ Message\* ─+┐$/));
  },
};

/** Both painters draw the same cells: the edge is the buffer, cell for cell. */
export const Painters: Story = {
  args: { legend: 'Notify' },
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame key={painter} title={painter} cols={28} rows={5}>
          <Fieldset legend="Notify" painter={painter}>
            <span>always</span>
          </Fieldset>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const shots = ['glyph', 'rule'].map((painter) =>
      screenshot(canvas.getByRole('group', { name: painter }), { legend: false })
        .split('\n')
        .slice(1, 4)
        .map((row) => row.slice(2, 26))
        .join('\n'),
    );
    expect(shots[0]).toBe(shots[1]);
    const drawn = toText(fieldFrameBuffer({ width: 24, height: 3 }, { label: 'Notify' }));
    expect(shots[0]?.replace('always', '      ')).toBe(drawn);
  },
};

/** Under the ASCII theme the frame is ASCII, and invalid keeps its colour and its error row. */
export const Ascii: Story = {
  args: { legend: 'Branches' },
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={32} rows={12}>
        <Form>
          <Checkboxes isRequired />
          <Checkboxes isInvalid />
        </Form>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const [required, invalid] = canvas.getAllByRole('group', { name: 'Branches' });
    if (!required || !invalid) throw new Error('two groups');
    expect(edge(required)).toMatch(/^\+ Branches\* -+\+$/);
    expect(edge(invalid)).toMatch(/^\+ Branches -+\+$/);
    expect(invalid.textContent).toContain('X');
  },
};

/** Forced colors: the reader's palette, and the invalid frame still heavier than the rest. */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  args: { legend: 'Branches' },
  render: () => (
    <Frame title="forced colors" cols={36} rows={12}>
      <Form>
        <Checkboxes isInvalid />
        <Checkboxes isDisabled />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const [invalid, disabled] = canvas.getAllByRole('group', { name: 'Branches' });
    if (!invalid || !disabled) throw new Error('two groups');
    expect(edge(invalid)).toMatch(/^┏ Branches ━+┓$/);
    const words = disabled.querySelector('.rk-frame .rk-run[data-attrs~="dim"]') as Element;
    expect(getComputedStyle(words).color).toBe(resolved('GrayText', words));
  },
};

/** What a semantic token (or a system colour) resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/**
 * Held to `strict` (rule 7): every box in whole cells, drawn by the glyph
 * painter. The check after the story is the test, at every density and in
 * both modes, and this story is what lets the metadata say Fieldset holds
 * `strict` (0167).
 */
export const Strict: Story = {
  name: 'Held to strict',
  globals: { conformance: 'strict' },
  args: { legend: 'Address' },
  render: () => (
    <Frame title="strict" cols={48} rows={17}>
      <Form>
        <Fieldset legend="Address">
          <TextField className={fieldClass()}>
            <Label>Street</Label>
            <Input style={field} />
          </TextField>
        </Fieldset>
        <Checkboxes />
      </Form>
    </Frame>
  ),
};
