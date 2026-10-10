import { toText } from '@rockaway/grid';
import {
  Button,
  Form,
  Frame,
  formBuffer,
  GlyphProvider,
  TextField,
  textFieldBuffer,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';
import { measured } from '../settled.ts';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: { layout: 'centered' },
  args: { label: 'Name' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

const LONG = 'a value far longer than its box';
const { mark } = themeGlyphs.default;

/** The cell a screen measured, read off the nearest screen. */
function cellOf(el: Element): { width: number; height: number } {
  const screen = el.closest('.rk-screen') ?? el;
  const style = getComputedStyle(screen);
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

/** The cells either side of a field's text, as the page shows them. */
function ends(field: Element): string[] {
  return [...field.querySelectorAll('.rk-text-field-end')].map((el) => el.textContent ?? '');
}

/** The field a control belongs to. */
const fieldOf = (control: Element): HTMLElement => control.closest('.rk-text-field') as HTMLElement;

/** The inside of a frame's screenshot: within the border and the pad. */
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

/**
 * A scroll position as whole cells, to within a device pixel. Chromium keeps
 * a scroll position in fractions of a pixel, so the field puts it exactly on
 * a cell; WebKit keeps it in whole device pixels, so the nearest it can be to
 * a cell that starts on a fraction of a pixel is within one.
 */
function scrolledCells(px: number, cell: number): number {
  const n = Math.round(px / cell);
  expect(Math.abs(px - n * cell)).toBeLessThan(1 / window.devicePixelRatio + 1e-3);
  return n;
}

/** A scroll the browser was asked for, once the field has had a frame to round it. */
async function scrollTo(el: HTMLElement, axis: 'x' | 'y', px: number): Promise<void> {
  if (axis === 'x') el.scrollLeft = px;
  else el.scrollTop = px;
  el.dispatchEvent(new Event('scroll'));
  for (let i = 0; i < 2; i++) await new Promise((done) => requestAnimationFrame(done));
}

/** Relative luminance, which is all greyscale keeps of a colour. */
function luminance(colour: string): number {
  // Tokens compute to oklch(); a canvas pixel is the colour in sRGB, whatever it was written in.
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new Error('no 2d canvas');
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** What a token resolves to here, as a computed colour. */
function resolved(colour: string, within: Element): string {
  const probe = document.createElement('span');
  probe.style.color = colour.startsWith('--') ? `var(${colour})` : colour;
  within.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** The painted top edge of a framed field. */
const edge = (field: Element): string =>
  field.querySelector('.rk-frame .rk-row')?.textContent ?? '';

const WIDE = 68;

/** Every size of box in one form, as the model says it is drawn. */
function sizes(): ReturnType<typeof formBuffer> {
  return formBuffer(
    [
      { label: 'Name', control: textFieldBuffer({}) },
      {
        label: 'Email',
        required: true,
        control: textFieldBuffer({}),
        description: 'Where the receipts go.',
      },
      { control: textFieldBuffer({ size: 'lg', label: 'Repository' }) },
      { control: textFieldBuffer({ multiline: true, rows: 2, label: 'Message' }) },
    ],
    { comfort: 'compact', width: WIDE - 4 },
  );
}

/**
 * `md`, `lg` and `multiline` in a form, read back off the page: the model,
 * cell for cell. An input's value is not text on the page, so the boxes are
 * empty in both.
 */
export const Sizes: Story = {
  // Held to the strictest level: every box in it a whole number of cells.
  // Strict is structure only (0311), so the form is the compact one.
  globals: { conformance: 'strict' },
  render: () => (
    <Frame title="new repository" cols={WIDE} rows={sizes().height + 2}>
      <Form comfort="compact">
        <TextField label="Name" />
        <TextField label="Email" isRequired description="Where the receipts go." />
        <TextField label="Repository" size="lg" />
        <TextField label="Message" multiline rows={2} />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const frame = canvas.getByRole('group', { name: 'new repository' });
    await waitFor(() =>
      expect(inside(screenshot(frame, { legend: false }), WIDE)).toBe(toText(sizes())),
    );
    // Each box is the cells it says.
    const cell = cellOf(frame);
    const name = canvas.getByRole('textbox', { name: 'Name' }).getBoundingClientRect();
    expect([cells(name.width, cell.width), cells(name.height, cell.height)]).toEqual([20, 1]);
    const message = canvas.getByRole('textbox', { name: 'Message' }).getBoundingClientRect();
    expect([cells(message.width, cell.width), cells(message.height, cell.height)]).toEqual([20, 2]);
    const repository = fieldOf(canvas.getByRole('textbox', { name: 'Repository' }));
    const box = repository.querySelector('.rk-field-frame')?.getBoundingClientRect();
    expect([cells(box?.width ?? 0, cell.width), cells(box?.height ?? 0, cell.height)]).toEqual([
      24, 3,
    ]);
  },
};

/** The comfortable form as text: the model the next story is read against. */
function comfortable(): ReturnType<typeof formBuffer> {
  return formBuffer(
    [
      { label: 'Name', control: textFieldBuffer({}), box: true },
      {
        label: 'Email',
        required: true,
        control: textFieldBuffer({}),
        box: true,
        description: 'Where the receipts go.',
      },
      { control: textFieldBuffer({ size: 'lg', label: 'Repository' }) },
    ],
    { width: WIDE - 4 },
  );
}

/**
 * Comfortable, the default (0316): each label over its box, the box padded
 * half a row above and below so its one row of text sits in two, the help
 * half a row under it, and each field closed to whole rows. Read back off the
 * page, cell for cell, at every density, and held to `standard`: the padding
 * is rhythm, and every field's outer box is still whole rows.
 */
export const Comfortable: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={WIDE} rows={comfortable().height + 2}>
            <Form>
              <TextField label="Name" />
              <TextField label="Email" isRequired description="Where the receipts go." />
              <TextField label="Repository" size="lg" />
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
      expect(inside(screenshot(frame, { legend: false }), WIDE), density).toBe(
        toText(comfortable()),
      );
      const cell = cellOf(frame);
      // The text is one row; the box around it is two, and every field is whole rows.
      for (const field of frame.querySelectorAll<HTMLElement>('.rk-field')) {
        const rows = field.getBoundingClientRect().height / cell.height;
        expect(Math.abs(rows - Math.round(rows)), `${density}: ${rows} rows`).toBeLessThan(1 / 32);
      }
      const box = frame.querySelector('.rk-text-field-box')?.getBoundingClientRect();
      expect(cells(box?.height ?? 0, cell.height)).toBe(2);
    }
  },
};

/**
 * The keyboard is the platform's: Tab in, type, Tab on. A framed box goes heavy
 * while it has keyboard focus, and back when it loses it.
 */
export const Keyboard: Story = {
  render: () => (
    <Frame title="keyboard" cols={48} rows={8}>
      <Form>
        <TextField label="Name" />
        <TextField label="Repository" size="lg" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const name = canvas.getByRole('textbox', { name: 'Name' });
    const repository = canvas.getByRole('textbox', { name: 'Repository' });
    await userEvent.tab();
    expect(name).toHaveFocus();
    await userEvent.keyboard('Ada');
    expect(name).toHaveValue('Ada');
    expect(edge(fieldOf(repository))).toMatch(/^┌ Repository ─+┐$/);
    await userEvent.tab();
    expect(repository).toHaveFocus();
    await waitFor(() => expect(edge(fieldOf(repository))).toMatch(/^┏ Repository ━+┓$/));
    await userEvent.tab({ shift: true });
    expect(name).toHaveFocus();
    await waitFor(() => expect(edge(fieldOf(repository))).toMatch(/^┌ Repository ─+┐$/));
  },
};

/**
 * Typing reaches the app: a controlled field and an uncontrolled one each
 * take every keystroke, a single row and a box of rows, and `onChange` is
 * called with the text. The field keeps its text on whole cells by listening
 * to its own input events, and that work happens after the event, never
 * during it, or React would put the old value back before its own handler
 * saw the new one.
 */
function Typed(): ReactNode {
  const [name, setName] = useState('abc');
  const [notes, setNotes] = useState('');
  const [heard, setHeard] = useState<readonly string[]>([]);
  return (
    <Frame title="typed" cols={48} rows={14}>
      <Form>
        <TextField
          label="Name"
          value={name}
          onChange={(next) => {
            setName(next);
            setHeard((was) => [...was, `name ${next}`]);
          }}
        />
        <TextField
          label="Notes"
          rows={2}
          value={notes}
          onChange={(next) => {
            setNotes(next);
            setHeard((was) => [...was, `notes ${next}`]);
          }}
        />
        <TextField
          label="Free"
          defaultValue="abc"
          onChange={(next) => setHeard((was) => [...was, `free ${next}`])}
        />
      </Form>
      <output data-testid="heard">{heard.at(-1) ?? ''}</output>
    </Frame>
  );
}

export const Typing: Story = {
  render: () => <Typed />,
  play: async ({ canvas }) => {
    // Real keys, through the browser: a synthetic event dispatched from a
    // script runs every listener in one stack, and hides what goes wrong
    // between them.
    const run = runner();
    if (!run) return;
    await measured(document.body);
    const heard = canvas.getByTestId('heard');
    /** Focus a box with its caret at the end, and type into it for real. */
    const type = async (box: HTMLElement, keys: string): Promise<void> => {
      const field = box as HTMLInputElement | HTMLTextAreaElement;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
      await run.type(keys);
    };

    const name = canvas.getByRole('textbox', { name: 'Name' });
    await type(name, 'Z');
    await waitFor(() => expect(name).toHaveValue('abcZ'));
    expect(heard).toHaveTextContent('name abcZ');

    const notes = canvas.getByRole('textbox', { name: 'Notes' });
    await type(notes, 'hi');
    await waitFor(() => expect(notes).toHaveValue('hi'));
    expect(heard).toHaveTextContent('notes hi');

    const free = canvas.getByRole('textbox', { name: 'Free' });
    await type(free, 'Z');
    await waitFor(() => expect(free).toHaveValue('abcZ'));
    expect(heard).toHaveTextContent('free abcZ');
  },
};

/**
 * Text longer than the box scrolls inside it by whole cells, and the box
 * never grows. The overflow marks stand in the cells either side while text
 * is hidden that way.
 */
export const Overflow: Story = {
  // The classic-scrollbars browser runs this again with bars that take room.
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="overflow" cols={40} rows={8}>
      <Form>
        <TextField label="Path" cols={10} defaultValue={LONG} />
        <TextField label="Remote" cols={10} size="lg" defaultValue={LONG} />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const name of ['Path', 'Remote']) {
      const input = canvas.getByRole('textbox', { name }) as HTMLInputElement;
      const field = fieldOf(input);
      const cell = cellOf(input).width;
      const width = input.getBoundingClientRect().width;
      expect(cells(width, cell)).toBe(10);
      const [open, close] = name === 'Path' ? ['[', ']'] : [mark.blank, mark.blank];

      // At the start: more to the right.
      await scrollTo(input, 'x', 0);
      expect(ends(field)).toEqual([open, mark['overflow-end']]);

      // In the middle, wherever the browser was asked to put it, a whole cell.
      // The field reads its scroll on the next frame, and its own rounding is
      // a scroll of its own, so the marks are waited for rather than read at
      // a fixed frame: a slower engine is a frame or two behind.
      await scrollTo(input, 'x', cell * 3.4);
      await waitFor(() => {
        expect(scrolledCells(input.scrollLeft, cell)).toBe(3);
        expect(ends(field)).toEqual([mark['overflow-start'], mark['overflow-end']]);
      });

      // At the end: more to the left only.
      await scrollTo(input, 'x', 10_000);
      await waitFor(() => expect(ends(field)).toEqual([mark['overflow-start'], close]));

      // And the box never moved.
      expect(input.getBoundingClientRect().width).toBe(width);
    }
  },
};

