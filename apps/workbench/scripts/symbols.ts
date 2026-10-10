/**
 * Builds the workbench's symbol face (cairn 0295): the characters the system
 * sets in type that the fontsource faces of IBM Plex Mono leave out (they are
 * Google Fonts' Latin, Cyrillic and Vietnamese subsets), cut from JetBrains
 * Mono, whose advance is Plex's 0.6em. Declared under the family "IBM Plex
 * Mono" with a unicode-range, so a check mark or a ⌘ comes from a face with
 * the grid's advance instead of whatever monospace the machine falls back to,
 * which on Linux is not the same width and puts every badge and key hint off
 * the grid.
 *
 * JetBrains Mono, not Plex's own full font, even for the few marks Plex has:
 * Plex's licence reserves its name for unmodified fonts, and a subset is a
 * modification. JetBrains Mono reserves no name.
 *
 *   pnpm --filter workbench symbols
 *
 * Run by hand when the tokens' marks or the key glyphs change, and commit
 * the output. The build never touches the network: the source fonts are
 * pinned by version and hash here.
 *
 * Run it after `pnpm build`: the marks come from the published tokens.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { marks, spinnerFrames } from '@rockaway/tokens';
import subsetFont from 'subset-font';

const JETBRAINS = {
  url: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/fonts/variable/JetBrainsMono%5Bwght%5D.ttf',
  sha256: '662a196d58f1183bf2d77428b6d5283fe3f45161ab021bea4036bc98e5cac016',
};

/** KeyHint's glyphs (packages/react/src/components/key-hint.tsx). */
const keys = '⌘⌥⇧⌃⌫⌦⎋⏎⇥↵';

/** Every character the system sets in type, but not what the cell draws. */
function drawn(): string[] {
  const chars = new Set<string>();
  const fromTokens = [
    ...Object.values(marks).flatMap((set) => Object.values(set)),
    ...Object.values(spinnerFrames).flat(),
  ];
  for (const char of [...fromTokens.join(''), ...keys]) {
    const code = char.codePointAt(0) ?? 0;
    // Box drawing, blocks and braille are the cell's (0116, 0117).
    const cells = (code >= 0x2500 && code <= 0x259f) || (code >= 0x2800 && code <= 0x28ff);
    if (!cells) chars.add(char);
  }
  return [...chars].sort();
}

/** The characters a font's cmap maps (formats 4 and 12). */
function mapped(font: Buffer): Set<number> {
  const tables = new Map<string, number>();
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const entry = 12 + i * 16;
    tables.set(font.toString('latin1', entry, entry + 4), font.readUInt32BE(entry + 8));
  }
  const base = tables.get('cmap');
  if (base === undefined) throw new Error('the font has no cmap');
  const codes = new Set<number>();
  for (let i = 0; i < font.readUInt16BE(base + 2); i++) {
    const at = base + font.readUInt32BE(base + 4 + i * 8 + 4);
    const format = font.readUInt16BE(at);
    if (format === 4) {
      const segments = font.readUInt16BE(at + 6) / 2;
      const ends = at + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const offsets = deltas + segments * 2;
      for (let s = 0; s < segments; s++) {
        const end = font.readUInt16BE(ends + 2 * s);
        const start = font.readUInt16BE(starts + 2 * s);
        const delta = font.readInt16BE(deltas + 2 * s);
        const offset = font.readUInt16BE(offsets + 2 * s);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const glyph =
            offset === 0
              ? (c + delta) & 0xffff
              : font.readUInt16BE(offsets + 2 * s + offset + 2 * (c - start));
          if (glyph !== 0) codes.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < font.readUInt32BE(at + 12); g++) {
        const group = at + 16 + g * 12;
        for (let c = font.readUInt32BE(group); c <= font.readUInt32BE(group + 4); c++) codes.add(c);
      }
    }
  }
  return codes;
}

/** `U+2318,U+23CE,…`, for the face's `unicode-range`. */
const unicodeRange = (chars: readonly string[]): string =>
  chars.map((c) => `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase()}`).join(',');

