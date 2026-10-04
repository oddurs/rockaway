import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { calloutBuffer, calloutTitle, calloutVariants } from '../src/components/callout.pure.ts';
import { Callout } from '../src/components/callout.tsx';

const SIZE = { width: 28, height: 3 };

describe('calloutBuffer', () => {
  test('every tone: its own line, its own mark, and its name in the top edge', () => {
    const drawn = calloutVariants.values.tone.map((tone) =>
      toText(calloutBuffer(SIZE, { tone }), { trimEnd: false }),
    );
    expect(drawn.join('\n')).toMatchInlineSnapshot(`
      "┌ ● Note ──────────────────┐
      │                          │
      └──────────────────────────┘
      ╭ ✓ Tip ───────────────────╮
      │                          │
      ╰──────────────────────────╯
      ┏ ! Warning ━━━━━━━━━━━━━━━┓
      ┃                          ┃
      ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
      ╔ ✗ Caution ═══════════════╗
      ║                          ║
      ╚══════════════════════════╝"
    `);
  });

  test('under an ascii theme the lines are one weight, and the marks still differ', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const tops = calloutVariants.values.tone.map(
      (tone) => toText(calloutBuffer(SIZE, { tone }, ascii)).split('\n')[0] ?? '',
    );
    expect(tops.join('\n')).toMatchInlineSnapshot(`
      "+ * Note ------------------+
      + x Tip -------------------+
      + ! Warning ---------------+
      + X Caution ---------------+"
    `);
    expect(new Set(tops.map((top) => top.slice(2, 3))).size).toBe(tops.length);
  });

  test('a title of its own replaces the tone’s name, and a long one is cut to the edge', () => {
    const own = toText(calloutBuffer(SIZE, { tone: 'tip', title: 'Before you rebase' }));
    expect(own.split('\n')[0]).toMatchInlineSnapshot(`"╭ ✓ Before you rebase ─────╮"`);
    const long = toText(calloutBuffer({ width: 16, height: 3 }, { title: 'A title far too long' }));
    expect(long.split('\n')[0]).toHaveLength(16);
  });
});

describe('Callout', () => {
  test('is a note named by its title, the tone in words and the mark out of the name', () => {
    const html = renderToStaticMarkup(
      createElement(Callout, { tone: 'warning' }, createElement('p', null, 'Mind the gap.')),
    );
    expect(html).toContain('role="note"');
    expect(html).toContain(`aria-label="${calloutTitle('warning')}"`);
    expect(html).toContain('data-tone="warning"');
    expect(html).toContain('<p>Mind the gap.</p>');
  });
});
