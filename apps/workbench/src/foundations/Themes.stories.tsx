import { Button, Frame, GlyphProvider, List, ListItem } from '@rockaway/react';
import { checkConformance, expectContinuity } from '@rockaway/react/testing';
import { type Mode, type ThemeName, themeContexts, themeGlyphs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor } from 'storybook/test';
import { runner } from '../../.storybook/runner.ts';

/**
 * Every theme is a CSS context (cairn 0052): `data-rk-theme` on any element,
 * the way `data-density` is. Mode stays `data-theme`, and the two are
 * independent — a theme carries its palette in both modes, and the mode is the
 * colour scheme the element inherits. The theme's glyphs go through
 * `GlyphProvider`, because chrome is drawn in JavaScript (0119).
 */
function Sample({ name }: { name: string }) {
  return (
    <Frame title={name} cols={28} rows={6}>
      <div style={{ inlineSize: 'calc(var(--rk-cell-width) * 24)' }}>
        <List
          aria-label={`${name} files`}
          rows={2}
          selectionMode="single"
          defaultSelectedKeys={['a']}
        >
          <ListItem id="a" textValue="src/index.ts">
            src/index.ts
          </ListItem>
          <ListItem id="b" textValue="README.md">
            README.md
          </ListItem>
        </List>
      </div>
      <Button>Publish</Button>
    </Frame>
  );
}

function Island({ theme, mode }: { theme: ThemeName; mode?: Mode }) {
  const label = mode === undefined ? theme : `${theme} ${mode}`;
  return (
    <GlyphProvider glyphs={themeGlyphs[theme]}>
      <section
        aria-label={label}
        data-rk-theme={theme}
        {...(mode === undefined ? {} : { 'data-theme': mode })}
        style={{
          background: 'var(--rk-bg-page)',
          color: 'var(--rk-fg-default)',
          // Invisible, but read back: two presets can share their greys and
          // differ only in the accent, so the check looks at both.
          caretColor: 'var(--rk-fg-accent)',
          padding: 'calc(var(--rk-cell-height) * 1) calc(var(--rk-cell-width) * 2)',
        }}
      >
        <Sample name={label} />
      </section>
    </GlyphProvider>
  );
}

function Gallery() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--rk-x-2)' }}>
      {themeContexts.flatMap((theme) =>
        theme.modes.map((mode) => (
          <Island key={`${theme.name} ${mode}`} theme={theme.name} mode={mode} />
        )),
      )}
    </div>
  );
}

const meta = {
  title: 'Foundations/Themes',
  component: Gallery,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const background = (el: Element): string => getComputedStyle(el).backgroundColor;
/** A theme's page and its accent, as the browser resolved them. */
const colours = (el: Element): string => {
  const style = getComputedStyle(el);
  return `${style.backgroundColor} ${style.caretColor}`;
};
const screenOf = (el: Element): HTMLElement => el.querySelector('.rk-screen') as HTMLElement;

/**
 * Every theme in every mode it declares, side by side. Line continuity is
 * checked theme by theme in Switching instead: one capture of sixteen screens
 * is slower than the run allows, and the same frames are drawn there.
 */
export const Gallery_: Story = {
  name: 'Every theme',
  parameters: { continuity: false },
  play: async ({ canvas }) => {
    const islands = themeContexts.flatMap((theme) =>
      theme.modes.map((mode) => canvas.getByRole('region', { name: `${theme.name} ${mode}` })),
    );

    // Each is its own palette: no two theme-and-mode pairs resolve alike.
    expect(new Set(islands.map(colours)).size).toBe(islands.length);

    // And none changes the grid: the same frame is the same size in cells in
    // every theme, and on the grid in all of them.
    for (const island of islands) {
      const screen = screenOf(island);
      expect(screen.dataset.rkCols, island.ariaLabel ?? '').toBe('28');
      expect(screen.dataset.rkRows, island.ariaLabel ?? '').toBe('6');
      expect(checkConformance(island).violations, island.ariaLabel ?? '').toEqual([]);
    }
  },
};

function Switcher() {
  const [theme, setTheme] = useState<ThemeName>('default');
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <div role="toolbar" aria-label="Theme" style={{ display: 'flex', flexWrap: 'wrap' }}>
        {themeContexts.map((t) => (
          <Button key={t.name} delimiters="none" onPress={() => setTheme(t.name)}>
            {t.title}
          </Button>
        ))}
      </div>
      <Island theme={theme} />
    </div>
  );
}

