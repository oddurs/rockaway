import { toText } from '@rockaway/grid';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  checkboxBuffer,
  Form,
  Frame,
  GlyphProvider,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  args: { children: 'Sign commits' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

const { mark } = themeGlyphs.default;

/** The cell a screen measured, read off the nearest screen. */
function cellOf(el: Element): { width: number; height: number } {
  const style = getComputedStyle(el.closest('.rk-screen') ?? el);
  return {
    width: Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
    height: Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
  };
}

/** Pixels as whole cells, asserting they are whole. */
function cells(px: number, cell: number): number {
  const n = px / cell;
  expect(Math.abs(n - Math.round(n)) * cell).toBeLessThan(0.5);
  return Math.round(n);
}

/** The row a checkbox's input is in. */
const rowOf = (box: Element): HTMLElement => box.closest('.rk-checkbox-row') as HTMLElement;

/** The glyph in a checkbox's mark cell. */
const markIn = (box: Element): string =>
  rowOf(box).querySelector('.rk-checkbox-mark')?.textContent ?? '';

/** What a token resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/**
 * Checked, unchecked and indeterminate: one glyph apart, read back off the
 * page as the model draws them, cell for cell.
 */
export const States: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="states" cols={30} rows={5}>
      <div style={{ display: 'grid' }}>
        <Checkbox defaultSelected>Sign commits</Checkbox>
        <Checkbox>Sign commits</Checkbox>
        <Checkbox isIndeterminate>Sign commits</Checkbox>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'states' });
    const shot = screenshot(frame, { legend: false })
      .split('\n')
      .slice(1, 4)
      .map((row) => row.slice(2, 28).trimEnd());
    expect(shot).toEqual(
      (['checked', 'unchecked', 'indeterminate'] as const).map((m) =>
        toText(checkboxBuffer('Sign commits', { mark: m })),
      ),
    );
    const [checked, unchecked, mixed] = canvas.getAllByRole('checkbox');
    if (!checked || !unchecked || !mixed) throw new Error('three checkboxes');
    expect(checked).toBeChecked();
    expect(unchecked).not.toBeChecked();
    expect((mixed as HTMLInputElement).indeterminate).toBe(true);
    expect([markIn(checked), markIn(unchecked), markIn(mixed)]).toEqual([
      mark.check,
      mark.blank,
      mark.dash,
    ]);
    // The name is the words: the box and the marks are chrome.
    expect(canvas.getByRole('checkbox', { name: 'Sign commits', checked: true })).toBe(checked);
  },
};

/** The whole row toggles: pressing the words checks the box. */
export const WholeRow: Story = {
  name: 'The whole row toggles',
  render: () => (
    <Frame title="row" cols={30} rows={3}>
      <Checkbox>Sign commits</Checkbox>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const box = canvas.getByRole('checkbox', { name: 'Sign commits' });
    const row = rowOf(box);
    const cell = cellOf(row);
    // One row, as wide as its cells: the box, the air, the words, the mark's cell.
    const r = row.getBoundingClientRect();
    expect([cells(r.width, cell.width), cells(r.height, cell.height)]).toEqual([
      3 + 1 + 'Sign commits'.length + 1,
      1,
    ]);
    await userEvent.click(row.querySelector('.rk-checkbox-label') as Element);
    expect(box).toBeChecked();
    await userEvent.click(row.querySelector('.rk-checkbox-box') as Element);
    expect(box).not.toBeChecked();
  },
};

/** Keyboard alone: Tab to it, Space toggles it, and focus is the ring around the row. */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={30} rows={4}>
      <div style={{ display: 'grid' }}>
        <Checkbox>Sign commits</Checkbox>
        <Checkbox>Push tags</Checkbox>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const sign = canvas.getByRole('checkbox', { name: 'Sign commits' });
    await userEvent.tab();
    expect(sign).toHaveFocus();
    expect(rowOf(sign).dataset.focusVisible).toBe('true');
    expect(getComputedStyle(rowOf(sign)).outlineStyle).toBe('solid');
    await userEvent.keyboard(' ');
    expect(sign).toBeChecked();
    expect(markIn(sign)).toBe(mark.check);
    await userEvent.tab();
    expect(canvas.getByRole('checkbox', { name: 'Push tags' })).toHaveFocus();
  },
};

