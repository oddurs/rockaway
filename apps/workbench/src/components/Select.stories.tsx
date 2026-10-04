import { toText } from '@rockaway/grid';
import {
  Button,
  type FieldText,
  Form,
  Frame,
  formBuffer,
  GlyphProvider,
  Select,
  SelectItem,
  type SelectText,
  selectBuffer,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { measured, settled } from '../settled.ts';

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: { layout: 'centered' },
  args: { label: 'Theme' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const THEMES = ['default', 'ink', 'phosphor', 'ice', 'tokyo-night'] as const;
const COLS = 16;
const WIDE = 64;

/** The themes as a select, in whatever state it is given. */
function Themes({
  disabled,
  ...props
}: Partial<Parameters<typeof Select>[0]> & { disabled?: string }): ReactNode {
  return (
    <Select label="Theme" cols={COLS} {...props}>
      {THEMES.map((theme) => (
        <SelectItem key={theme} id={theme} isDisabled={theme === disabled}>
          {theme}
        </SelectItem>
      ))}
    </Select>
  );
}

/** The themes as text, for the model. */
function options(disabled?: string): SelectText['options'] {
  return THEMES.map((label) => ({ label, ...(label === disabled ? { disabled: true } : {}) }));
}

/** A one-field form's model: the label column, and the select in the control column. */
function model(select: Omit<SelectText, 'cols' | 'options'>, width = WIDE - 4): string {
  const fields: FieldText[] = [
    {
      label: 'Theme',
      control: selectBuffer({
        cols: COLS,
        options: options(),
        placeholder: 'Choose one',
        ...select,
      }),
    },
  ];
  return toText(formBuffer(fields, { width }));
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

const triggerOf = (root: HTMLElement): HTMLElement =>
  root.querySelector<HTMLElement>('.rk-select-trigger') as HTMLElement;

const option = (name: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((el) =>
    el.textContent?.includes(name),
  );
  if (!found) throw new Error(`no option ${name}`);
  return found;
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

/** Where a box is and how big, as numbers. */
const box = (el: Element): readonly number[] => {
  const { left, top, width, height } = el.getBoundingClientRect();
  return [left, top, width, height];
};

/**
 * Closed, in a form: the trigger exactly `cols` cells wide in the control
 * column, the value in its third cell, read back off the page as the model
 * draws it; and with nothing chosen, the placeholder, muted.
 */
export const Closed: Story = {
  render: () => (
    <Frame title="settings" cols={WIDE} rows={5}>
      <Form>
        <Themes defaultSelectedKey="phosphor" />
        <Themes label="Font" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'settings' });
    const fields: FieldText[] = [
      {
        label: 'Theme',
        control: selectBuffer({ cols: COLS, options: options(), value: 'phosphor' }),
      },
      {
        label: 'Font',
        control: selectBuffer({ cols: COLS, options: options(), placeholder: 'Choose one' }),
      },
    ];
    expect(inside(frame)).toBe(toText(formBuffer(fields, { width: WIDE - 4 })));

    // The trigger is a button named by the label and the value; its chrome is hidden.
    const theme = canvas.getByRole('button', { name: /Theme/ });
    expect(theme).toHaveAccessibleName(expect.stringContaining('phosphor'));
    for (const end of theme.querySelectorAll('.rk-select-end')) {
      expect(end).toHaveAttribute('aria-hidden', 'true');
    }
    const placeholder = frame.querySelectorAll('.rk-select-value')[1] as HTMLElement;
    expect(placeholder.closest('[data-placeholder]')).not.toBeNull();
    expect(getComputedStyle(placeholder).color).toBe(resolved('--rk-fg-muted', placeholder));
  },
};

/**
 * Open: the popover on the row under the trigger, its left edge in the
 * trigger's first column, so its rows start in the value's column; the
 * selected row in reverse with the check, the cursor on the row the keyboard
 * is on. Read back off the page, overlay and all, as the model draws it.
 */
export const Open: Story = {
  render: () => (
    <Frame title="settings" cols={WIDE} rows={10}>
      <Form>
        <Themes defaultSelectedKey="phosphor" defaultOpen />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'settings' });
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    // React Aria puts the cursor on the selected option when it opens.
    await waitFor(() => expect(option('phosphor').dataset.focused).toBe('true'));
    await measured(document.body);
    expect(inside(frame)).toBe(model({ value: 'phosphor', open: true, cursor: 'phosphor' }));

    // The popover's rows start in the value's column, whole cells either way.
    const value = triggerOf(frame).querySelector('.rk-select-value') as HTMLElement;
    const row = option('ink');
    const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-width'));
    expect(
      Math.round((row.getBoundingClientRect().left - value.getBoundingClientRect().left) / cell),
    ).toBe(0);

    const selected = option('phosphor');
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(getComputedStyle(selected).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(selected.querySelector('.rk-list-check')?.textContent).toBe(
      themeGlyphs.default.mark.check,
    );
  },
};

/**
 * Keyboard walkthrough: Tab reaches the trigger; type-ahead selects with the
 * popover closed; Space opens it with the cursor on the value; the arrows
 * move, skipping a disabled option; Enter chooses and closes, returning focus
 * to the trigger; Escape closes without choosing. Nothing moves a cell.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={WIDE} rows={10}>
      <Form>
        <Themes defaultSelectedKey="ink" disabled="ice" />
        <Button>after</Button>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const trigger = canvas.getByRole('button', { name: /Theme/ });
    const before = box(trigger);

    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(getComputedStyle(trigger).outlineStyle).toBe('solid');

    // Type-ahead, closed: "p" chooses phosphor without opening anything.
    await userEvent.keyboard('p');
    await waitFor(() => expect(trigger).toHaveAccessibleName(expect.stringContaining('phosphor')));
    expect(document.querySelector('[role="listbox"]')).toBeNull();

    // Space opens it, the cursor on the chosen option.
    await userEvent.keyboard(' ');
    await waitFor(() => expect(option('phosphor')).toHaveFocus());
    // Down moves past the disabled "ice" to "tokyo-night".
    await userEvent.keyboard('{ArrowDown}');
    expect(option('tokyo-night')).toHaveFocus();
    expect(option('tokyo-night').querySelector('.rk-list-cursor')?.textContent).toBe(
      themeGlyphs.default.mark.cursor,
    );
    // Enter chooses and closes, and focus goes back to the trigger.
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName(expect.stringContaining('tokyo-night'));

    // Escape closes without choosing.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    await userEvent.keyboard('{ArrowUp}{Escape}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull());
    expect(trigger).toHaveAccessibleName(expect.stringContaining('tokyo-night'));

    await userEvent.tab();
    expect(canvas.getByRole('button', { name: 'after' })).toHaveFocus();
    expect(box(trigger)).toEqual(before);
  },
};

/** Hover underlines the value, press reverses it, and neither moves a cell. */
export const HoverAndPress: Story = {
  name: 'Hover and press',
  render: () => (
    <Frame title="pointer" cols={WIDE} rows={3}>
      <Form>
        <Themes defaultSelectedKey="ink" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await settled();
    const trigger = canvas.getByRole('button', { name: /Theme/ });
    const value = trigger.querySelector('.rk-select-value') as HTMLElement;
    const before = box(trigger);
    await userEvent.hover(trigger);
    await waitFor(() => expect(trigger.dataset.hovered).toBe('true'));
    expect(getComputedStyle(value).textDecorationLine).toBe('underline');
    expect(box(trigger)).toEqual(before);
    await userEvent.pointer({ keys: '[MouseLeft>]', target: trigger });
    await waitFor(() => expect(trigger.dataset.pressed).toBe('true'));
    expect(getComputedStyle(value).backgroundColor).toBe(resolved('--rk-fg-default', value));
    expect(box(trigger)).toEqual(before);
    await userEvent.pointer({ keys: '[/MouseLeft]', target: trigger });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).toBeNull());
  },
};

