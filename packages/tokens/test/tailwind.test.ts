import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, test } from 'vitest';
import { themeName } from '../scripts/terrazzo-tailwind.ts';
import { generate } from '../src/generate.ts';
import { defaultTheme } from '../src/inputs.ts';

const root = path.join(import.meta.dirname, '..');

async function css(): Promise<string> {
  return await readFile(path.join(root, 'css/tailwind.css'), 'utf8');
}

/** Compile utilities the way a consuming app would. */
async function utilities(classes: string[]): Promise<string> {
  const compiler = await compile(`@import 'tailwindcss';\n${await css()}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const file = id === 'tailwindcss' ? require.resolve('tailwindcss/index.css') : id;
      return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') };
    },
  });
  return compiler.build(classes);
}

describe('Tailwind adapter (0030)', () => {
  test('names drop the role Tailwind already supplies, and keep it where roles collide', () => {
    expect(themeName('bg.page')).toBe('--color-page');
    expect(themeName('bg.accent.solid')).toBe('--color-accent');
    expect(themeName('fg.default')).toBe('--color-ink');
    expect(themeName('fg.muted')).toBe('--color-muted');
    expect(themeName('fg.on-accent')).toBe('--color-on-accent');
    expect(themeName('fg.danger')).toBe('--color-danger-ink');
    expect(themeName('border.control')).toBe('--color-line-control');
    expect(themeName('space.1')).toBe('--spacing');
    expect(themeName('space.4')).toBeUndefined();
    expect(themeName('palette.neutral.1')).toBeUndefined();
  });

  test('every semantic colour, radius and shadow token reaches the theme', async () => {
    const file = await css();
    const semantic = generate(defaultTheme).get('semantic.tokens.json') as Record<string, unknown>;
    const groups = ['bg', 'fg', 'border', 'radius', 'shadow'] as const;
    const paths: string[] = [];
    const walk = (node: Record<string, unknown>, trail: string[]) => {
      if ('$value' in node) return paths.push(trail.join('.'));
      for (const [k, v] of Object.entries(node)) {
        if (!k.startsWith('$')) walk(v as Record<string, unknown>, [...trail, k]);
      }
    };
    for (const g of groups) walk(semantic[g] as Record<string, unknown>, [g]);

    const missing = paths.filter((p) => {
      const name = themeName(p);
      return name && !file.includes(`${name}: var(--rk-${p.replace(/\./g, '-')})`);
    });
    expect(missing).toEqual([]);
  });

  test('utilities resolve to the same custom properties components read', async () => {
    const out = await utilities([
      'bg-surface',
      'text-muted',
      'border-line-control',
      'rounded-surface',
      'shadow-overlay',
      'p-4',
      'text-body',
      'font-mono',
      'ease-enter',
    ]);

    expect(out).toContain('var(--rk-bg-surface)');
    expect(out).toContain('var(--rk-fg-muted)');
    expect(out).toContain('var(--rk-border-control)');
    expect(out).toContain('var(--rk-radius-surface)');
    expect(out).toContain('var(--rk-shadow-overlay)');
    expect(out).toContain('var(--rk-text-body-font-size)');
    expect(out).toContain('var(--rk-font-family-mono)');
    expect(out).toContain('var(--rk-motion-easing-enter)');

    // Spacing is the density unit, so p-4 follows the density context.
    expect(out).toContain('calc(var(--rk-space-1) * 4)');
  });
});