/**
 * A box of rows scrolls by whole rows and never shows half a line. Its
 * scrollbar is drawn in a cell column; no native one is drawn (0207).
 */
export const Multiline: Story = {
  tags: ['classic-scrollbars'],
  render: () => (
    <Frame title="multiline" cols={40} rows={7}>
      <TextField
        label="Message"
        multiline
        rows={3}
        cols={20}
        defaultValue={'one\ntwo\nthree\nfour\nfive\nsix\nseven'}
      />
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const area = canvas.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement;
    const field = fieldOf(area);
    const row = cellOf(area).height;
    const bar = () => field.querySelector('.rk-text-field-scrollbar')?.textContent ?? '';
    expect(getComputedStyle(area).scrollbarWidth).toBe('none');
    // No bar takes room, whichever browser draws them: the box is its cells.
    expect(area.offsetWidth - area.clientWidth).toBe(0);
    expect(cells(area.getBoundingClientRect().height, row)).toBe(3);

    await scrollTo(area, 'y', 0);
    const top = bar();
    expect(top.startsWith(themeGlyphs.default.block.full)).toBe(true);

    // Asked for a row and a third, it stops on a whole row.
    await scrollTo(area, 'y', row * 1.3);
    expect(cells(area.scrollTop, row)).toBe(1);
    // Asked for most of a second, it stops on the second.
    await scrollTo(area, 'y', row * 1.8);
    expect(cells(area.scrollTop, row)).toBe(2);
    expect(bar()).not.toBe(top);

    // At the end, the last line sits on the last row of the box.
    await scrollTo(area, 'y', 10_000);
    expect(cells(area.scrollTop, row)).toBe(4);
    expect(bar().endsWith(themeGlyphs.default.block.full)).toBe(true);
  },
};