/**
 * In a form with native validation: a required select with nothing chosen
 * stops the submit, the error is drawn under it with the cross, and the
 * hidden native select carries the value when one is chosen.
 */
export const InAForm: Story = {
  name: 'In a form, validated and submitted',
  render: function Render() {
    return (
      <Frame title="new repository" cols={WIDE} rows={8}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            e.currentTarget.dataset.submitted = String(data.get('theme'));
          }}
        >
          <Themes name="theme" isRequired description="How it draws." />
          <Button type="submit">Create</Button>
        </Form>
      </Frame>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    await settled();
    const trigger = canvas.getByRole('button', { name: /Theme/ });
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    // Required: the mark after the label.
    const label = canvasElement.querySelector('.rk-select .rk-label-mark');
    expect(label?.textContent).toBe(themeGlyphs.default.mark.required);

    await userEvent.click(canvas.getByRole('button', { name: 'Create' }));
    const error = await waitFor(() => {
      const el = canvasElement.querySelector('.rk-field-error');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(form.dataset.submitted).toBeUndefined();
    expect(error.querySelector('.rk-field-error-mark')?.textContent).toBe(
      themeGlyphs.default.mark.cross,
    );
    // The delimiters go to danger.
    const end = trigger.querySelector('.rk-select-end') as HTMLElement;
    expect(getComputedStyle(end).color).toBe(resolved('--rk-border-danger', end));
    // The error and the description describe the trigger.
    const described = trigger.getAttribute('aria-describedby') ?? '';
    expect(described.split(' ')).toContain(error.id);

    // Choose one and submit: the hidden native select carries it.
    await userEvent.click(trigger);
    await userEvent.click(option('ice'));
    await userEvent.click(canvas.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(form.dataset.submitted).toBe('ice'));
  },
};

/** Disabled: dimmed, not a tab stop, and the same cells. */
export const Disabled: Story = {
  render: () => (
    <Frame title="disabled" cols={WIDE} rows={3}>
      <Form>
        <Themes defaultSelectedKey="ink" isDisabled />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'disabled' });
    expect(inside(frame)).toBe(model({ value: 'ink', disabled: true }));
    const trigger = canvas.getByRole('button', { name: /Theme/ });
    expect(trigger).toBeDisabled();
    expect(getComputedStyle(trigger).color).toBe(resolved('--rk-fg-disabled', trigger));
  },
};

