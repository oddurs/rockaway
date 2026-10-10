import { Buffer, drawText, toText } from '@rockaway/grid';
import {
  Button,
  buttonBuffer,
  type FieldText,
  Form,
  Frame,
  fieldClass,
  formBuffer,
  GlyphProvider,
  Label,
  Radio,
  RadioGroup,
  type RadioGroupText,
  type RadioOrientation,
  type RadioText,
  radioGroupBuffer,
  useGlyphs,
} from '@rockaway/react';
import { checkTargets, screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { Input, TextField } from 'react-aria-components';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';
import { measured, settled } from '../settled.ts';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  args: { label: 'Branch' },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The outer frame's width, in cells; a group inside it is four narrower. */
const COLS = 40;
const INNER = COLS - 4;

const BRANCHES = ['main', 'develop', 'release'] as const;

/** The branches as text, `chosen` filled and `disabled` dimmed. */
function options(chosen?: string, disabled?: string): RadioText[] {
  return BRANCHES.map((label) => ({
    label,
    ...(label === chosen ? { selected: true } : {}),
    ...(label === disabled ? { disabled: true } : {}),
  }));
}

/** A group of the three branches. */
function Branches({
  label = 'Branch',
  disabled,
  ...props
}: Partial<Parameters<typeof RadioGroup>[0]> & { disabled?: string }): ReactNode {
  return (
    <RadioGroup label={label} {...props}>
      {BRANCHES.map((value) => (
        <Radio key={value} value={value} isDisabled={value === disabled}>
          {value}
        </Radio>
      ))}
    </RadioGroup>
  );
}

/** The model of a group the width of the frame's inside. */
const model = (group: Omit<RadioGroupText, 'width'>, width = INNER): string =>
  toText(radioGroupBuffer({ width, ...group }));

/** The inside of a frame's screenshot: its rows and columns within the border and the pad. */
function inside(frame: HTMLElement, cols = COLS): string {
  return screenshot(frame, { legend: false })
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

/** Where a box is and how big, as numbers: a DOMRect's fields are getters `toEqual` cannot see. */
const box = (el: Element): readonly number[] => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return [left, top, width, height];
};

/** The label element React Aria made the radio's button: what a pointer presses. */
function buttonOf(input: HTMLElement): HTMLElement {
  const button = input.closest<HTMLElement>('.rk-radio-button');
  if (!button) throw new Error('the radio has no button');
  return button;
}

const markOf = (input: HTMLElement): HTMLElement =>
  buttonOf(input).querySelector('.rk-radio-mark') as HTMLElement;

/** Both orientations, and a horizontal group too narrow for one row, in one frame. */
function Orientations({ painter = 'glyph' }: { painter?: 'glyph' | 'rule' }): ReactNode {
  return (
    <Frame title={painter} painter={painter} cols={COLS} rows={ORIENTATIONS_ROWS + 2}>
      <Branches label="Vertical" defaultValue="main" disabled="release" painter={painter} />
      <Branches
        label="Horizontal"
        orientation="horizontal"
        defaultValue="develop"
        painter={painter}
      />
      <div style={{ inlineSize: 'calc(20 * var(--rk-cell-width))' }}>
        <Branches label="Wrapped" orientation="horizontal" defaultValue="main" painter={painter} />
      </div>
    </Frame>
  );
}

const ORIENTATIONS_TEXT = [
  model({ label: 'Vertical', options: options('main', 'release') }),
  model({ label: 'Horizontal', orientation: 'horizontal', options: options('develop') }),
  model({ label: 'Wrapped', orientation: 'horizontal', options: options('main') }, 20),
].join('\n');
const ORIENTATIONS_ROWS = ORIENTATIONS_TEXT.split('\n').length;

/**
 * Vertical, horizontal, and horizontal wrapping whole radios to the next row,
 * read back off the page: each is its model, cell for cell. The chosen mark
 * is filled, the others empty; the disabled option keeps its cell.
 */
export const Orientation: Story = {
  name: 'Both orientations, on the grid',
  render: () => <Orientations />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(inside(canvas.getByRole('group', { name: 'glyph' }))).toBe(ORIENTATIONS_TEXT);

    // A radio group, named by its label; radios named by their words alone.
    const vertical = canvas.getByRole('radiogroup', { name: 'Vertical' });
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    expect(canvas.getByRole('radiogroup', { name: 'Horizontal' })).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
    const main = canvas.getAllByRole('radio', { name: 'main' })[0] as HTMLElement;
    expect(main).toBeChecked();
    expect(markOf(main).closest('.rk-radio-indicator')).toHaveAttribute('aria-hidden', 'true');

    // The chosen mark is the accent; an empty one the default.
    expect(getComputedStyle(markOf(main)).color).toBe(resolved('--rk-fg-accent', markOf(main)));
    const develop = canvas.getAllByRole('radio', { name: 'develop' })[0] as HTMLElement;
    expect(getComputedStyle(markOf(develop)).color).toBe(
      resolved('--rk-fg-default', markOf(develop)),
    );

    // Horizontal options are two whole cells apart.
    const frame = canvas.getByRole('group', { name: 'glyph' });
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    const [first, second] = canvas
      .getAllByRole('radio')
      .filter(
        (r) => r.closest('[role="radiogroup"]')?.getAttribute('aria-orientation') === 'horizontal',
      )
      .map((r) => buttonOf(r).getBoundingClientRect());
    expect(Math.round(((second?.left ?? 0) - (first?.right ?? 0)) / cell)).toBe(2);
  },
};

