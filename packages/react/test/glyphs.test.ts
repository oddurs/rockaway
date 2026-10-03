import { toText } from '@rockaway/grid';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Button } from '../src/components/button.tsx';
import { dividerBuffer } from '../src/components/divider.tsx';
import { frameBuffer } from '../src/components/frame.tsx';
import { List, ListItem, scrollbarBuffer } from '../src/components/list.tsx';
import { defaultGlyphs, GlyphProvider, useGlyphs } from '../src/glyphs.tsx';

const ascii = glyphsFor({ borderSet: 'ascii' });

function Probe(): ReactNode {
  const glyphs = useGlyphs();
  return `${glyphs.borderSet} ${glyphs.mark.cursor} ${glyphs.block.full}`;
}

/** A selected row and a button, rendered to markup on the server, with the tags stripped. */
function serverText(tree: ReactNode): string {
  return renderToStaticMarkup(tree)
    .replace(/<[^>]+>/g, '')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}

function controls(): ReactNode {
  return [
    createElement(
      List,
      {
        key: 'list',
        'aria-label': 'Files',
        rows: 2,
        // Multi-select, so the selected row draws the theme's check mark.
        selectionMode: 'multiple',
        defaultSelectedKeys: ['a'],
      },
      createElement(ListItem, { id: 'a', textValue: 'a.ts' }, 'a.ts'),
      createElement(ListItem, { id: 'b', textValue: 'b.ts' }, 'b.ts'),
    ),
    createElement(Button, { key: 'button' }, 'Publish'),
  ];
}

describe('glyphs from the theme', () => {
  test('with no provider a component draws with the default theme’s glyphs, on the server too', () => {
    expect(defaultGlyphs).toBe(themeGlyphs.default);
    expect(renderToStaticMarkup(createElement(Probe))).toBe('single ▸ █');
    expect(serverText(controls())).toBe(' ✓a.ts  b.ts[ Publish ]');
  });

  test('a provider swaps every glyph a component reads', () => {
    const tree = createElement(GlyphProvider, { glyphs: ascii }, createElement(Probe), controls());
    expect(serverText(tree)).toBe('ascii > # xa.ts  b.ts[ Publish ]');
  });

  test('the theme’s border set is the frame’s default, and its dividers’ too', () => {
    const ink = themeGlyphs.ink;
    expect(ink.borderSet).toBe('rounded');
    expect(
      frameBuffer({ width: 14, height: 4 }, { title: 'ink', dividers: [2] }, ink),
    ).toMatchInlineSnapshot(`
        ┌──────────────┐
        │╭ ink ───────╮│
        ││            ││
        │├────────────┤│
        │╰────────────╯│
        └──────────────┘ 14×4
      `);
    // A border given on the frame still wins over the theme's.
    expect(frameBuffer({ width: 6, height: 2 }, { border: 'heavy' }, ink).row(0)).toBe('┏━━━━┓');
  });

  test('switched to ascii, a frame, a divider and a scrollbar draw nothing outside ASCII', () => {
    const frame = toText(
      frameBuffer(
        { width: 20, height: 4 },
        { title: 'a title far too long', dividers: [2] },
        ascii,
      ),
    );
    const divider = toText(dividerBuffer({ width: 20, height: 1 }, { label: 'files' }, ascii));
    const scrollbar = toText(scrollbarBuffer({ total: 12, visible: 4, offset: 4 }, ascii))
      .split('\n')
      .join('');
    const drawn = [frame, divider, `scrollbar ${scrollbar}`].join('\n');
    expect(drawn).toMatchInlineSnapshot(`
      "+ a title far to~ -+
      |                  |
      +------------------+
      +------------------+
      -- files -----------
      scrollbar ..#."
    `);
    expect(drawn).toMatch(/^[\x20-\x7e\n]*$/);
  });
});