/**
 * Every state that holds still, side by side. None changes the box, and each
 * is told apart without colour: greyscale keeps only luminance, and placeholder,
 * read-only and disabled each differ from a value in it.
 */
export const States: Story = {
  render: () => (
    <div style={{ filter: 'grayscale(1)' }}>
      <Frame title="states" cols={56} rows={20}>
        <Form validationErrors={{ invalid: 'Not a branch name.' }}>
          <TextField label="Value" defaultValue="main" />
          <TextField label="Placeholder" placeholder="a branch" />
          <TextField label="Read-only" defaultValue="main" isReadOnly />
          <TextField label="Disabled" defaultValue="main" isDisabled />
          <TextField label="Invalid" name="invalid" defaultValue="ma in" />
          <TextField label="Required" isRequired />
        </Form>
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const control = (name: string) => canvas.getByRole('textbox', { name }) as HTMLInputElement;
    const boxes = ['Value', 'Placeholder', 'Read-only', 'Disabled', 'Invalid', 'Required'].map(
      (name) => {
        const r = fieldOf(control(name))
          .querySelector('.rk-text-field-box')
          ?.getBoundingClientRect();
        return [r?.left, r?.width, r?.height];
      },
    );
    for (const box of boxes) expect(box).toEqual(boxes[0]);

    // Without colour: luminance is all greyscale has.
    const value = control('Value');
    const text = luminance(getComputedStyle(value).color);
    // The base stylesheet sets a placeholder in fg.muted; a computed style cannot be read off it.
    const placeholder = luminance(resolved('--rk-fg-muted', value.parentElement as Element));
    const disabled = luminance(getComputedStyle(control('Disabled')).color);
    const ground = luminance(getComputedStyle(value).backgroundColor);
    expect(Math.abs(text - placeholder)).toBeGreaterThan(0.05);
    expect(Math.abs(text - disabled)).toBeGreaterThan(0.05);
    expect(getComputedStyle(control('Read-only')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    const page = value.parentElement as Element;
    const pageGround = resolved('--rk-bg-page', page);
    expect(Math.abs(ground - luminance(pageGround))).toBeGreaterThan(0.005);
    // Read-only is the value alone: its delimiters' cells are blank.
    expect(ends(fieldOf(control('Read-only')))).toEqual([mark.blank, mark.blank]);
    expect(control('Read-only')).toHaveAttribute('readonly');
    expect(control('Disabled')).toBeDisabled();

    // Invalid: the error row, and the delimiters in border.danger.
    expect(control('Invalid')).toHaveAttribute('aria-invalid', 'true');
    expect(canvas.getByText('Not a branch name.')).toBeVisible();
    const end = fieldOf(control('Invalid')).querySelector('.rk-text-field-end') as Element;
    expect(getComputedStyle(end).color).toBe(resolved('--rk-border-danger', end));
    expect(control('Required')).toBeRequired();
  },
};

/** On submit, native validation: focus to the first empty required field, and its error. */
export const OnSubmit: Story = {
  name: 'Errors on submit',
  render: () => (
    <Frame title="sign in" cols={48} rows={12}>
      <Form>
        <TextField label="User" isRequired />
        <TextField label="Note" size="lg" isRequired />
        <Button type="submit">Sign in</Button>
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    const user = canvas.getByRole('textbox', { name: 'User' });
    await waitFor(() => expect(user).toHaveFocus());
    expect(user).toHaveAttribute('aria-invalid', 'true');
    const note = canvas.getByRole('textbox', { name: 'Note' });
    await waitFor(() => expect(edge(fieldOf(note))).toMatch(/^┏ Note\* ━+┓$/));
  },
};

/** At every density the box is the same cells: taller cells, the same count. */
export const Densities: Story = {
  globals: { conformance: 'strict' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--rk-y-1)' }}>
      {(['dense', 'normal', 'airy', 'touch'] as const).map((density) => (
        <div key={density} data-density={density}>
          <Frame title={density} cols={40} rows={8}>
            <Form comfort="compact">
              <TextField label={`Name ${density}`} cols={12} />
              <TextField label={`Path ${density}`} cols={12} size="lg" />
            </Form>
          </Frame>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const name = canvas.getByRole('textbox', { name: `Name ${density}` });
      const cell = cellOf(name);
      const box = name.getBoundingClientRect();
      expect([cells(box.width, cell.width), cells(box.height, cell.height)]).toEqual([12, 1]);
      const frame = fieldOf(canvas.getByRole('textbox', { name: `Path ${density}` }))
        .querySelector('.rk-field-frame')
        ?.getBoundingClientRect();
      expect([
        cells(frame?.width ?? 0, cell.width),
        cells(frame?.height ?? 0, cell.height),
      ]).toEqual([16, 3]);
    }
  },
};

/** Both painters draw the framed box's edge in the same cells. */
export const Painters: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
      {(['glyph', 'rule'] as const).map((painter) => (
        <Frame key={painter} title={painter} painter={painter} cols={24} rows={5}>
          <TextField label="Path" cols={12} size="lg" />
        </Frame>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const [glyph, rule] = ['glyph', 'rule'].map((painter) =>
      screenshot(canvas.getByRole('group', { name: painter }), { legend: false })
        .split('\n')
        .slice(1, 4)
        .map((row) => row.slice(2, 18))
        .join('\n'),
    );
    expect(glyph).toBe(rule);
    expect(glyph).toBe(toText(textFieldBuffer({ cols: 12, size: 'lg', label: 'Path' })));
  },
};

/**
 * Under an ASCII theme the marks are ASCII, and a framed box that goes heavy
 * keeps its `+-|` and goes bold (0183): the font draws ASCII, and bold is the
 * weight it has.
 */
export const Ascii: Story = {
  render: () => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Frame title="ascii" border="ascii" cols={40} rows={9}>
        <Form validationErrors={{ remote: 'No such remote.' }}>
          <TextField label="Path" cols={10} defaultValue={LONG} />
          <TextField label="Remote" name="remote" cols={10} size="lg" />
        </Form>
      </Frame>
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const path = canvas.getByRole('textbox', { name: 'Path' });
    await waitFor(() => expect(ends(fieldOf(path))).toEqual(['[', ascii.mark['overflow-end']]));
    const remote = fieldOf(canvas.getByRole('textbox', { name: 'Remote' }));
    expect(edge(remote)).toMatch(/^\+ Remote -+\+$/);
    const corner = remote.querySelector('.rk-frame .rk-run') as HTMLElement;
    expect(corner.dataset.attrs ?? '').toContain('bold');
    expect(Number(getComputedStyle(corner).fontWeight)).toBeGreaterThanOrEqual(700);
  },
};

/** Dark mode: the same cells, the dark palette, and axe on it. */
export const Dark: Story = {
  globals: { mode: 'dark' },
  render: () => (
    <Frame title="dark" cols={48} rows={8}>
      <Form>
        <TextField label="Name" defaultValue="Ada" />
        <TextField label="Repository" size="lg" placeholder="owner/name" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(document.documentElement.dataset.theme).toBe('dark');
    const name = canvas.getByRole('textbox', { name: 'Name' });
    expect(getComputedStyle(name).color).toBe(
      resolved('--rk-fg-default', name.parentElement as Element),
    );
  },
};

/** Touch density: a one-row box is a cell tall, and a cell is 44px (0197). */
export const Touch: Story = {
  render: () => (
    <div data-density="touch">
      <Frame title="touch" cols={40} rows={3}>
        <TextField label="Name" cols={16} />
      </Frame>
    </div>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    const name = canvas.getByRole('textbox', { name: 'Name' });
    expect(cells(name.getBoundingClientRect().height, cellOf(name).height)).toBe(1);
    expect(name.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

/**
 * Forced colors: the ground is gone, so the delimiters bracket the box; the
 * invalid frame is still heavier; disabled is the reader's grey.
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Frame title="forced colors" cols={48} rows={12}>
      <Form validationErrors={{ remote: 'No such remote.' }}>
        <TextField label="Name" defaultValue="Ada" />
        <TextField label="Disabled" defaultValue="Ada" isDisabled />
        <TextField label="Remote" name="remote" size="lg" />
      </Form>
    </Frame>
  ),
  play: async ({ canvas }) => {
    await measured(document.body);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    expect(ends(fieldOf(canvas.getByRole('textbox', { name: 'Name' })))).toEqual(['[', ']']);
    const disabled = canvas.getByRole('textbox', { name: 'Disabled' });
    expect(getComputedStyle(disabled).color).toBe(
      resolved('GrayText', disabled.parentElement as Element),
    );
    const remote = fieldOf(canvas.getByRole('textbox', { name: 'Remote' }));
    expect(edge(remote)).toMatch(/^┏ Remote ━+┓$/);
  },
};
