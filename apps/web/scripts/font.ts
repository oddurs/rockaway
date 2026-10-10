/**
 * Builds the site's one font (cairn 0295): IBM Plex Mono, its regular, its
 * bold and its true italic, cut down to the characters the system sets in
 * type, as WOFF2, with its metrics beside them. And the few characters Plex
 * does not draw (the keyboard's symbols, the marks, the spinners), cut from
 * JetBrains Mono, whose advance is Plex's 0.6em, so none falls back to a face
 * of another width.
 *
 *   pnpm --filter web font
 *
 * Run by hand when the character set or a font's version changes, and commit
 * the outputs. The build never touches the network and never runs a
 * subsetter: each source is pinned by commit and hash here, and what it
 * produced is reviewed like any other change. Run it after building the
 * packages: the marks come from the published tokens.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { marks, spinnerFrames } from '@rockaway/tokens';
import subsetFont from 'subset-font';

const PLEX =
  'https://raw.githubusercontent.com/IBM/plex/017181e320cd0bea18f798d9ceb27a11c885c618/packages/plex-mono/fonts/complete/ttf';
const FACES = [
  { file: 'IBMPlexMono-Regular.ttf', out: 'plex-mono-regular', weight: 400, style: 'normal' },
  { file: 'IBMPlexMono-Bold.ttf', out: 'plex-mono-bold', weight: 700, style: 'normal' },
  { file: 'IBMPlexMono-Italic.ttf', out: 'plex-mono-italic', weight: 400, style: 'italic' },
] as const;
const SHA256: Readonly<Record<string, string>> = {
  'IBMPlexMono-Regular.ttf': '7c6fbddca4b700be918f5f6183d9bd4464fa427fe435f0b480d77fe2bb8c5a43',
  'IBMPlexMono-Bold.ttf': '74e5eedcfa4596497d34e19023cabdabd3a8c852b903007a5654a59591a72ffb',
  'IBMPlexMono-Italic.ttf': 'a55368deb953f594ac18336a1029009ed820e2d9abbb57ad601f61e22bec072b',
  'JetBrainsMono[wght].ttf': '662a196d58f1183bf2d77428b6d5283fe3f45161ab021bea4036bc98e5cac016',
};
const JETBRAINS =
  'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/v2.304/fonts/variable/JetBrainsMono%5Bwght%5D.ttf';

/**
 * What the font draws. Letters, digits and punctuation for prose and code in
 * the Latin languages, the arrows and keyboard symbols KeyHint prints, and
 * every mark and spinner frame the tokens define. Not box drawing and not
 * blocks: the cell draws those from its edges (0116), so no font has to.
 */
const ranges: ReadonlyArray<readonly [number, number]> = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x00ff], // Latin-1 Supplement
  [0x0100, 0x017f], // Latin Extended-A
  [0x2010, 0x2027], // dashes, quotes, the bullet, the ellipsis
  [0x2030, 0x203a], // per mille, primes, angle quotes
  [0x20ac, 0x20ac], // €
  [0x2122, 0x2122], // ™
  [0x2190, 0x2195], // ← ↑ → ↓ ↔ ↕
  [0x2212, 0x2212], // − the minus sign
  [0x2248, 0x2248], // ≈
  [0x2260, 0x2260], // ≠
  [0x2264, 0x2265], // ≤ ≥
];

/** KeyHint's glyphs. */
const keys = '⌘⌥⇧⌃⌫⌦⎋⏎⇥↵↗';

function charset(): string[] {
  const chars = new Set<string>();
  for (const [from, to] of ranges) {
    for (let code = from; code <= to; code++) chars.add(String.fromCodePoint(code));
  }
  const fromTokens = [
    ...Object.values(marks).flatMap((set) => Object.values(set)),
    ...Object.values(spinnerFrames).flat(),
  ];
  for (const char of [...fromTokens.join(''), ...keys]) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x2500 || code > 0x259f) chars.add(char);
  }
  return [...chars].sort();
}

interface Tables {
  readonly font: Buffer;
  readonly at: (tag: string) => number;
}

function tables(font: Buffer): Tables {
  const offsets = new Map<string, number>();
  const count = font.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    const entry = 12 + i * 16;
    offsets.set(font.toString('latin1', entry, entry + 4), font.readUInt32BE(entry + 8));
  }
  return {
    font,
    at: (tag) => {
      const offset = offsets.get(tag);
      if (offset === undefined) throw new Error(`the font has no ${tag} table`);
      return offset;
    },
  };
}

/** The numbers the fallback faces need, as browsers read them. */
function metrics({ font, at }: Tables) {
  const head = at('head');
  const os2 = at('OS/2');
  const hhea = at('hhea');
  if (font.readUInt32BE(at('post') + 12) === 0) throw new Error('not monospaced');
  // With USE_TYPO_METRICS the typo metrics are the ones browsers use; without
  // it, the horizontal header's.
  const typo = (font.readUInt16BE(os2 + 62) & 0x80) !== 0;
  return {
    unitsPerEm: font.readUInt16BE(head + 18),
    advance: font.readInt16BE(os2 + 2),
    ascent: typo ? font.readInt16BE(os2 + 68) : font.readInt16BE(hhea + 4),
    descent: typo ? font.readInt16BE(os2 + 70) : font.readInt16BE(hhea + 6),
    lineGap: typo ? font.readInt16BE(os2 + 72) : font.readInt16BE(hhea + 8),
  };
}

