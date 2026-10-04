/**
 * What Terrazzo's output needs before it ships (cairn 0066, 0052).
 *
 *   node scripts/finish-css.ts [dir]
 *
 * 1. `@property` registrations whose initial value is a `var()` are rewritten
 *    to the untyped form (0066), or Lightning CSS rejects the whole sheet.
 * 2. `ansi.*` comes out of Terrazzo as an alias into the light half of the
 *    palette. It becomes `light-dark()` over both halves, so the mode is the
 *    `color-scheme` of whatever element reads it. That is what makes theme and
 *    mode independent: a theme island carries both halves of its palette, and
 *    any mode island, inside it or around it, only sets `color-scheme`.
 * 3. The mode islands themselves, which set nothing but `color-scheme`.
 * 4. A theme with one mode pins it, on itself and on any mode island inside.
 * 5. Every glyph is written as a CSS string. Glyphs are typed `fontFamily`
 *    for Terrazzo, which leaves a one-character name bare (`-`, `x`) and does
 *    not escape a backslash, so ASCII's spinner frame `\` came out as `"\";`,
 *    a string that never closes, and took the rest of the sheet with it.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { themeContexts } from '../src/themes.ts';
import { repairRegistrations } from './fix-properties.ts';

const ALIAS = /(--rk-ansi-([\w-]+)): var\(--rk-palette-light-\2\);/g;

export function lightDark(css: string): string {
  return css.replace(
    ALIAS,
    (_, name: string, slot: string) =>
      `${name}: light-dark(var(--rk-palette-light-${slot}), var(--rk-palette-dark-${slot}));`,
  );
}

const MODES = `
/*
 * Mode islands (cairn 0058, 0052). Every colour is a light-dark() pair, so a
 * mode is only a colour scheme: it works on any element, inside or around a
 * theme island, and changes nothing else.
 */
@layer rk.tokens {
  [data-theme='light'] {
    color-scheme: light;
  }
  [data-theme='dark'] {
    color-scheme: dark;
  }
}
`;

const GLYPH = /^(\s*--rk-glyph-[\w-]+): (.+);$/gm;

/** A glyph's value as a CSS string, whatever Terrazzo wrote: quoted, bare or unescaped. */
export function quoteGlyphs(css: string): string {
  return css.replace(GLYPH, (_, name: string, value: string) => {
    const raw =
      value.length >= 2 && value.startsWith('"') && value.endsWith('"')
        ? value.slice(1, -1)
        : value;
    return `${name}: "${raw.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}";`;
  });
}

/** The CSS for the tokens and every theme, finished. Pure, for the check. */
export function finish(files: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map(files);
  const tokens = files.get('tokens.css');
  if (tokens === undefined) throw new Error('tokens.css was not built');
  const finished = quoteGlyphs(lightDark(repairRegistrations(tokens)));
  if (/initial-value: [^\n]*var\(/.test(finished)) {
    throw new Error('a registration still carries a var() initial value');
  }
  if (/--rk-ansi-[\w-]+: var\(/.test(finished)) {
    throw new Error('an ansi.* alias was not rewritten to light-dark()');
  }
  out.set('tokens.css', `${finished.trimEnd()}\n${MODES}`);

  for (const theme of themeContexts) {
    if (theme.name === 'default') continue;
    const file = `themes/${theme.name}.css`;
    const css = files.get(file);
    if (css === undefined) throw new Error(`${file} was not built`);
    const pinned = theme.modes.length === 1 ? theme.modes[0] : undefined;
    const quoted = quoteGlyphs(css);
    out.set(
      file,
      pinned === undefined
        ? quoted
        : `${quoted.trimEnd()}

/* ${theme.title} has only a ${pinned} mode, so it pins it (cairn 0052). */
@layer rk.tokens {
  [data-rk-theme='${theme.name}'],
  [data-rk-theme='${theme.name}'] [data-theme] {
    color-scheme: ${pinned};
  }
}
`,
    );
  }
  return out;
}

/** Every stylesheet the build writes, relative to `css/`. */
export const cssFiles: readonly string[] = [
  'tokens.css',
  'tailwind.css',
  ...themeContexts.filter((t) => t.name !== 'default').map((t) => `themes/${t.name}.css`),
];

export async function finishDirectory(dir: string): Promise<void> {
  const names = cssFiles.filter((name) => name !== 'tailwind.css');
  const read = await Promise.all(
    names.map(async (name) => [name, await readFile(path.join(dir, name), 'utf8')] as const),
  );
  for (const [name, css] of finish(new Map(read))) {
    await writeFile(path.join(dir, name), css);
  }
}

if (process.argv[1] === import.meta.filename) {
  await finishDirectory(process.argv[2] ?? path.join(import.meta.dirname, '..', 'css'));
}
