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
  Switch,
  type SwitchState,
  switchBuffer,
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
  title: 'Components/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLS = 40;

/** A frame of COLS cells around these rows, as screenshot() reads it back. */
function framed(title: string, rows: readonly string[]): string {
  return [
    `┌ ${title} ${'─'.repeat(COLS - title.length - 4)}┐`,
    ...rows.map((row) => `│ ${row.padEnd(COLS - 3)}│`),
    `└${'─'.repeat(COLS - 2)}┘`,
  ].join('\n');
}

const cells = (label: string, state: SwitchState = {}): string =>
  toText(switchBuffer(label, state));

/** Where a box is and how big, as numbers: a DOMRect's fields are getters `toEqual` cannot see. */
const box = (el: Element): readonly number[] => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return [left, top, width, height];
};

/** Every state a switch can rest in, one to a row. */
function Rest({ title, painter = 'glyph' }: { title: string; painter?: 'glyph' | 'rule' }) {
  return (
    <Frame title={title} painter={painter} cols={COLS} rows={8}>
      <Switch painter={painter}>Wrap lines</Switch>
      <Switch painter={painter} defaultSelected>
        Show hidden files
      </Switch>
      <Switch painter={painter} isDisabled>
        Telemetry
      </Switch>
      <Switch painter={painter} isDisabled defaultSelected>
        Sandbox
      </Switch>
      <Switch painter={painter} isReadOnly>
        Locked off
      </Switch>
      <Switch painter={painter} isReadOnly defaultSelected>
        Locked on
      </Switch>
    </Frame>
  );
}

/** What `Rest` occupies, cell for cell, whatever the painter or the density. */
const REST_TEXT = (title: string): string =>
  framed(title, [
    cells('Wrap lines'),
    cells('Show hidden files', { selected: true }),
    cells('Telemetry', { disabled: true }),
    cells('Sandbox', { selected: true, disabled: true }),
    cells('Locked off', { readOnly: true }),
    cells('Locked on', { selected: true, readOnly: true }),
  ]);

/** The switch's painted track, the cells between its delimiters. */
function trackOf(input: HTMLElement): HTMLElement {
  const track = input.closest('.rk-switch-button')?.querySelector<HTMLElement>('.rk-switch-track');
  if (!track) throw new Error('the switch has no track');
  return track;
}

/** The label element React Aria made the switch's button: what a pointer presses. */
function buttonOf(input: HTMLElement): HTMLElement {
  const button = input.closest<HTMLElement>('.rk-switch-button');
  if (!button) throw new Error('the switch has no button');
  return button;
}

/**
 * Every state at rest, read back off the page: off has the thumb at the start
 * of the track, on at the end; read-only draws the thumb alone. Every switch
 * is the same width, and the name is the label alone.
 */
export const States: Story = {
  name: 'Every state',
  render: () => <Rest title="states" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'states' });
    expect(screenshot(frame, { legend: false })).toBe(REST_TEXT('states'));

    // A switch, named by its words, with no glyph in the name.
    const wrap = canvas.getByRole('switch', { name: 'Wrap lines' });
    expect(wrap).not.toBeChecked();
    expect(canvas.getByRole('switch', { name: 'Show hidden files' })).toBeChecked();
    expect(
      wrap.closest('.rk-switch-button')?.querySelector('.rk-switch-indicator'),
    ).toHaveAttribute('aria-hidden', 'true');

    // On is reverse video; off is not; read-only has no ground at all.
    const ground = (name: string) =>
      getComputedStyle(trackOf(canvas.getByRole('switch', { name }))).backgroundColor;
    expect(ground('Show hidden files')).toBe(resolved('--rk-bg-inverse', frame));
    expect(ground('Wrap lines')).toBe('rgba(0, 0, 0, 0)');
    expect(ground('Locked on')).toBe('rgba(0, 0, 0, 0)');

    // The track's line is a shape the cell strokes, not a glyph the font draws.
    const line = trackOf(wrap).querySelector<HTMLElement>('[data-rk-shape]');
    expect(line?.textContent).toBe(themeGlyphs.default.mark['switch-track'].repeat(2));
    expect(getComputedStyle(line as HTMLElement).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)');

    // Disabled dims, and read-only is still a switch a reader can find.
    expect(canvas.getByRole('switch', { name: 'Telemetry' })).toBeDisabled();
    const telemetry = buttonOf(canvas.getByRole('switch', { name: 'Telemetry' }));
    expect(getComputedStyle(telemetry).color).toBe(resolved('--rk-fg-disabled', telemetry));
    expect(canvas.getByRole('switch', { name: 'Locked on' })).toHaveAttribute(
      'aria-readonly',
      'true',
    );

    // Every switch is one row and the same cells wide, in whichever state.
    const widths = canvas
      .getAllByRole('switch')
      .map(
        (input) => trackOf(input).closest('.rk-switch-indicator')?.getBoundingClientRect().width,
      );
    for (const width of widths) expect(width).toBe(widths[0]);
  },
};