/** The glyph and the rule painter draw the frame; every radio lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <Orientations painter="glyph" />
      <Orientations painter="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const painter of ['glyph', 'rule']) {
      expect(inside(canvas.getByRole('group', { name: painter }))).toBe(ORIENTATIONS_TEXT);
    }
  },
};

/**
 * Keyboard walkthrough: Tab enters the group at the chosen radio, the arrows
 * move and choose, skipping the disabled one, and Tab leaves the group as one
 * stop. The ring is drawn round the radio and costs no cell.
 */
export const Keyboard: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <Frame title="keyboard" cols={COLS} rows={11}>
      <Branches
        defaultValue="develop"
        disabled="release"
        {...(args.onChange ? { onChange: args.onChange } : {})}
      />
      <Branches label="Remote" orientation="horizontal" />
      <Button>Push</Button>
    </Frame>
  ),
  play: async ({ canvas, args }) => {
    await settled();
    const branch = canvas.getByRole('radiogroup', { name: 'Branch' });
    const radio = (name: string) =>
      [...branch.querySelectorAll<HTMLInputElement>('input')].find(
        (input) => input.value === name,
      ) as HTMLInputElement;
    const develop = radio('develop');
    const before = box(buttonOf(develop));

    await userEvent.tab();
    // Into the group at the chosen radio, not the first.
    expect(develop).toHaveFocus();
    const button = buttonOf(develop);
    expect(button.dataset.focusVisible).toBe('true');
    expect(getComputedStyle(button).outlineStyle).toBe('solid');
    expect(box(button)).toEqual(before);

    // Down moves and chooses; the disabled radio is passed over, round to the first.
    await userEvent.keyboard('{ArrowDown}');
    expect(radio('main')).toHaveFocus();
    expect(radio('main')).toBeChecked();
    expect(args.onChange).toHaveBeenLastCalledWith('main');
    expect(markOf(radio('main')).textContent).toBe(themeGlyphs.default.mark.radio);
    expect(markOf(develop).textContent).toBe(themeGlyphs.default.mark['radio-empty']);
    await userEvent.keyboard('{ArrowUp}');
    expect(develop).toHaveFocus();
    expect(develop).toBeChecked();

    // Tab leaves the group as one stop: into the next group, at its first radio.
    await userEvent.tab();
    const remote = canvas.getByRole('radiogroup', { name: 'Remote' });
    expect(remote.querySelector('input')).toHaveFocus();
    // Horizontal: right moves and chooses.
    await userEvent.keyboard('{ArrowRight}');
    expect(remote.querySelectorAll('input')[1]).toBeChecked();
    await userEvent.tab();
    expect(canvas.getByRole('button', { name: 'Push' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(remote.querySelectorAll('input')[1]).toHaveFocus();
  },
};

/** Hover underlines the words, not the mark, and nothing moves. */
export const Hovered: Story = {
  render: () => (
    <Frame title="hover" cols={COLS} rows={7}>
      <Branches defaultValue="main" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const button = buttonOf(canvas.getByRole('radio', { name: 'develop' }));
    const before = box(button);
    await userEvent.hover(button);
    await waitFor(() => expect(button.dataset.hovered).toBe('true'));
    const label = button.querySelector('.rk-radio-label') as HTMLElement;
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
    expect(
      getComputedStyle(button.querySelector('.rk-radio-indicator') as HTMLElement)
        .textDecorationLine,
    ).toBe('none');
    expect(box(button)).toEqual(before);
    await userEvent.unhover(button);
  },
};

/** Pressing reverses the mark cell, chosen or not; nothing moves. */
export const Pressed: Story = {
  render: () => (
    <Frame title="pressed" cols={COLS} rows={7}>
      <Branches defaultValue="main" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const name of ['main', 'develop']) {
      const input = canvas.getByRole('radio', { name });
      const button = buttonOf(input);
      const mark = markOf(input);
      const before = box(button);
      const ground = getComputedStyle(mark).backgroundColor;
      await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
      expect(button.dataset.pressed).toBe('true');
      expect(getComputedStyle(mark).backgroundColor).not.toBe(ground);
      expect(box(button)).toEqual(before);
      // Release away from it, so the press ends without choosing.
      fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
      await waitFor(() => expect(button.dataset.pressed).toBeUndefined());
    }
  },
};

const STATES_TEXT = [
  model({ label: 'Required', orientation: 'horizontal', required: true, options: options() }),
  model({ label: 'Invalid', orientation: 'horizontal', invalid: true, options: options() }),
  // The error hangs after the cross and a cell of air, under the frame.
  `${themeGlyphs.default.mark.cross} Choose a branch to push to.`,
  model({ label: 'Disabled', orientation: 'horizontal', disabled: true, options: options('main') }),
  model({
    label: 'Read-only',
    orientation: 'horizontal',
    readOnly: true,
    options: options('develop'),
  }),
].join('\n');

/**
 * Required, invalid, disabled and read-only, each the same cells as a group
 * at rest. Required is the mark after the label in the edge; invalid the
 * frame heavy, the marks in danger and the error under the frame; disabled
 * dims; read-only leaves the empty marks out and keeps their cells.
 */
export const States: Story = {
  name: 'Every state',
  render: () => (
    // The states, in the terminal's spacing: the help sits on the row under its group.
    <Frame
      title="states"
      cols={COLS}
      rows={STATES_TEXT.split('\n').length + 2}
      data-rk-comfort="compact"
    >
      <Branches label="Required" orientation="horizontal" isRequired />
      <Branches
        label="Invalid"
        orientation="horizontal"
        isInvalid
        errorMessage="Choose a branch to push to."
      />
      <Branches label="Disabled" orientation="horizontal" isDisabled defaultValue="main" />
      <Branches label="Read-only" orientation="horizontal" isReadOnly defaultValue="develop" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(inside(canvas.getByRole('group', { name: 'states' }))).toBe(STATES_TEXT);

    const required = canvas.getByRole('radiogroup', { name: 'Required' });
    expect(required).toHaveAttribute('aria-required', 'true');

    const invalid = canvas.getByRole('radiogroup', { name: 'Invalid' });
    expect(invalid).toHaveAttribute('aria-invalid', 'true');
    const error = canvas.getByText('Choose a branch to push to.');
    const errorId = error.closest('.rk-field-error')?.id ?? '';
    expect(invalid.getAttribute('aria-describedby')?.split(' ')).toContain(errorId);
    const mark = markOf(invalid.querySelector('input') as HTMLElement);
    expect(getComputedStyle(mark).color).toBe(resolved('--rk-fg-danger', mark));

    const disabled = canvas.getByRole('radiogroup', { name: 'Disabled' });
    for (const input of disabled.querySelectorAll('input')) expect(input).toBeDisabled();
    const dim = buttonOf(disabled.querySelector('input') as HTMLElement);
    expect(getComputedStyle(dim).color).toBe(resolved('--rk-fg-disabled', dim));

    const readOnly = canvas.getByRole('radiogroup', { name: 'Read-only' });
    expect(readOnly).toHaveAttribute('aria-readonly', 'true');

    // Every group is the same size, whatever its state.
    const sizes = [required, invalid, disabled, readOnly].map((g) => {
      const frame = g.querySelector('.rk-field-frame')?.getBoundingClientRect();
      return [frame?.width, frame?.height];
    });
    for (const size of sizes) expect(size).toEqual(sizes[0]);
  },
};

/** A one-row text field sketched from the field contract, for the group to line up with. */
function SketchTextField({ label, name }: { label: string; name: string }): ReactNode {
  const { delimiter } = useGlyphs();
  const [open, close] = delimiter.control;
  const input: CSSProperties = {
    inlineSize: 'calc(20 * var(--rk-cell-width))',
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
    <TextField name={name} className={fieldClass()}>
      <Label>{label}</Label>
      <span style={{ display: 'inline-flex' }}>
        <span aria-hidden="true">{open}</span>
        <Input style={input} />
        <span aria-hidden="true">{close}</span>
      </span>
    </TextField>
  );
}

function PushForm({ orientation }: { orientation: RadioOrientation }): ReactNode {
  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <SketchTextField label="Remote" name="remote" />
      <Branches
        name="branch"
        orientation={orientation}
        defaultValue="main"
        isRequired
        description="Where the commits go."
      />
      <SketchTextField label="Tag" name="tag" />
      <Button type="submit">Push</Button>
    </Form>
  );
}

