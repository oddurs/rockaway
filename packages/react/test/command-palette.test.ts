import { Attr, type Buffer, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  commandPaletteBuffer,
  fuzzyMatch,
  matchCommands,
  type PaletteCommand,
  paletteState,
  resultsInOrder,
} from '../src/components/command-palette.pure.ts';

/** A buffer as text, each row closed by a `|` so the blank cells show. */
const drawn = (buffer: Buffer): string =>
  `\n${toText(buffer, { trimEnd: false })
    .split('\n')
    .map((row) => `${row}|`)
    .join('\n')}`;

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'open', label: 'Open file', keys: 'mod+o', section: 'Files' },
  { id: 'recent', label: 'Open recent', section: 'Files' },
  { id: 'save', label: 'Save', keys: 'mod+s', section: 'Files' },
  { id: 'theme', label: 'Change theme', section: 'View' },
  { id: 'density', label: 'Change density', section: 'View' },
  { id: 'keys', label: 'Show keyboard shortcuts', keys: '?', section: 'Help' },
];

describe('fuzzyMatch', () => {
  test('matches in order, ignoring case, and says which graphemes', () => {
    expect(fuzzyMatch('opf', 'Open file')?.indices).toEqual([0, 1, 5]);
    expect(fuzzyMatch('FILE', 'Open file')?.indices).toEqual([5, 6, 7, 8]);
    expect(fuzzyMatch('fo', 'Open file')).toBeUndefined();
    expect(fuzzyMatch('', 'Open file')).toEqual({ score: 0, indices: [] });
  });

  test('prefers a word’s start to a letter inside a word', () => {
    // `t` in `theme`, not the `t` of `Change`... which has none; `d` of `density`.
    expect(fuzzyMatch('cd', 'Change density')?.indices).toEqual([0, 7]);
    expect(fuzzyMatch('sk', 'Show keyboard shortcuts')?.indices).toEqual([0, 5]);
  });

  test('scores a run, and a word’s start, above a scatter', () => {
    const run = fuzzyMatch('open', 'Open file')?.score ?? 0;
    const scatter = fuzzyMatch('open', 'Show keyboard shortcuts phone')?.score ?? 0;
    expect(run).toBeGreaterThan(scatter);
  });
});

describe('matchCommands', () => {
  test('with no query, every command in the order given, in its section', () => {
    const sections = matchCommands(COMMANDS, '');
    expect(sections.map((s) => s.title)).toEqual(['Files', 'View', 'Help']);
    expect(resultsInOrder(sections).map((r) => r.command.id)).toEqual(COMMANDS.map((c) => c.id));
  });

  test('with one, ranked best first, and sections with nothing left out', () => {
    const sections = matchCommands(COMMANDS, 'th');
    expect(sections.map((s) => s.title)).toEqual(['View']);
    expect(resultsInOrder(sections).map((r) => r.command.id)).toEqual(['theme']);
  });

  test('says which state it is in', () => {
    expect(paletteState(COMMANDS, matchCommands(COMMANDS, 'zzz'))).toBe('no-match');
    expect(paletteState([], [])).toBe('empty');
    expect(paletteState(COMMANDS, matchCommands(COMMANDS, ''), true)).toBe('loading');
    expect(paletteState(COMMANDS, matchCommands(COMMANDS, ''))).toBe('results');
  });
});

describe('commandPaletteBuffer', () => {
  test('the input row, a rule, then results in sections set into the frame', () => {
    expect(
      drawn(commandPaletteBuffer({ commands: COMMANDS, chord: 'mod+k', width: 36, rows: 9 })),
    ).toMatchInlineSnapshot(`
      "
      ╔══════════════════════════════════╗|
      ║ ▸                        Ctrl+K  ║|
      ╟──────────────────────────────────╢|
      ╟ Files ───────────────────────────╢|
      ║▸Open file                Ctrl+O  ║|
      ║ Open recent                      ║|
      ║ Save                     Ctrl+S  ║|
      ╟ View ────────────────────────────╢|
      ║ Change theme                     ║|
      ║ Change density                   ║|
      ╟ Help ────────────────────────────╢|
      ║ Show keyboard shortcuts       ?  ║|
      ╚══════════════════════════════════╝|"
    `);
  });

  test('matched graphemes are underlined, so they read without colour', () => {
    const buffer = commandPaletteBuffer({ commands: COMMANDS, query: 'of', width: 36 });
    expect(drawn(buffer)).toMatchInlineSnapshot(`
      "
      ╔══════════════════════════════════╗|
      ║ ▸ of                             ║|
      ╟──────────────────────────────────╢|
      ╟ Files ───────────────────────────╢|
      ║▸Open file                Ctrl+O  ║|
      ╚══════════════════════════════════╝|"
    `);
    // `O` and `f` of `Open file`, on the first result's row.
    const row = 4;
    const marked = Array.from({ length: buffer.width }, (_, x) => buffer.at({ x, y: row }))
      .filter((cell) => cell !== undefined && hasAttr(cell.style, Attr.underline))
      .map((cell) => cell?.ch)
      .join('');
    expect(marked).toBe('Of');
  });

  test('loading, empty and no-match are drawn, not left blank', () => {
    const at = (options: Partial<Parameters<typeof commandPaletteBuffer>[0]>) =>
      toText(commandPaletteBuffer({ commands: COMMANDS, width: 32, ...options }))
        .split('\n')
        .at(3);
    expect([
      at({ loading: true }),
      at({ commands: [] }),
      at({ query: 'zzz' }),
    ]).toMatchInlineSnapshot(`
      [
        "║ ⠋ Loading commands           ║",
        "║ No commands.                 ║",
        "║ Nothing matches "zzz".       ║",
      ]
    `);
  });

  test('past `rows` the results scroll to keep the cursor in sight, with a scrollbar column, as a list’s', () => {
    expect(
      drawn(commandPaletteBuffer({ commands: COMMANDS, width: 36, rows: 4, cursor: 5 })),
    ).toMatchInlineSnapshot(`
      "
      ╔══════════════════════════════════╗|
      ║ ▸                                ║|
      ╟──────────────────────────────────╢|
      ║ Change theme                    ░║|
      ║ Change density                  ░║|
      ╟ Help ────────────────────────────╢|
      ║▸Show keyboard shortcuts       ? █║|
      ╚══════════════════════════════════╝|"
    `);
  });

  test('under ASCII every glyph is ASCII', () => {
    const text = toText(
      commandPaletteBuffer(
        { commands: COMMANDS, chord: 'mod+k', query: 'o', width: 36, rows: 4 },
        glyphsFor({ borderSet: 'ascii' }),
      ),
    );
    expect(text).toMatchInlineSnapshot(`
      "+----------------------------------+
      | > o                      Ctrl+K  |
      +----------------------------------+
      + Files ---------------------------+
      |>Open file                Ctrl+O #|
      | Open recent                     #|
      + Help ----------------------------+
      +----------------------------------+"
    `);
    expect(/^[\x20-\x7e\n]*$/.test(text)).toBe(true);
  });
});
