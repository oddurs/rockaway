import { Button, Frame, GlyphProvider, List, ListItem } from '@rockaway/react';
import { screenshot } from '@rockaway/react/testing';
import { glyphsFor, themeGlyphs, themeNames } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

/** Six files in a three-row list: the other three are scrolled out of view. */
const files = [
  'src/index.ts',
  'src/glyph.ts',
  'src/theme.ts',
  'src/list.ts',
  'src/frame.ts',
  'src/button.ts',
];

/**
 * A theme owns its characters (cairn 0119). Components ask `useGlyphs()` for
 * every glyph they draw, so one provider changes the border set, the check
 * mark, the scrollbar and the delimiters together.
 */
function Screen({ title }: { title: string }) {
  return (
    <Frame title={title} cols={30} rows={7}>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 26)' }}>
        <List aria-label="Files" rows={3} selectionMode="multiple" defaultSelectedKeys={['a']}>
          {files.map((file, i) => (
            <ListItem key={file} id={i === 0 ? 'a' : file} textValue={file}>
              {file}
            </ListItem>
          ))}
        </List>
      </div>
      <Button>Publish</Button>
    </Frame>
  );
}

const meta = {
  title: 'Foundations/Theme glyphs',
  component: Screen,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default theme, with no provider at all. */
export const Default: Story = {
  args: { title: 'default' },
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'default' });
    await waitFor(() => expect(frame.querySelector('.rk-list-scrollbar')?.textContent).toBe('██░'));
    expect(screenshot(frame, { legend: false })).toBe(
      [
        '┌ default ───────────────────┐',
        '│  ✓src/index.ts           █ │',
        '│   src/glyph.ts           █ │',
        '│   src/theme.ts           ░ │',
        '│ [ Publish ]                │',
        '│                            │',
        '└────────────────────────────┘',
      ].join('\n'),
    );
  },
};

/**
 * The same screen under `ascii`: the border set, the check mark, the scrollbar and
 * a truncated title all change, and nothing outside ASCII is left on it.
 */
export const Ascii: Story = {
  args: { title: 'a title too long for its edge' },
  render: (args) => (
    <GlyphProvider glyphs={glyphsFor({ borderSet: 'ascii' })}>
      <Screen {...args} />
    </GlyphProvider>
  ),
  play: async ({ canvas }) => {
    const frame = canvas.getByRole('group', { name: 'a title too long for its edge' });
    await waitFor(() => expect(frame.querySelector('.rk-list-scrollbar')?.textContent).toBe('##.'));
    const text = screenshot(frame, { legend: false });
    expect(text).toBe(
      [
        '+ a title too long for its~ -+',
        '|  xsrc/index.ts           # |',
        '|   src/glyph.ts           # |',
        '|   src/theme.ts           . |',
        '| [ Publish ]                |',
        '|                            |',
        '+----------------------------+',
      ].join('\n'),
    );
    expect(text).toMatch(/^[\x20-\x7e\n]*$/);
  },
};

/** Every theme that ships, each drawing with its own border set. */
export const Themes: Story = {
  args: { title: 'themes' },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      {themeNames.map((name) => (
        <GlyphProvider key={name} glyphs={themeGlyphs[name]}>
          <Frame title={name} cols={30} rows={3} />
        </GlyphProvider>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of themeNames) {
      const top = canvas.getByRole('group', { name }).querySelector('.rk-row')?.textContent ?? '';
      expect(top.startsWith(themeGlyphs[name].border['top-left']), name).toBe(true);
    }
  },
};