/** The same form as text: what `formBuffer` says `PushForm` should look like. */
function pushModel(width: number, orientation: RadioOrientation): Buffer {
  const [open, close] = themeGlyphs.default.delimiter.control;
  const textBox = Buffer.create({ width: 22, height: 1 }).draw((d) => {
    drawText(d, { x: 0, y: 0 }, `${open}${' '.repeat(20)}${close}`);
  });
  const fields: FieldText[] = [
    { label: 'Remote', control: textBox },
    {
      control: (w) =>
        radioGroupBuffer({
          label: 'Branch',
          required: true,
          orientation,
          options: options('main'),
          width: w,
        }),
      description: 'Where the commits go.',
    },
    { label: 'Tag', control: textBox },
    { control: buttonBuffer('Push') },
  ];
  return formBuffer(fields, { width });
}

const WIDE = 64;
const NARROW = 44;

/**
 * In a form: the group is a field with its label in its frame, so the frame
 * starts in the control column with every other control, and the description
 * sits under it. Read back off the page, it is the form model cell for cell.
 */
export const InAForm: Story = {
  name: 'In a form, lined up',
  render: () => (
    <Frame title="push" cols={WIDE} rows={pushModel(WIDE - 4, 'horizontal').height + 2}>
      <PushForm orientation="horizontal" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'push' });
    expect(inside(frame, WIDE)).toBe(toText(pushModel(WIDE - 4, 'horizontal')));
    const group = canvas.getByRole('radiogroup', { name: 'Branch' });
    const help = canvas.getByText('Where the commits go.');
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  },
};

