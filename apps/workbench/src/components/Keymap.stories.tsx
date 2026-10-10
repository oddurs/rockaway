import { toText } from '@rockaway/grid';
import {
  type Binding,
  Button,
  detectPlatform,
  Frame,
  Keymap,
  KeymapHelp,
  keymapHelpBuffer,
  keyShortcut,
  spokenKeys,
  useKeymap,
} from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useRef, useState } from 'react';
import { Dialog, Heading, Input, Label, Modal, TextField } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { settled } from '../settled.ts';

const meta = {
  title: 'Components/Keymap',
  component: Keymap,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Keymap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The keyboard this browser has, and how userEvent holds its `mod` down. */
const keyboard = (): 'apple' | 'other' => detectPlatform(navigator);
const mod = (key: string): string =>
  keyboard() === 'apple' ? `{Meta>}${key}{/Meta}` : `{Control>}${key}{/Control}`;

/** The page's shortcuts, writing what each did into a line a test can read. */
function Page({ children }: { children?: ReactNode }): ReactNode {
  const [last, setLast] = useState('nothing yet');
  const [row, setRow] = useState(0);
  const bindings: Binding[] = [
    { keys: 'mod+k', description: 'Open the palette', action: () => setLast('palette') },
    { keys: 'g h', description: 'Go home', action: () => setLast('home') },
    { keys: 'g i', description: 'Go to issues', action: () => setLast('issues') },
    { keys: 'j', description: 'Next row', action: () => setRow((r) => r + 1) },
    { keys: 'k', description: 'Previous row', action: () => setRow((r) => r - 1) },
  ];
  useKeymap(bindings);
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <p data-testid="last" style={{ margin: 0 }}>
        {last}
      </p>
      <p data-testid="row" style={{ margin: 0 }}>
        {`row ${row}`}
      </p>
      <TextField>
        <Label>Message</Label> <Input />
      </TextField>
      {children}
    </div>
  );
}

const text = (id: string): string =>
  document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '';

/**
 * A chord fires from anywhere; a two-key sequence fires on its second key,
 * and not once a second has passed; and in a text field a plain key is
 * typing, while a chord with a modifier still fires.
 */
export const ChordsAndSequences: Story = {
  name: 'Chords and sequences',
  render: () => (
    <Keymap>
      <Page />
    </Keymap>
  ),
  play: async ({ canvas }) => {
    await settled();
    await userEvent.keyboard(mod('k'));
    expect(text('last')).toBe('palette');

    await userEvent.keyboard('gh');
    expect(text('last')).toBe('home');
    await userEvent.keyboard('gi');
    expect(text('last')).toBe('issues');

    // The second key a second and more after the first is only itself.
    await userEvent.keyboard('g');
    await new Promise((done) => setTimeout(done, 1100));
    await userEvent.keyboard('h');
    expect(text('last')).toBe('issues');

    await userEvent.keyboard('jjk');
    expect(text('row')).toBe('row 1');

    // In a text field, `g h` and `j` are letters.
    const field = canvas.getByRole('textbox', { name: 'Message' });
    await userEvent.click(field);
    await userEvent.keyboard('ghj');
    expect(field).toHaveValue('ghj');
    expect(text('last')).toBe('issues');
    expect(text('row')).toBe('row 1');
    // A chord with a modifier is not typing, and fires there too.
    await userEvent.keyboard(mod('k'));
    expect(text('last')).toBe('palette');
    expect(field).toHaveValue('ghj');
  },
};

/** A dialog's bindings, in a modal scope inside the page's. */
function Rename({ onClose }: { onClose: () => void }): ReactNode {
  const [row, setRow] = useState(0);
  useKeymap([{ keys: 'j', description: 'Next suggestion', action: () => setRow((r) => r + 1) }]);
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Heading slot="title" style={{ margin: 0, font: 'inherit' }}>
        Rename
      </Heading>
      <p data-testid="suggestion" style={{ margin: 0 }}>{`suggestion ${row}`}</p>
      <KeymapHelp />
      <Button onPress={onClose}>Done</Button>
    </div>
  );
}

/**
 * Scopes: the dialog's `j` shadows the page's while it is open, and its
 * modal scope stands the page's other keys down, `⌘K` included. Closing it
 * gives the page its keys back.
 */