/** Every code point the font maps to a glyph (cmap formats 4 and 12). */
function covered({ font, at }: Tables): Set<number> {
  const cmap = at('cmap');
  const codes = new Set<number>();
  const count = font.readUInt16BE(cmap + 2);
  for (let i = 0; i < count; i++) {
    const sub = cmap + font.readUInt32BE(cmap + 4 + i * 8 + 4);
    const format = font.readUInt16BE(sub);
    if (format === 4) {
      const segs = font.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segs * 2 + 2;
      const deltas = starts + segs * 2;
      const rangeOffsets = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const end = font.readUInt16BE(ends + s * 2);
        const start = font.readUInt16BE(starts + s * 2);
        const delta = font.readInt16BE(deltas + s * 2);
        const ro = font.readUInt16BE(rangeOffsets + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          const glyph =
            ro === 0
              ? (c + delta) & 0xffff
              : font.readUInt16BE(rangeOffsets + s * 2 + ro + (c - start) * 2);
          if (glyph !== 0) codes.add(c);
        }
      }
    } else if (format === 12) {
      const groups = font.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const at = sub + 16 + g * 12;
        const start = font.readUInt32BE(at);
        const end = font.readUInt32BE(at + 4);
        for (let c = start; c <= end; c++) codes.add(c);
      }
    }
  }
  return codes;
}

/** `U+20-7E,U+A0-FF,…`, for a face's `unicode-range`. */
function unicodeRange(chars: readonly string[]): string {
  const codes = chars.map((c) => c.codePointAt(0) ?? 0).sort((a, b) => a - b);
  const runs: string[] = [];
  let start = codes[0] ?? 0;
  let end = start;
  const hex = (n: number): string => n.toString(16).toUpperCase();
  for (const code of [...codes.slice(1), -1]) {
    if (code === end + 1) {
      end = code;
      continue;
    }
    runs.push(start === end ? `U+${hex(start)}` : `U+${hex(start)}-${hex(end)}`);
    start = end = code;
  }
  return runs.join(',');
}

async function fetchPinned(url: string, name: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(source).digest('hex');
  if (SHA256[name] !== hash) throw new Error(`${name}: sha256 ${hash}, pinned ${SHA256[name]}`);
  return source;
}

// Ligatures are off on the grid (a ligature is two characters in one cell),
// so `calt` and the stylistic sets go; mark positioning stays, for accents.
// Copyright and the licence travel in the font's own names.
const options = {
  targetFormat: 'woff2',
  keepFeatures: ['ccmp', 'locl', 'mark', 'mkmk'],
  noLayoutClosure: true,
  preserveNameIds: [0, 13, 14],
} as const;

const out = path.join(import.meta.dirname, '..', 'app', 'fonts');
const wanted = charset();
const faces = [];
let regular: ReturnType<typeof metrics> | undefined;
let missing: string[] = [];
for (const face of FACES) {
  const source = await fetchPinned(`${PLEX}/${face.file}`, face.file);
  const read = tables(source);
  const has = covered(read);
  const drawn = wanted.filter((c) => has.has(c.codePointAt(0) ?? 0));
  if (face.weight === 400 && face.style === 'normal') {
    regular = metrics(read);
    missing = wanted.filter((c) => !has.has(c.codePointAt(0) ?? 0));
  }
  const woff2 = await subsetFont(source, drawn.join(''), options);
  writeFileSync(path.join(out, `${face.out}.woff2`), woff2);
  faces.push({ ...face, bytes: woff2.length, unicodeRange: unicodeRange(drawn) });
  console.log(`${face.out}.woff2: ${drawn.length} characters, ${woff2.length} bytes`);
}

const jetbrains = await fetchPinned(JETBRAINS, 'JetBrainsMono[wght].ttf');
const symbols = await subsetFont(jetbrains, missing.join(''), {
  ...options,
  variationAxes: { wght: { min: 400, max: 700, default: 400 } },
});
writeFileSync(path.join(out, 'plex-symbols.woff2'), symbols);
console.log(`plex-symbols.woff2: ${missing.join(' ')}, ${symbols.length} bytes`);

writeFileSync(
  path.join(out, 'plex-mono.json'),
  `${JSON.stringify(
    {
      family: 'IBM Plex Mono',
      license: 'OFL-1.1',
      source: PLEX,
      metrics: regular,
      faces,
      symbols: {
        source: JETBRAINS,
        characters: missing.join(''),
        unicodeRange: unicodeRange(missing),
        bytes: symbols.length,
      },
    },
    null,
    2,
  )}\n`,
);