/**
 * Hover underlines the words, pressed reverses the box, disabled dims,
 * read-only drops the delimiters, invalid colours them and puts the error
 * under the row, required draws the mark after the words. None moves a cell.
 */
export const Every: Story = {
  name: 'Every state',
  render: () => (
    <Frame title="every state" cols={36} rows={11}>
      <Form validationErrors={{ terms: 'Accept the terms to go on.' }}>
        <Checkbox>Rest</Checkbox>
        <Checkbox isDisabled defaultSelected>
          Disabled
        </Checkbox>
        <Checkbox isReadOnly defaultSelected>
          Read-only
        </Checkbox>
        <Checkbox name="terms">Invalid</Checkbox>
        <Checkbox isRequired>Required</Checkbox>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const box = (name: string) => canvas.getByRole('checkbox', { name });
    const widths = ['Rest', 'Disabled', 'Read-only', 'Invalid', 'Required'].map((name) => {
      const r = rowOf(box(name)).querySelector('.rk-checkbox-box')?.getBoundingClientRect();
      return [r?.left, r?.width, r?.height];
    });
    for (const w of widths) expect(w).toEqual(widths[0]);

    const rest = rowOf(box('Rest'));
    await userEvent.hover(rest);
    await waitFor(() => expect(rest.dataset.hovered).toBe('true'));
    const words = rest.querySelector('.rk-checkbox-label') as Element;
    expect(getComputedStyle(words).textDecorationLine).toBe('underline');
    await userEvent.unhover(rest);

    await userEvent.pointer({ keys: '[MouseLeft>]', target: rest });
    expect(rest.dataset.pressed).toBe('true');
    const square = rest.querySelector('.rk-checkbox-box') as Element;
    expect(getComputedStyle(square).backgroundColor).toBe(resolved('--rk-fg-default', rest));
    fireEvent.pointerUp(rest, { pointerId: 1, pointerType: 'mouse', button: 0 });
    await waitFor(() => expect(rest.dataset.pressed).toBeUndefined());

    expect(box('Disabled')).toBeDisabled();
    expect(getComputedStyle(rowOf(box('Disabled'))).color).toBe(resolved('--rk-fg-disabled', rest));
    const ends = (name: string) =>
      [...rowOf(box(name)).querySelectorAll('.rk-checkbox-end')].map((e) => e.textContent);
    expect(ends('Read-only')).toEqual([mark.blank, mark.blank]);
    expect(markIn(box('Read-only'))).toBe(mark.check);

    expect(box('Invalid')).toHaveAttribute('aria-invalid', 'true');
    expect(canvas.getByText('Accept the terms to go on.')).toBeVisible();
    const end = rowOf(box('Invalid')).querySelector('.rk-checkbox-end') as Element;
    expect(getComputedStyle(end).color).toBe(resolved('--rk-border-danger', rest));

    expect(box('Required')).toBeRequired();
    expect(rowOf(box('Required')).querySelector('.rk-label-mark')?.textContent).toBe(mark.required);
  },
};

/** A group: a Fieldset with its name in the frame's top edge, one row per checkbox. */
export const Group: Story = {
  render: () => (
    <Frame title="group" cols={40} rows={8}>
      <Form>
        <CheckboxGroup
          label="Branches"
          isRequired
          defaultValue={['main']}
          description="Where the hooks run."
        >
          <Checkbox value="main">main</Checkbox>
          <Checkbox value="develop">develop</Checkbox>
        </CheckboxGroup>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const group = canvas.getByRole('group', { name: 'Branches' });
    expect(group.querySelector('.rk-frame .rk-row')?.textContent).toMatch(/^┌ Branches\* ─+┐$/);
    // The legend carries the mark once; the rows carry none.
    for (const box of canvas.getAllByRole('checkbox')) {
      expect(rowOf(box).querySelector('.rk-label-mark')?.textContent).toBe(mark.blank);
    }
    await userEvent.click(canvas.getByText('develop'));
    expect(canvas.getByRole('checkbox', { name: 'develop' })).toBeChecked();
    expect(group).toHaveAttribute('aria-describedby');
  },
};

