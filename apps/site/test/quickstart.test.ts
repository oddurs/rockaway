import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { fences, fromGuide, guide } from '../scripts/quickstart.ts';

/**
 * The guide as the quickstart reads it (cairn 0107). The quickstart itself
 * scaffolds real apps from npm, so it runs on its own (`pnpm --filter site
 * quickstart`) and in the CI job 0155 adds; this holds the guide to the shape
 * that job needs, and to the promise it makes.
 */
const text = readFileSync(guide, 'utf8');
const { files, screen } = fromGuide(text);

describe('the getting-started guide', () => {
  test('gives each app its files, by path', () => {
    expect(Object.keys(files.vite).sort()).toEqual(['src/App.tsx', 'src/main.tsx']);
    expect(Object.keys(files.next).sort()).toEqual(['app/layout.tsx', 'app/page.tsx']);
  });

  test('renders the same screen in both', () => {
    const jsx = (code: string) => code.slice(code.indexOf('<Frame'), code.indexOf('</Frame>'));
    expect(jsx(files.next['app/page.tsx'] ?? '')).toBe(jsx(files.vite['src/App.tsx'] ?? ''));
  });

  test('installs, imports the CSS and renders a screen in under twenty lines, with Vite', () => {
    const install = fences(text).filter((f) => f.lang === 'sh');
    // Every line a reader types or pastes, blank ones included.
    const lines = [...install.map((f) => f.code), ...Object.values(files.vite)]
      .join('')
      .trimEnd()
      .split('\n');
    expect(lines.length).toBeLessThan(20);
    // The number the guide's first paragraph says.
    expect(lines.length).toBe(17);
    expect(text).toContain('seventeen lines, counting the install');
  });

  test('promises a screen of whole rows, as text', () => {
    const rows = screen.split('\n');
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((row) => [...row].length))).toEqual(new Set([32]));
  });
});