/** Every density: the same cells, one row a trigger and one an option, whatever a row is. */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={WIDE} rows={3}>
            <Form>
              <Themes defaultSelectedKey="phosphor" />
            </Form>
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const frame = canvas.getByRole('group', { name: density });
      expect(inside(frame)).toBe(model({ value: 'phosphor' }));
      const cell = Number.parseFloat(getComputedStyle(frame).getPropertyValue('--rk-cell-height'));
      expect(Math.round(triggerOf(frame).getBoundingClientRect().height / cell)).toBe(1);
    }
  },
};

/** At 200%, open: one select, which the zoom browser reads at every density itself. */
export const Zoom: Story = {
  tags: ['zoom'],
  render: () => (
    <Frame title="zoom" cols={WIDE} rows={10}>
      <Form>
        <Themes defaultSelectedKey="phosphor" defaultOpen />
      </Form>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
  },
};

/** Touch: the trigger and every option a finger's height, and a tap chooses. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={WIDE} rows={3}>
        <Form>
          <Themes defaultSelectedKey="ink" />
        </Form>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const trigger = canvas.getByRole('button', { name: /Theme/ });
    expect(trigger.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    await userEvent.click(trigger);
    const ice = await waitFor(() => option('ice'));
    expect(ice.getBoundingClientRect().height).toBeGreaterThanOrEqual(44 - 0.5);
    await userEvent.click(ice);
    await waitFor(() => expect(trigger).toHaveAccessibleName(expect.stringContaining('ice')));
  },
};

/** The ASCII repertoire: the same cells, every one of them ASCII. */
export const Ascii: Story = {
  name: 'ASCII',
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" cols={WIDE} rows={3}>
        <Form>
          <Themes defaultSelectedKey="ink" />
        </Form>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'ascii' });
    expect(inside(frame)).toBe(
      toText(
        formBuffer(
          [
            {
              label: 'Theme',
              control: selectBuffer(
                { cols: COLS, options: options(), value: 'ink' },
                glyphsFor({ borderSet: 'ascii' }),
              ),
            },
          ],
          { width: WIDE - 4 },
        ),
      ),
    );
  },
};

/** Dark mode, open: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={WIDE} rows={10}>
      <Form>
        <Themes defaultSelectedKey="phosphor" defaultOpen />
      </Form>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await waitFor(() => expect(option('phosphor')).toHaveAttribute('aria-selected', 'true'));
  },
};

/** Forced colors, open: the selected row is the reader's text and canvas swapped. */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced" cols={WIDE} rows={10}>
      <Form>
        <Themes defaultSelectedKey="phosphor" defaultOpen />
      </Form>
    </Frame>
  ),
  play: async () => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const selected = await waitFor(() => option('phosphor'));
    expect(getComputedStyle(selected).backgroundColor).toBe(resolved('CanvasText', selected));
  },
};

/** At `strict`, closed: every box in whole cells, with no declared exception. */
export const Strict: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="strict" cols={WIDE} rows={3}>
      <Form>
        <Themes defaultSelectedKey="ink" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.rkConformance).toBe('strict');
    expect(inside(canvas.getByRole('group', { name: 'strict' }))).toBe(model({ value: 'ink' }));
  },
};