export const Scopes: Story = {
  name: 'A dialog shadows the page',
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <Keymap>
        <Page>
          <Button onPress={() => setOpen(true)}>Rename</Button>
        </Page>
        <Modal isOpen={open} onOpenChange={setOpen} isDismissable>
          <Dialog
            style={{ background: 'var(--rk-bg-page)', padding: 'var(--rk-y-1) var(--rk-x-2)' }}
          >
            <Keymap modal>
              <Rename onClose={() => setOpen(false)} />
            </Keymap>
          </Dialog>
        </Modal>
      </Keymap>
    );
  },
  play: async ({ canvas }) => {
    await settled();
    await userEvent.keyboard('j');
    expect(text('row')).toBe('row 1');

    await userEvent.click(canvas.getByRole('button', { name: 'Rename' }));
    const dialog = await waitFor(() => document.querySelector<HTMLElement>('[role="dialog"]'));
    expect(dialog).not.toBeNull();
    await userEvent.keyboard('j');
    expect(text('suggestion')).toBe('suggestion 1');
    expect(text('row')).toBe('row 1');
    // The page's palette is not the dialog's.
    await userEvent.keyboard(mod('k'));
    expect(text('last')).toBe('nothing yet');
    // The dialog's help lists the dialog's keys, and only those.
    const help = dialog?.querySelector('.rk-keymap-help');
    expect(help?.querySelectorAll('dt')).toHaveLength(1);
    expect(help?.textContent).toContain('Next suggestion');

    const done = [...(dialog?.querySelectorAll('button') ?? [])].find(
      (b) => b.textContent?.trim() === 'Done',
    );
    await userEvent.click(done as HTMLElement);
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await userEvent.keyboard('j');
    expect(text('row')).toBe('row 2');
    await userEvent.keyboard(mod('k'));
    expect(text('last')).toBe('palette');
  },
};

const HELP = [
  { keys: 'mod+k', description: 'Open the palette' },
  { keys: 'g h', description: 'Go home' },
  { keys: 'g i', description: 'Go to issues' },
  { keys: 'j', description: 'Next row' },
  { keys: 'k', description: 'Previous row' },
  { keys: '?', description: 'Show this help' },
];

/** The page's bindings, and a `?` that toggles the help built from them. */
function HelpPage(): ReactNode {
  const [shown, setShown] = useState(true);
  const [pane, setPane] = useState(false);
  useKeymap(
    HELP.map((b) => ({
      ...b,
      action: b.keys === '?' ? () => setShown((s) => !s) : () => {},
    })),
  );
  // A row apart: a focused button's ring must not lie on the frame's edge.
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
      <Frame title="keys" cols={36} rows={HELP.length + 2}>
        {shown ? <KeymapHelp /> : null}
      </Frame>
      <Button onPress={() => setPane((p) => !p)}>Toggle pane</Button>
      {pane ? (
        <Keymap>
          <Pane />
        </Keymap>
      ) : null}
    </div>
  );
}

/** A pane that rebinds `j`, inside the page's keymap. */
function Pane(): ReactNode {
  useKeymap([{ keys: 'j', description: 'Next file', action: () => {} }]);
  return <p style={{ margin: 0 }}>pane</p>;
}

/**
 * The help screen is the keymap: exactly the active bindings, each chord a
 * KeyHint for this keyboard, read back off the page as the model draws them.
 * A pane that rebinds `j` changes the list, and `?` hides it again.
 */
export const Help: Story = {
  name: 'The help screen, generated',
  render: () => (
    <Keymap>
      <HelpPage />
    </Keymap>
  ),
  play: async ({ canvas }) => {
    await settled();
    const frame = canvas.getByRole('group', { name: 'keys' });
    const inside = (): string =>
      screenshot(frame, { legend: false })
        .split('\n')
        .slice(1, -1)
        .map((row) => row.slice(2, -1).trimEnd())
        .join('\n')
        .trimEnd();
    const model = (bindings: typeof HELP) => toText(keymapHelpBuffer(bindings, keyboard()));
    await waitFor(() => expect(inside()).toBe(model(HELP)));

    // Each chord is spoken in words beside the drawn one, for this keyboard.
    const first = frame.querySelector('.rk-keymap-help dt');
    expect(first?.textContent).toContain(spokenKeys('mod+k', keyboard()));

    // A pane that rebinds `j`: its binding replaces the page's in the list.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle pane' }));
    const shadowed = [
      ...HELP.filter((b) => b.keys !== 'j'),
      { keys: 'j', description: 'Next file' },
    ];
    await waitFor(() => expect(inside()).toBe(model(shadowed)));

    // `?` is a binding like any other: it hides the help it is listed in.
    await userEvent.keyboard('?');
    await waitFor(() => expect(frame.querySelector('.rk-keymap-help')).toBeNull());
  },
};

