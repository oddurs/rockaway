import { describe, expect, test } from 'vitest';
import { formatKeys, keyShortcut, parseKeys, spokenKeys } from '../src/components/key-hint.tsx';

const SPECS = [
  'mod+s',
  'ctrl+shift+k',
  'alt+x',
  'mod+shift+alt+p',
  'esc',
  'mod+enter',
  'shift+up',
  'shift+enter',
];

describe('a chord, three ways', () => {
  test('what you see, on each keyboard and in terminal notation', () => {
    const rows = SPECS.map((spec) => {
      const apple = formatKeys(spec, 'apple');
      const other = formatKeys(spec, 'other');
      const terminal = formatKeys(spec, 'other', 'terminal');
      return `${spec.padEnd(16)} ${apple.padEnd(10)} ${other.padEnd(18)} ${terminal}`;
    });
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "mod+s            ⌘S         Ctrl+S             ^S
      ctrl+shift+k     ⌃⇧K        Ctrl+Shift+K       ^K
      alt+x            ⌥X         Alt+X              M-X
      mod+shift+alt+p  ⌥⇧⌘P       Ctrl+Alt+Shift+P   ^M-P
      esc              Esc        Esc                Esc
      mod+enter        ⌘↵         Ctrl+Enter         ^Enter
      shift+up         ⇧↑         Shift+↑            ⇧↑
      shift+enter      ⇧↵         Shift+Enter        ⇧Enter"
    `);
  });

  test('what a reader hears', () => {
    expect(SPECS.map((spec) => spokenKeys(spec, 'apple')).join('\n')).toMatchInlineSnapshot(`
      "Command S
      Control Shift K
      Alt X
      Alt Shift Command P
      Escape
      Command Enter
      Shift Up arrow
      Shift Enter"
    `);
  });

  test('what the platform is told', () => {
    expect(SPECS.map((spec) => keyShortcut(spec, 'apple')).join('\n')).toMatchInlineSnapshot(`
      "Meta+s
      Control+Shift+k
      Alt+x
      Alt+Shift+Meta+p
      esc
      Meta+enter
      Shift+up
      Shift+enter"
    `);
  });
});

describe('parseKeys', () => {
  test('mod follows the keyboard, and nothing else does', () => {
    expect(parseKeys('mod+s', 'apple')).toEqual({
      ctrl: false,
      alt: false,
      shift: false,
      meta: true,
      key: 's',
    });
    expect(parseKeys('mod+s', 'other')).toEqual({
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
      key: 's',
    });
    // ctrl means ctrl on both: a TUI binding is not a platform convention.
    expect(parseKeys('ctrl+s', 'apple').ctrl).toBe(true);
    expect(parseKeys('ctrl+s', 'apple').meta).toBe(false);
  });

  test('aliases, spacing and case are all the same chord', () => {
    for (const spec of ['cmd+K', ' Meta + k ', 'command+k', 'super+k']) {
      expect(parseKeys(spec, 'apple')).toEqual(parseKeys('meta+k', 'apple'));
    }
    expect(parseKeys('opt+f')).toEqual(parseKeys('option+f'));
    expect(parseKeys('opt+f')).toEqual(parseKeys('alt+f'));
  });

  test('a chord reads in one order however it was written', () => {
    expect(formatKeys('shift+mod+alt+ctrl+p', 'apple')).toBe(
      formatKeys('mod+ctrl+alt+shift+p', 'apple'),
    );
    expect(formatKeys('shift+ctrl+k', 'other')).toBe('Ctrl+Shift+K');
  });

  test('a bare key is still a chord', () => {
    expect(formatKeys('esc', 'apple')).toBe('Esc');
    expect(formatKeys('a', 'apple')).toBe('A');
    expect(spokenKeys('pageup')).toBe('Page up');
    expect(keyShortcut('esc')).toBe('esc');
  });

  test('an empty spec is empty, not a crash', () => {
    expect(formatKeys('')).toBe('');
    expect(spokenKeys('')).toBe('');
    expect(parseKeys('+ +').key).toBe('');
  });
});
