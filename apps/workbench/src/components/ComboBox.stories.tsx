import { type Buffer, drawText, toText } from '@rockaway/grid';
import {
  Button,
  ComboBox,
  ComboBoxItem,
  type ComboBoxText,
  comboBoxBuffer,
  type FieldText,
  Form,
  Frame,
  formBuffer,
  GlyphProvider,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured, settled } from '../settled.ts';

const meta = {
  title: 'Components/ComboBox',
  component: ComboBox,
  parameters: { layout: 'centered' },
  args: { label: 'Author' },
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

const AUTHORS = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'aurora', name: 'Aurora Rhee' },
  { id: 'grace', name: 'Grace Hopper' },
  { id: 'laurent', name: 'Laurent Kim' },
  { id: 'zoe', name: 'Zoë Durand' },
] as const;
const COLS = 20;
const WIDE = 64;

/** The authors as a combobox, in whatever state it is given. */
function Authors({
  disabled,
  ...props
}: Partial<Parameters<typeof ComboBox>[0]> & { disabled?: string }): ReactNode {
  return (
    <ComboBox label="Author" cols={COLS} placeholder="Find an author" {...props}>
      {AUTHORS.map((author) => (
        <ComboBoxItem key={author.id} id={author.id} isDisabled={author.id === disabled}>
          {author.name}
        </ComboBoxItem>
      ))}
    </ComboBox>
  );
}

const OPTIONS: ComboBoxText['options'] = AUTHORS.map((a) => ({ label: a.name }));

/**
 * A combobox as the page shows it to `screenshot()`: an input's value and its
 * placeholder are not text on the page, so the box's text cells are blank,
 * and everything else is the model's, the popover filtered by what is typed.
 */
function control(
  text: Omit<ComboBoxText, 'cols' | 'options'>,
  glyphs = themeGlyphs.default,
): Buffer {
  return comboBoxBuffer({ cols: COLS, options: OPTIONS, ...text }, glyphs).draw((draft) => {
    drawText(draft, { x: 2, y: 0 }, ' '.repeat(COLS - 5));
  });
}

/** A one-field form's model: the label column, and the combobox in the control column. */
function model(text: Omit<ComboBoxText, 'cols' | 'options'>, glyphs = themeGlyphs.default): string {
  const fields: FieldText[] = [{ label: 'Author', control: control(text, glyphs) }];
  return toText(formBuffer(fields, { width: WIDE - 4 }));
}

/** The inside of a frame's screenshot: its rows and columns within the border and the pad. */
function inside(frame: HTMLElement, cols = WIDE): string {
  return screenshot(frame, { legend: false })
    .split('\n')
    .slice(1, -1)
    .map((row) =>
      [...row.padEnd(cols)]
        .slice(2, cols - 2)
        .join('')
        .trimEnd(),
    )
    .join('\n')
    .replace(/\n+$/, '');
}

const option = (name: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((el) =>
    el.textContent?.includes(name),
  );
  if (!found) throw new Error(`no option ${name}`);
  return found;
};

const listbox = (): Element | null => document.querySelector('[role="listbox"]');

/** What a semantic token (or a system colour) resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** Where a box is and how big, as numbers. */
const box = (el: Element): readonly number[] => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return [left, top, width, height];
};

/**
 * Closed, in a form: the box exactly `cols` cells wide in the control column,
 * the text in its third cell, read back off the page as the model draws it;
 * with nothing typed, the placeholder, muted.
 */
export const Closed: Story = {
  render: () => (
    <Frame title="closed" cols={WIDE} rows={5}>
      <Form>
        <Authors />
        <Authors label="Editor" defaultSelectedKey="grace" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'closed' });
    const fields: FieldText[] = [
      { label: 'Author', control: control({ placeholder: 'Find an author' }) },
      { label: 'Editor', control: control({ input: 'Grace Hopper' }) },
    ];
    expect(inside(frame)).toBe(toText(formBuffer(fields, { width: WIDE - 4 })));
    // What the boxes hold, which a screenshot cannot read.
    expect(canvas.getByRole('combobox', { name: 'Author' })).toHaveAttribute(
      'placeholder',
      'Find an author',
    );
    expect(canvas.getByRole('combobox', { name: 'Editor' })).toHaveValue('Grace Hopper');
    // The input is the combobox, named by the label; every glyph is hidden.
    const author = canvas.getByRole('combobox', { name: 'Author' });
    expect(author.tagName).toBe('INPUT');
    for (const glyph of frame.querySelectorAll('.rk-combobox-end, .rk-combobox-mark')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    const group = frame.querySelector('.rk-combobox-box') as HTMLElement;
    expect(Math.abs(group.getBoundingClientRect().width - COLS * cell)).toBeLessThan(1 / 32);
  },
};