/** The glyph and the rule painter stroke the track; every switch lands in the same cells under both. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      <Rest title="glyph" painter="glyph" />
      <Rest title="rule" painter="rule" />
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const painter of ['glyph', 'rule']) {
      const frame = canvas.getByRole('group', { name: painter });
      expect(screenshot(frame, { legend: false })).toBe(REST_TEXT(painter));
      for (const track of frame.querySelectorAll('.rk-switch-track')) {
        expect(track.getAttribute('data-rk-painted')).toBe(painter);
      }
    }
  },
};

/**
 * Every density: one row each, the same cells across. The continuity check
 * runs on every track after the story, so the line meets its cell's edges
 * at every line box.
 */
export const Densities: Story = {
  // Off and on only: every painted track is a screenshot the continuity check
  // reads in every cell of the matrix, and the other states draw the same line.
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={COLS} rows={4}>
            <Switch>Wrap lines</Switch>
            <Switch defaultSelected>Show hidden files</Switch>
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const frame = canvas.getByRole('group', { name: density });
      expect(screenshot(frame, { legend: false })).toBe(
        framed(density, [cells('Wrap lines'), cells('Show hidden files', { selected: true })]),
      );
      const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-height'));
      for (const input of frame.querySelectorAll<HTMLElement>('[role="switch"]')) {
        // One row tall, the track included, whatever a row is.
        expect(Math.round(buttonOf(input).getBoundingClientRect().height / cell)).toBe(1);
        expect(trackOf(input).getBoundingClientRect().height).toBeCloseTo(cell, 1);
      }
    }
  },
};

/**
 * At 200%: the zoom browser walks every density itself and reads every
 * stroke, so one frame, off and on, is the whole of what it needs to see.
 * Densities does the same with four frames in the ordinary browser.
 */
export const Zoom: Story = {
  tags: ['zoom'],
  render: () => (
    <Frame title="zoom" cols={COLS} rows={4}>
      <Switch>Wrap lines</Switch>
      <Switch defaultSelected>Show hidden files</Switch>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'zoom' });
    expect(screenshot(frame, { legend: false })).toBe(
      framed('zoom', [cells('Wrap lines'), cells('Show hidden files', { selected: true })]),
    );
  },
};

/**
 * Keyboard walkthrough: Tab reaches each switch in turn and skips the
 * disabled one, the ring is drawn round the track and the words, and Space
 * turns it on and off. The thumb moves, the track reverses, and nothing else
 * does.
 */
export const Keyboard: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <Frame title="keyboard" cols={COLS} rows={5}>
      <Switch {...(args.onChange ? { onChange: args.onChange } : {})}>Wrap lines</Switch>
      <Switch isDisabled>Telemetry</Switch>
      <Switch defaultSelected>Show hidden files</Switch>
    </Frame>
  ),
  play: async ({ canvas, args }) => {
    await settled();
    const wrap = canvas.getByRole('switch', { name: 'Wrap lines' });
    const hidden = canvas.getByRole('switch', { name: 'Show hidden files' });
    const frame = canvas.getByRole('group', { name: 'keyboard' });
    const before = box(buttonOf(wrap));
    const row = () => screenshot(frame, { legend: false }).split('\n')[1];
    const drawn = (state: SwitchState = {}) => `│ ${cells('Wrap lines', state).padEnd(COLS - 3)}│`;

    await userEvent.tab();
    expect(wrap).toHaveFocus();
    // Focus is shown to the keyboard as the ring, round what is seen, and costs no cell.
    const button = buttonOf(wrap);
    expect(button.dataset.focusVisible).toBe('true');
    expect(getComputedStyle(button).outlineStyle).toBe('solid');
    expect(row()).toBe(drawn());

    // Space turns it on: the thumb to the end, the track reversed.
    await userEvent.keyboard(' ');
    expect(wrap).toBeChecked();
    expect(args.onChange).toHaveBeenLastCalledWith(true);
    expect(row()).toBe(drawn({ selected: true }));
    expect(getComputedStyle(trackOf(wrap)).backgroundColor).toBe(
      resolved('--rk-bg-inverse', frame),
    );
    expect(box(button)).toEqual(before);

    // And off again.
    await userEvent.keyboard(' ');
    expect(wrap).not.toBeChecked();
    expect(args.onChange).toHaveBeenLastCalledWith(false);
    expect(row()).toBe(drawn());

    // The disabled switch is not a stop.
    await userEvent.tab();
    expect(hidden).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(hidden).not.toBeChecked();
    await userEvent.tab({ shift: true });
    expect(wrap).toHaveFocus();
  },
};