/** On submit, a required group with nothing checked shows its error and goes heavy. */
export const GroupOnSubmit: Story = {
  name: 'A group on submit',
  render: () => (
    <Frame title="submit" cols={40} rows={10}>
      <Form>
        <CheckboxGroup label="Branches" isRequired>
          <Checkbox value="main">main</Checkbox>
          <Checkbox value="develop">develop</Checkbox>
        </CheckboxGroup>
        <Button type="submit">Save</Button>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const group = canvas.getByRole('group', { name: 'Branches' });
    await waitFor(() =>
      expect(group.querySelector('.rk-frame .rk-row')?.textContent).toMatch(/^┏ Branches\* ━+┓$/),
    );
    expect(group.querySelector('.rk-field-error')).not.toBeNull();
    expect(canvas.getByRole('checkbox', { name: 'main' })).toHaveFocus();
  },
};

/** At every density a row is one cell tall and the same cells across. */
export const Densities: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={30} rows={3}>
            <Checkbox defaultSelected>{`Sign ${density}`}</Checkbox>
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const row = rowOf(canvas.getByRole('checkbox', { name: `Sign ${density}` }));
      const cell = cellOf(row);
      const r = row.getBoundingClientRect();
      expect([cells(r.width, cell.width), cells(r.height, cell.height)]).toEqual([
        3 + 1 + `Sign ${density}`.length + 1,
        1,
      ]);
    }
  },
};

/** Under an ASCII theme every mark is ASCII. */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={30} rows={5}>
        <div style={{ display: 'grid' }}>
          <Checkbox defaultSelected>checked</Checkbox>
          <Checkbox>unchecked</Checkbox>
          <Checkbox isIndeterminate>mixed</Checkbox>
        </div>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(canvas.getAllByRole('checkbox').map(markIn)).toEqual([
      ascii.mark.check,
      ascii.mark.blank,
      ascii.mark.dash,
    ]);
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={30} rows={4}>
      <div style={{ display: 'grid' }}>
        <Checkbox defaultSelected>Sign commits</Checkbox>
        <Checkbox isDisabled>Push tags</Checkbox>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const sign = rowOf(canvas.getByRole('checkbox', { name: 'Sign commits' }));
    const check = sign.querySelector('.rk-checkbox-mark') as Element;
    expect(getComputedStyle(check).color).toBe(resolved('--rk-fg-accent', sign));
  },
};

/** Touch density: the row is a cell tall, and the cell a finger's height. */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={30} rows={3}>
        <Checkbox>Sign commits</Checkbox>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const row = rowOf(canvas.getByRole('checkbox', { name: 'Sign commits' }));
    expect(cells(row.getBoundingClientRect().height, cellOf(row).height)).toBe(1);
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

/** Forced colors: the marks carry every state, disabled is the reader's grey. */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={30} rows={5}>
      <div style={{ display: 'grid' }}>
        <Checkbox defaultSelected>checked</Checkbox>
        <Checkbox isIndeterminate>mixed</Checkbox>
        <Checkbox isDisabled>disabled</Checkbox>
      </div>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const [checked, mixed, disabled] = canvas.getAllByRole('checkbox');
    if (!checked || !mixed || !disabled) throw new Error('three checkboxes');
    expect([markIn(checked), markIn(mixed)]).toEqual([mark.check, mark.dash]);
    expect(getComputedStyle(rowOf(disabled)).color).toBe(resolved('GrayText', rowOf(disabled)));
  },
};

/** A group's frame is the same cells under both painters; the rows are text under either. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame key={painter} title={painter} painter={painter} cols={24} rows={6}>
          <CheckboxGroup label="Branches" defaultValue={['main']}>
            <Checkbox value="main">main</Checkbox>
            <Checkbox value="develop">develop</Checkbox>
          </CheckboxGroup>
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const [glyph, rule] = ['glyph', 'rule'].map((painter) =>
      screenshot(canvas.getByRole('group', { name: painter }), { legend: false })
        .split('\n')
        .slice(1, 5)
        .map((row) => row.slice(2, 22))
        .join('\n'),
    );
    expect(glyph).toBe(rule);
    expect(glyph?.split('\n')[1]).toContain(toText(checkboxBuffer('main', { mark: 'checked' })));
  },
};