/**
 * Filtering, from the keyboard: typing keeps the options it matches, each
 * match underlined, bold and in the accent; the arrows move the cursor while
 * focus stays in the box; Enter chooses and closes; Escape closes. Read back
 * off the page as the model draws it, and nothing moves a cell.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={WIDE} rows={9}>
      <Form>
        <Authors />
        <Button>after</Button>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'keyboard' });
    const input = canvas.getByRole('combobox', { name: 'Author' });
    const before = box(input);

    await userEvent.tab();
    expect(input).toHaveFocus();
    expect(getComputedStyle(input).outlineStyle).toBe('solid');

    await userEvent.keyboard('aur');
    await waitFor(() => expect(document.querySelectorAll('[role="option"]')).toHaveLength(2));
    // The match: underlined, bold and in the accent, three ways at once.
    const match = option('Laurent Kim').querySelector('.rk-combobox-match') as HTMLElement;
    expect(match.textContent).toBe('aur');
    const style = getComputedStyle(match);
    expect(style.textDecorationLine).toBe('underline');
    expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
    expect(style.color).toBe(resolved('--rk-fg-accent', match));

    // The arrows move the cursor; focus stays in the box.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(option('Aurora Rhee').dataset.focused).toBe('true'));
    expect(input).toHaveFocus();
    await measured(document.body);
    expect(inside(frame)).toBe(model({ input: 'aur', open: true, cursor: 'Aurora Rhee' }));
    // The text snapshot's legend says what the match is drawn with: attributes, not only hue.
    expect(screenshot(frame)).toMatch(/bold underline\s+\d+,\d+\s+aur\b/);

    // Enter chooses and closes; the box holds the choice.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(listbox()).toBeNull());
    expect(input).toHaveValue('Aurora Rhee');

    // Typing again opens it; Escape closes it.
    await userEvent.keyboard('{Backspace}');
    await waitFor(() => expect(listbox()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(listbox()).toBeNull());

    await userEvent.tab();
    expect(canvas.getByRole('button', { name: 'after' })).toHaveFocus();
    expect(box(input)).toEqual(before);
  },
};

/** Nothing matches: the popover stays open and says so, in a muted row. */
export const NothingMatches: Story = {
  name: 'Nothing matches',
  render: () => (
    <Frame title="none" cols={WIDE} rows={7}>
      <Form>
        <Authors />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'none' });
    await userEvent.click(canvas.getByRole('combobox', { name: 'Author' }));
    await userEvent.keyboard('xyz');
    const empty = await waitFor(() => {
      const el = document.querySelector('.rk-combobox-empty');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(getComputedStyle(empty).color).toBe(resolved('--rk-fg-muted', empty));
    await measured(document.body);
    expect(inside(frame)).toBe(model({ input: 'xyz', open: true }));
  },
};

/**
 * The button: its three cells open every option, whatever is typed, and are
 * a finger's width at touch. Hover underlines the mark; a press reverses it.
 */
export const OpenButton: Story = {
  name: 'The open button',
  render: () => (
    <div data-density="touch">
      <Frame title="button" cols={WIDE} rows={3}>
        <Form>
          <Authors defaultSelectedKey="grace" />
        </Form>
      </Frame>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settled();
    const button = canvasElement.querySelector('.rk-combobox-button') as HTMLElement;
    const mark = button.querySelector('.rk-combobox-mark') as HTMLElement;
    const { width, height } = button.getBoundingClientRect();
    expect(height).toBeGreaterThanOrEqual(44 - 0.5);
    expect(width).toBeGreaterThanOrEqual(24 - 0.5);
    await userEvent.hover(button);
    await waitFor(() => expect(button.dataset.hovered).toBe('true'));
    expect(getComputedStyle(mark).textDecorationLine).toBe('underline');
    await userEvent.click(button);
    await waitFor(() => expect(document.querySelectorAll('[role="option"]')).toHaveLength(5));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(listbox()).toBeNull());
  },
};

/**
 * In a form with native validation: a required combobox with nothing chosen
 * stops the submit, the error is drawn under it with the cross, and a choice
 * is submitted by its key.
 */
export const InAForm: Story = {
  name: 'In a form, validated and submitted',
  render: function Render() {
    return (
      <Frame title="review" cols={WIDE} rows={8}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            e.currentTarget.dataset.submitted = String(data.get('author'));
          }}
        >
          <Authors name="author" isRequired description="Who wrote it." />
          <Button type="submit">Send</Button>
        </Form>
      </Frame>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const input = canvas.getByRole('combobox', { name: /Author/ });
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    const error = await waitFor(() => {
      const el = canvasElement.querySelector('.rk-field-error');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(form.dataset.submitted).toBeUndefined();
    expect(error.querySelector('.rk-field-error-mark')?.textContent).toBe(
      themeGlyphs.default.mark.cross,
    );
    const end = canvasElement.querySelector('.rk-combobox-end') as HTMLElement;
    expect(getComputedStyle(end).color).toBe(resolved('--rk-border-danger', end));
    expect((input.getAttribute('aria-describedby') ?? '').split(' ')).toContain(error.id);

    await userEvent.click(input);
    await userEvent.keyboard('hop');
    await userEvent.click(await waitFor(() => option('Grace Hopper')));
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(form.dataset.submitted).toBe('grace'));
  },
};

/**
 * A custom value: by default a combobox holds only its options, so text that
 * matches none goes when focus leaves; with `allowsCustomValue` it stays, and
 * a form submits the text.
 */