/** Hover underlines the label, not the track, and nothing moves. */
export const Hovered: Story = {
  render: () => (
    <Frame title="hover" cols={COLS} rows={3}>
      <Switch>Wrap lines</Switch>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const button = buttonOf(canvas.getByRole('switch', { name: 'Wrap lines' }));
    const label = button.querySelector('.rk-switch-label') as HTMLElement;
    const indicator = button.querySelector('.rk-switch-indicator') as HTMLElement;
    const before = box(button);
    await userEvent.hover(button);
    await waitFor(() => expect(button.dataset.hovered).toBe('true'));
    expect(getComputedStyle(label).textDecorationLine).toBe('underline');
    expect(getComputedStyle(indicator).textDecorationLine).toBe('none');
    expect(box(button)).toEqual(before);
    await userEvent.unhover(button);
  },
};

/**
 * Pressing reverses the track, and an on track, already reversed, reverses
 * back: the press always shows. Nothing moves.
 */
export const Pressed: Story = {
  render: () => (
    <Frame title="pressed" cols={COLS} rows={4}>
      <Switch>Wrap lines</Switch>
      <Switch defaultSelected>Show hidden files</Switch>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    for (const name of ['Wrap lines', 'Show hidden files']) {
      const input = canvas.getByRole('switch', { name });
      const button = buttonOf(input);
      const track = trackOf(input);
      const before = box(button);
      const ground = getComputedStyle(track).backgroundColor;
      await userEvent.pointer({ keys: '[MouseLeft>]', target: button });
      expect(button.dataset.pressed).toBe('true');
      expect(getComputedStyle(track).backgroundColor).not.toBe(ground);
      expect(box(button)).toEqual(before);
      // Release away from it, so the press ends without toggling.
      fireEvent.pointerUp(document.body, { pointerId: 1, pointerType: 'mouse', button: 0 });
      await waitFor(() => expect(button.dataset.pressed).toBeUndefined());
    }
  },
};

/** A one-row text field sketched from the field contract, for the switch to line up with. */
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

function SettingsForm(): ReactNode {
  return (
    <Form onSubmit={(e) => e.preventDefault()}>
      <SketchTextField label="Editor" name="editor" />
      <Switch name="wrap" defaultSelected description="Long lines wrap at the window's edge.">
        Wrap lines
      </Switch>
      <Switch name="hidden">Show hidden files</Switch>
      <SketchTextField label="Tab width" name="tabs" />
      <Button type="submit">Save</Button>
    </Form>
  );
}

/** The same form as text: what `formBuffer` says `SettingsForm` should look like. */
function settingsModel(width: number): Buffer {
  const [open, close] = themeGlyphs.default.delimiter.control;
  const box = Buffer.create({ width: 22, height: 1 }).draw((d) => {
    drawText(d, { x: 0, y: 0 }, `${open}${' '.repeat(20)}${close}`);
  });
  const fields: FieldText[] = [
    { label: 'Editor', control: box },
    {
      control: switchBuffer('Wrap lines', { selected: true }),
      description: "Long lines wrap at the window's edge.",
    },
    { control: switchBuffer('Show hidden files') },
    { label: 'Tab width', control: box },
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

const WIDE = 64;
const NARROW = 44;

/**
 * In a form: a switch is a field with no label column of its own, so its
 * track starts in the same cell as every other control, and its description
 * sits under it. Read back off the page, it is the form model cell for cell.
 */
export const InAForm: Story = {
  name: 'In a form, lined up',
  render: () => (
    <Frame title="settings" cols={WIDE} rows={settingsModel(WIDE - 4).height + 2}>
      <SettingsForm />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'settings' });
    expect(inside(screenshot(frame, { legend: false }), WIDE)).toBe(
      toText(settingsModel(WIDE - 4)),
    );
    // The description is the switch's, by aria-describedby.
    const wrap = canvas.getByRole('switch', { name: 'Wrap lines' });
    const help = canvas.getByText("Long lines wrap at the window's edge.");
    expect(wrap.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
    // Every control starts in one column of cells.
    const editor = canvas.getByRole('textbox', { name: 'Editor' }).getBoundingClientRect();
    const track = buttonOf(wrap).getBoundingClientRect();
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    // The text box's input starts a cell after its delimiter; the switch starts at its own.
    expect(Math.round((editor.left - track.left) / cell)).toBe(1);
  },
};

/** Under 60 cells the form stacks, and the switches stay where the controls start. */
export const InANarrowForm: Story = {
  name: 'In a form, under 60 cells',
  render: () => (
    <Frame title="settings" cols={NARROW} rows={settingsModel(NARROW - 4).height + 2}>
      <SettingsForm />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'settings' });
    expect(inside(screenshot(frame, { legend: false }), NARROW)).toBe(
      toText(settingsModel(NARROW - 4)),
    );
  },
};