async function fetchFont(url: string, sha256?: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const font = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(font).digest('hex');
  if (sha256 !== undefined && hash !== sha256) throw new Error(`${url} has changed: ${hash}`);
  return font;
}

/**
 * What the fontsource faces cover: they are Google Fonts' subsets (Latin,
 * Cyrillic, Vietnamese), so a check mark Plex itself has is still not in them.
 */
function fontsourceCovers(): (code: number) => boolean {
  const css = readFileSync(
    path.join(import.meta.dirname, '..', 'node_modules', '@fontsource', 'ibm-plex-mono', '400.css'),
    'utf8',
  );
  const ranges = [...css.matchAll(/unicode-range:\s*([^;]+);/g)].flatMap(([, list]) =>
    (list ?? '').split(',').map((part) => {
      const [from, to] = part.trim().replace(/^U\+/i, '').split('-');
      const a = Number.parseInt(from ?? '', 16);
      return [a, to === undefined ? a : Number.parseInt(to, 16)] as const;
    }),
  );
  return (code) => ranges.some(([a, b]) => code >= a && code <= b);
}

const jetbrainsFont = await fetchFont(JETBRAINS.url, JETBRAINS.sha256);
const jetbrains = mapped(jetbrainsFont);
const covered = fontsourceCovers();
const code = (c: string): number => c.codePointAt(0) ?? 0;

const outside = drawn().filter((c) => !covered(code(c)));
const fromJetBrains = outside.filter((c) => jetbrains.has(code(c)));
const unfound = outside.filter((c) => !jetbrains.has(code(c)));
if (unfound.length > 0) console.warn(`neither face has: ${unfound.join(' ')}`);

const subset = (font: Buffer, text: readonly string[], wght: number): Promise<Buffer> =>
  subsetFont(font, text.join(''), {
    targetFormat: 'woff2',
    // One static instance per weight, not a variable face: Chromium on Linux
    // rounds a variable face's advances to whole pixels, 10px for the grid's
    // 9.6, where Plex's own static faces keep 9.6 (0295).
    variationAxes: { wght },
    noLayoutClosure: true,
    noHinting: true,
    preserveNameIds: [0, 13, 14],
  });

const out = path.join(import.meta.dirname, '..', 'src', 'fonts');
writeFileSync(
  path.join(out, 'plex-symbols.woff2'),
  await subset(jetbrainsFont, fromJetBrains, 400),
);
writeFileSync(
  path.join(out, 'plex-symbols-bold.woff2'),
  await subset(jetbrainsFont, fromJetBrains, 700),
);

// One face per weight the fontsource faces declare, not a range: a range that
// overlaps theirs (500 sits inside 400 to 599) lost the match in Chromium, and
// the mark fell back to a face of another width.
const weights = [
  { file: 'plex-symbols.woff2', weight: '400' },
  { file: 'plex-symbols.woff2', weight: '500' },
  { file: 'plex-symbols-bold.woff2', weight: '600' },
  { file: 'plex-symbols-bold.woff2', weight: '700' },
] as const;

const faces = (chars: readonly string[]): string =>
  weights
    .flatMap(({ file, weight }) =>
      ['normal', 'italic'].map(
        (style) => `@font-face {
  font-family: "IBM Plex Mono";
  src: url("./${file}") format("woff2");
  font-weight: ${weight};
  font-style: ${style};
  font-display: block;
  unicode-range: ${unicodeRange(chars)};
}
`,
      ),
    )
    .join('\n');

writeFileSync(
  path.join(out, 'plex-symbols.css'),
  `/*
 * Generated by scripts/symbols.ts: every character the system sets in type
 * that the fontsource faces of IBM Plex Mono leave out, so none falls back
 * to a face of another width. From JetBrains Mono (OFL 1.1, OFL.txt), whose
 * advance is Plex's 0.6em: ${fromJetBrains.join(' ')}
 */
${faces(fromJetBrains)}`,
);
console.log(`plex-symbols.woff2, from JetBrains Mono: ${fromJetBrains.join(' ')}`);