/** A binding whose target is a button: the shortcut presses it, and is announced on it. */
function Announced(): ReactNode {
  const save = useRef<HTMLButtonElement>(null);
  const [saved, setSaved] = useState(0);
  useKeymap([{ keys: 'mod+s', description: 'Save', target: save }]);
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {/* Button passes its ref through (0224), so it can be a binding's target. */}
      <Button ref={save} onPress={() => setSaved((n) => n + 1)}>
        Save
      </Button>
      <p data-testid="saved" style={{ margin: 0 }}>{`saved ${saved}`}</p>
    </div>
  );
}

/**
 * `aria-keyshortcuts` on the element a binding belongs to, for this
 * keyboard, so a reader hears the shortcut where it applies; and the
 * binding, given no action, presses it.
 */
export const OnItsTarget: Story = {
  name: 'Announced on its target',
  render: () => (
    <Keymap>
      <Announced />
    </Keymap>
  ),
  play: async ({ canvas }) => {
    await settled();
    const save = canvas.getByRole('button', { name: 'Save' });
    await waitFor(() =>
      expect(save.getAttribute('aria-keyshortcuts')).toBe(keyShortcut('mod+s', keyboard())),
    );
    await userEvent.keyboard(mod('s'));
    await waitFor(() => expect(text('saved')).toBe('saved 1'));
  },
};

/** Buttons whose `keys` the page's keymap binds, and one outside any keymap. */
function Bound(): ReactNode {
  const [log, setLog] = useState<string[]>([]);
  const did = (what: string) => () => setLog((l) => [...l, what]);
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
      <Keymap>
        <div style={{ display: 'flex', gap: 'var(--rk-x-2)' }}>
          <Button keys="mod+s" onPress={did('saved')}>
            Save
          </Button>
          <Button keys="mod+e" isDisabled onPress={did('exported')}>
            Export
          </Button>
        </div>
        <KeymapHelp />
      </Keymap>
      <p data-testid="log" style={{ margin: 0 }}>
        {log.length === 0 ? 'nothing' : log.join(', ')}
      </p>
    </div>
  );
}

/** The same Button with `keys`, with no keymap around it. */
function Unbound(): ReactNode {
  const [saved, setSaved] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)', justifyItems: 'start' }}>
      <Button keys="mod+s" onPress={() => setSaved((n) => n + 1)}>
        Save
      </Button>
      <p data-testid="unbound" style={{ margin: 0 }}>{`saved ${saved}`}</p>
    </div>
  );
}

/**
 * A Button's `keys`, inside a Keymap, is bound as well as drawn and announced
 * (0225): the chord presses it, and the help screen lists it under its label.
 * A disabled one is not bound. Outside a Keymap nothing changes: the chord is
 * drawn and announced, and the app listens for it.
 */
export const ButtonKeys: Story = {
  name: "A Button's keys, bound",
  render: () => <Bound />,
  play: async ({ canvas }) => {
    await settled();
    const save = canvas.getByRole('button', { name: 'Save' });
    expect(save.getAttribute('aria-keyshortcuts')).toBe(keyShortcut('mod+s', keyboard()));
    await userEvent.keyboard(mod('s'));
    await waitFor(() => expect(text('log')).toBe('saved'));
    // The disabled button's chord is not bound, and not listed.
    await userEvent.keyboard(mod('e'));
    expect(text('log')).toBe('saved');
    const help = canvas.getByRole('definition');
    expect(help).toHaveTextContent('Save');
    expect(document.querySelectorAll('.rk-keymap-help dt')).toHaveLength(1);
  },
};

export const ButtonKeysUnbound: Story = {
  name: "A Button's keys, with no keymap",
  render: () => <Unbound />,
  play: async ({ canvas }) => {
    await settled();
    const save = canvas.getByRole('button', { name: 'Save' });
    // Drawn and announced as ever...
    expect(save.getAttribute('aria-keyshortcuts')).toBe(keyShortcut('mod+s', keyboard()));
    // ...and not bound: with no keymap, the app listens for the chord.
    await userEvent.keyboard(mod('s'));
    expect(text('unbound')).toBe('saved 0');
  },
};

/**
 * Forced colors: the help screen in the reader's palette, its keys and
 * their descriptions still apart. axe and the walk after it run here, where
 * they cannot anywhere else (0142).
 */
export const ForcedColors: Story = {
  name: 'Forced colors',
  tags: ['forced-colors'],
  render: () => (
    <Keymap>
      <HelpPage />
    </Keymap>
  ),
  play: async ({ canvas }) => {
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    await settled();
    expect(canvas.getByRole('group', { name: 'keys' })).toBeVisible();
  },
};