/**
 * The switcher a site puts in its status bar: one attribute, no rebuild, no
 * reload. The cells stay where they were.
 */
export const Switching: Story = {
  render: () => <Switcher />,
  play: async ({ canvas }) => {
    const island = () => canvas.getByRole('region');
    const cells = () => {
      const screen = screenOf(island());
      const box = screen.getBoundingClientRect();
      const style = getComputedStyle(screen);
      return {
        cols: screen.dataset.rkCols,
        rows: screen.dataset.rkRows,
        across: Math.round(
          box.width / Number.parseFloat(style.getPropertyValue('--rk-cell-width')),
        ),
        down: Math.round(
          box.height / Number.parseFloat(style.getPropertyValue('--rk-cell-height')),
        ),
      };
    };
    const before = cells();
    const seen = new Set<string>([colours(island())]);
    // Lines meet or not by border set and font; the palette has no say. So
    // continuity is checked once for each look, not once for each theme.
    const looks = new Set<string>(['single system']);

    for (const theme of themeContexts.slice(1)) {
      await userEvent.click(canvas.getByRole('button', { name: theme.title }));
      await waitFor(() => expect(island().dataset.rkTheme).toBe(theme.name));
      const colour = colours(island());
      expect(seen.has(colour), theme.name).toBe(false);
      seen.add(colour);
      expect(cells(), theme.name).toEqual(before);
      expect(checkConformance(island()).violations, theme.name).toEqual([]);
      // The lines still meet in this theme's border set and font (0117).
      const look = `${theme.inputs.borderSet} ${theme.inputs.typePairing}`;
      const run = runner();
      if (run && !looks.has(look)) {
        looks.add(look);
        await expectContinuity(island(), { capture: run.capture });
      }
    }
  },
};

function Nesting() {
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <div
        data-testid="ink, dark, on one element"
        data-rk-theme="ink"
        data-theme="dark"
        style={swatch}
      />
      <div data-theme="dark">
        <div data-testid="ink inside a dark island" data-rk-theme="ink" style={swatch} />
      </div>
      <div data-rk-theme="ink">
        <div data-testid="a dark island inside ink" data-theme="dark" style={swatch} />
      </div>
      <div data-testid="ink, light" data-rk-theme="ink" data-theme="light" style={swatch} />
      <div data-rk-theme="ink" data-theme="dark">
        <div data-testid="default inside dark ink" data-rk-theme="default" style={swatch} />
      </div>
      <div data-testid="default, dark" data-rk-theme="default" data-theme="dark" style={swatch} />
      <div
        data-testid="dracula, asked for light"
        data-rk-theme="dracula"
        data-theme="light"
        style={swatch}
      />
      <div data-testid="dracula" data-rk-theme="dracula" style={swatch} />
    </div>
  );
}

const swatch = {
  inlineSize: 'calc(var(--rk-cell-width) * 8)',
  blockSize: 'var(--rk-cell-height)',
  background: 'var(--rk-bg-page)',
  border: '1px solid var(--rk-border-default)',
};

/**
 * Theme and mode nest in either order, on one element or two, and resolve to
 * the same colours. A theme with one mode keeps it whatever it is asked for.
 */
export const Nested: Story = {
  render: () => <Nesting />,
  play: async ({ canvas }) => {
    const bg = (name: string) => background(canvas.getByTestId(name));
    const inkDark = bg('ink, dark, on one element');
    expect(bg('ink inside a dark island')).toBe(inkDark);
    expect(bg('a dark island inside ink')).toBe(inkDark);
    expect(bg('ink, light')).not.toBe(inkDark);
    expect(bg('default inside dark ink')).toBe(bg('default, dark'));
    expect(bg('default, dark')).not.toBe(inkDark);

    // Dracula is dark only: asked for light, it stays dark, and says so.
    expect(bg('dracula, asked for light')).toBe(bg('dracula'));
    expect(getComputedStyle(canvas.getByTestId('dracula, asked for light')).colorScheme).toBe(
      'dark',
    );
  },
};