/** Under 60 cells the form stacks, and a vertical group stays in the one column. */
export const InANarrowForm: Story = {
  name: 'In a form, under 60 cells',
  render: () => (
    <Frame title="push" cols={NARROW} rows={pushModel(NARROW - 4, 'vertical').height + 2}>
      <PushForm orientation="vertical" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'push' });
    expect(inside(frame, NARROW)).toBe(toText(pushModel(NARROW - 4, 'vertical')));
  },
};

/**
 * At 200%: the zoom browser walks every density itself and reads every
 * stroke, so one frame is the whole of what it needs to see. Densities does
 * the same with four frames in the ordinary browser.
 */
export const Zoom: Story = {
  tags: ['zoom'],
  render: () => (
    <Frame title="zoom" cols={COLS} rows={5}>
      <Branches orientation="horizontal" defaultValue="main" />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(inside(canvas.getByRole('group', { name: 'zoom' }))).toBe(
      model({ label: 'Branch', orientation: 'horizontal', options: options('main') }),
    );
  },
};

/**
 * Every density: the same cells across, one row a radio, whatever a row is.
 * The continuity check runs on every frame after the story.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={COLS} rows={5}>
            <Branches orientation="horizontal" defaultValue="main" />
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const text = model({ label: 'Branch', orientation: 'horizontal', options: options('main') });
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const frame = canvas.getByRole('group', { name: density });
      expect(inside(frame)).toBe(text);
      const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-height'));
      for (const input of frame.querySelectorAll<HTMLElement>('input')) {
        expect(Math.round(buttonOf(input).getBoundingClientRect().height / cell)).toBe(1);
      }
    }
  },
};

/** Touch density: a radio is the row a finger presses, mark and words, a target of its own. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={COLS} rows={7}>
        <Branches />
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const develop = canvas.getByRole('radio', { name: 'develop' });
    // One row is 44px at touch (0197): a radio is a finger's height outright.
    for (const input of canvas.getAllByRole('radio')) {
      expect(buttonOf(input).getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    }
    const report = checkTargets(canvas.getByRole('group', { name: 'touch' }), { minHeight: 44 });
    expect(report.failures).toEqual([]);
    // A tap on the words chooses it, not only a tap on the mark.
    await userEvent.click(buttonOf(develop).querySelector('.rk-radio-label') as HTMLElement);
    expect(develop).toBeChecked();
  },
};

/** The ASCII repertoire: the same cells, every one ASCII. */
export const Ascii: Story = {
  name: 'ASCII',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={COLS} rows={5}>
        <Branches orientation="horizontal" defaultValue="main" />
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'ascii' });
    expect(inside(frame)).toBe(
      toText(
        radioGroupBuffer(
          { label: 'Branch', orientation: 'horizontal', options: options('main'), width: INNER },
          glyphsFor({ borderSet: 'ascii' }),
        ),
      ),
    );
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Orientations />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(inside(canvas.getByRole('group', { name: 'glyph' }))).toBe(ORIENTATIONS_TEXT);
    const main = canvas.getAllByRole('radio', { name: 'main' })[0] as HTMLElement;
    expect(getComputedStyle(markOf(main)).color).toBe(resolved('--rk-fg-accent', markOf(main)));
  },
};

