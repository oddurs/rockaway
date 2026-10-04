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
 * 5. `data-rk-theme-only`, which shows an element only under the themes it
 *    names (0171).
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

/**
 * Content for some themes only (cairn 0171). An element marked
 * `data-rk-theme-only="ink phosphor"` is shown only where the nearest theme
 * context is one it names, and `default` names the page with none. A
 * component's snapshot drawn in each theme's glyphs is one element per
 * drawing, so the page shows the one its theme draws, with no script.
 *
 * Each rule hides an element whose nearest context is that theme and which
 * does not name it; a theme context nested inside leaves the element to its
 * own rule. Written here, in the sheet every page loads, so it holds whether
 * or not a theme's own sheet has arrived.
 */
export function themeOnly(names: readonly string[]): string {
  const only = '[data-rk-theme-only]';
  const rules = [
    `  ${only}:not([data-rk-theme-only~='default']):not([data-rk-theme] *)`,
    ...names.map(
      (name) =>
        `  [data-rk-theme='${name}'] ${only}:not([data-rk-theme-only~='${name}']):not([data-rk-theme='${name}'] [data-rk-theme] *)`,
    ),
  ];
  return `
/*
 * Content for some themes only (cairn 0171): an element marked
 * data-rk-theme-only shows only under the themes it names.
 */
@layer rk.tokens {
${rules.join(',\n')} {
    display: none !important;
  }
}
`;
}

/** The CSS for the tokens and every theme, finished. Pure, for the check. */
export function finish(files: ReadonlyMap<string, string>): Map<string, string> {
  const out = new Map(files);
  const tokens = files.get('tokens.css');
  if (tokens === undefined) throw new Error('tokens.css was not built');
  const finished = lightDark(repairRegistrations(tokens));
  if (/initial-value: [^\n]*var\(/.test(finished)) {
    throw new Error('a registration still carries a var() initial value');
  }
  if (/--rk-ansi-[\w-]+: var\(/.test(finished)) {
    throw new Error('an ansi.* alias was not rewritten to light-dark()');
  }
  out.set(
    'tokens.css',
    `${finished.trimEnd()}\n${MODES}${themeOnly(themeContexts.map((t) => t.name))}`,
  );

  for (const theme of themeContexts) {
    if (theme.name === 'default') continue;
    const file = `themes/${theme.name}.css`;
    const css = files.get(file);
    if (css === undefined) throw new Error(`${file} was not built`);
    const pinned = theme.modes.length === 1 ? theme.modes[0] : undefined;
    out.set(
      file,
      pinned === undefined
        ? css
        : `${css.trimEnd()}

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