export const CustomValue: Story = {
  name: 'Custom values, forbidden and allowed',
  render: function Render() {
    return (
      <Frame title="custom" cols={WIDE} rows={6}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            e.currentTarget.dataset.submitted = String(data.get('reviewer'));
          }}
        >
          <Authors />
          <Authors label="Reviewer" name="reviewer" allowsCustomValue />
          <Button type="submit">Send</Button>
        </Form>
      </Frame>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const author = canvas.getByRole('combobox', { name: 'Author' });
    const reviewer = canvas.getByRole('combobox', { name: 'Reviewer' });
    await userEvent.click(author);
    await userEvent.keyboard('Margaret');
    await userEvent.tab();
    await waitFor(() => expect(author).toHaveValue(''));
    await userEvent.click(reviewer);
    await userEvent.keyboard('Margaret');
    await userEvent.tab();
    expect(reviewer).toHaveValue('Margaret');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    await waitFor(() => expect(form.dataset.submitted).toBe('Margaret'));
  },
};

/** Disabled: dimmed, not a tab stop, and the same cells. */
export const Disabled: Story = {
  render: () => (
    <Frame title="disabled" cols={WIDE} rows={3}>
      <Form>
        <Authors defaultSelectedKey="ada" isDisabled />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'disabled' });
    expect(inside(frame)).toBe(model({ input: 'Ada Lovelace', disabled: true }));
    const input = canvas.getByRole('combobox', { name: 'Author' });
    expect(input).toBeDisabled();
    const within = input.parentElement as HTMLElement;
    expect(getComputedStyle(input).color).toBe(resolved('--rk-fg-disabled', within));
  },
};

/** Open in a screen painted with the given painter: the popover follows it across the portal. */
function painted(painter: 'glyph' | 'rule'): Story {
  return {
    render: () => (
      <Frame title={painter} painter={painter} cols={WIDE} rows={9}>
        <Form>
          <Authors />
        </Form>
      </Frame>
    ),
    play: async ({ canvas }) => {
      await settled();
      const frame = canvas.getByRole('group', { name: painter });
      await userEvent.click(canvas.getByRole('combobox', { name: 'Author' }));
      await userEvent.keyboard('aur{ArrowDown}');
      await waitFor(() => expect(option('Aurora Rhee').dataset.focused).toBe('true'));
      await measured(document.body);
      expect(inside(frame)).toBe(model({ input: 'aur', open: true, cursor: 'Aurora Rhee' }));
      const surface = document.querySelector('.rk-overlay [data-rk-painted]') as HTMLElement;
      expect(surface.dataset.rkPainted).toBe(painter);
    },
  };
}

/** Both painters, one story each: the box and the open popover land in the same cells. */
export const PainterGlyph: Story = { ...painted('glyph'), name: 'Painted, glyph' };
export const PainterRule: Story = { ...painted('rule'), name: 'Painted, rule' };

/** At 200%, closed: one combobox, which the zoom browser reads at every density itself. */
export const Zoom: Story = {
  tags: ['zoom'],
  render: () => (
    <Frame title="zoom" cols={WIDE} rows={3}>
      <Form>
        <Authors defaultSelectedKey="laurent" />
      </Form>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
  },
};

/** The ASCII repertoire: the same cells, every one of them ASCII. */
export const Ascii: Story = {
  name: 'ASCII',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={WIDE} rows={3}>
        <Form>
          <Authors defaultSelectedKey="ada" />
        </Form>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'ascii' });
    const text = inside(frame);
    expect(text).toBe(model({ input: 'Ada Lovelace' }, glyphsFor({ borderSet: 'ascii' })));
    expect(text).toMatch(/^[\x20-\x7e\n]*$/);
  },
};

/** Dark mode, filtering: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={WIDE} rows={9}>
      <Form>
        <Authors />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvent.click(canvas.getByRole('combobox', { name: 'Author' }));
    await userEvent.keyboard('aur');
    const match = await waitFor(() => {
      const el = document.querySelector('.rk-combobox-match');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(getComputedStyle(match).color).toBe(resolved('--rk-fg-accent', match));
  },
};

/**
 * Forced colors, filtering: the match keeps its underline and weight where
 * the hue is the reader's, and the delimiters are the reader's text.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced" cols={WIDE} rows={9}>
      <Form>
        <Authors />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Author' }));
    await userEvent.keyboard('aur');
    const match = await waitFor(() => {
      const el = document.querySelector('.rk-combobox-match');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(getComputedStyle(match).textDecorationLine).toBe('underline');
    expect(Number(getComputedStyle(match).fontWeight)).toBeGreaterThanOrEqual(700);
  },
};

/** Held to the strict level, open: the grid, target and contrast checks measure it. */
export const Strict: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="strict" cols={WIDE} rows={9}>
      <Form>
        <Authors />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    await userEvent.click(canvas.getByRole('combobox', { name: 'Author' }));
    await userEvent.keyboard('a');
    await waitFor(() => expect(listbox()).not.toBeNull());
  },
};