/**
 * Touch density: the same one-row switch, 44px tall, and the whole row,
 * track and words, is the target.
 */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={COLS} rows={4}>
        <Switch>Wrap lines</Switch>
        <Switch defaultSelected>Show hidden files</Switch>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await settled();
    const wrap = canvas.getByRole('switch', { name: 'Wrap lines' });
    const button = buttonOf(wrap);
    // One row is 44px at touch (0197), so the switch is a finger's height outright.
    await measured(document.body);
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    // The target is the row a finger presses, not the hidden 13px input inside it.
    const frame = canvas.getByRole('group', { name: 'touch' });
    const report = checkTargets(frame, { minHeight: 44 });
    expect(report.targets).toBe(2);
    expect(report.failures).toEqual([]);
    // A tap on the words toggles it, not only a tap on the track.
    await userEvent.click(button.querySelector('.rk-switch-label') as HTMLElement);
    expect(wrap).toBeChecked();
  },
};

/** The ASCII repertoire: the same cells, every one of them ASCII. */
export const Ascii: Story = {
  name: 'ASCII',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={COLS} rows={4}>
        <Switch>Wrap lines</Switch>
        <Switch defaultSelected>Show hidden files</Switch>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'ascii' });
    const rows = screenshot(frame, { legend: false }).split('\n');
    expect(rows[1]).toBe(`| ${'[O--] Wrap lines'.padEnd(COLS - 3)}|`);
    expect(rows[2]).toBe(`| ${'[--O] Show hidden files'.padEnd(COLS - 3)}|`);
    // ASCII stays letters: nothing in the track is a shape.
    expect(frame.querySelector('.rk-switch-track [data-rk-shape]')).toBeNull();
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => <Rest title="dark" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const frame = canvas.getByRole('group', { name: 'dark' });
    expect(screenshot(frame, { legend: false })).toBe(REST_TEXT('dark'));
    const on = trackOf(canvas.getByRole('switch', { name: 'Show hidden files' }));
    expect(getComputedStyle(on).backgroundColor).toBe(resolved('--rk-bg-inverse', on));
  },
};

/**
 * Forced colors: on is still the reader's text and canvas swapped, with the
 * thumb in the canvas colour on it and the line stroked in that colour too,
 * so the track does not vanish into its own ground. Disabled is GrayText.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => <Rest title="forced colors" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const frame = canvas.getByRole('group', { name: 'forced colors' });
    expect(screenshot(frame, { legend: false })).toBe(REST_TEXT('forced colors'));

    const on = trackOf(canvas.getByRole('switch', { name: 'Show hidden files' }));
    expect(getComputedStyle(on).backgroundColor).toBe(resolved('CanvasText', on));
    expect(getComputedStyle(on).color).toBe(resolved('Canvas', on));
    // The line in a reversed track is inked in the track's own colour.
    const line = on.querySelector('[data-rk-shape]') as HTMLElement;
    expect(getComputedStyle(line).getPropertyValue('--rk-ink-colour').trim()).toBe('currentColor');

    const off = trackOf(canvas.getByRole('switch', { name: 'Wrap lines' }));
    expect(getComputedStyle(off).color).toBe(resolved('CanvasText', off));
    const telemetry = buttonOf(canvas.getByRole('switch', { name: 'Telemetry' }));
    expect(getComputedStyle(telemetry).color).toBe(resolved('GrayText', telemetry));
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

/** At `strict`: every box in whole cells, with the glyph painter. No exception is declared. */
export const Strict: Story = {
  globals: { conformance: 'strict' },
  render: () => <Rest title="strict" />,
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.rkConformance).toBe('strict');
    const frame = canvas.getByRole('group', { name: 'strict' });
    expect(screenshot(frame, { legend: false })).toBe(REST_TEXT('strict'));
    expect(frame.querySelector('[data-rk-offgrid]')).toBeNull();
  },
};