/**
 * Forced colors: chosen and not are still two marks, invalid still a heavier
 * frame and the cross, disabled the reader's grey.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={COLS} rows={12}>
      <Branches orientation="horizontal" defaultValue="main" />
      <Branches label="Invalid" orientation="horizontal" isInvalid errorMessage="Choose one." />
      <Branches label="Disabled" orientation="horizontal" isDisabled />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const main = canvas.getAllByRole('radio', { name: 'main' })[0] as HTMLElement;
    expect(markOf(main).textContent).toBe(themeGlyphs.default.mark.radio);
    const invalid = canvas.getByRole('radiogroup', { name: 'Invalid' });
    expect(invalid.querySelector('.rk-frame')?.textContent).toContain('┏');
    const disabled = canvas.getByRole('radiogroup', { name: 'Disabled' });
    const dim = buttonOf(disabled.querySelector('input') as HTMLElement);
    expect(getComputedStyle(dim).color).toBe(resolved('GrayText', dim));
  },
};

/** At `strict`: every box in whole cells, with the glyph painter. No exception is declared. */
export const Strict: Story = {
  globals: { conformance: 'strict' },
  render: () => <Orientations />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.rkConformance).toBe('strict');
    const frame = canvas.getByRole('group', { name: 'glyph' });
    expect(inside(frame)).toBe(ORIENTATIONS_TEXT);
    expect(frame.querySelector('[data-rk-offgrid]')).toBeNull();
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
