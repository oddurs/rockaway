/**
 * Builds the site's one font (cairn 0103): JetBrains Mono, cut down to the
 * characters the system sets in type, as WOFF2, with its metrics beside it.
 *
 *   pnpm --filter site font
 *
 * Run by hand when the character set or the font's version changes, and commit
 * both outputs. The build never touches the network, and never runs a
 * subsetter: the source font is pinned by version and hash here, and what it
 * produced is reviewed like any other change.
 *
 * Run it after `pnpm build`: the marks come from the published tokens.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { marks, spinnerFrames } from '@rockaway/tokens';
import subsetFont from 'subset-font';

const VERSION = 'v2.304';
const SOURCE = `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/${VERSION}/fonts/variable/JetBrainsMono%5Bwght%5D.ttf`;
const SHA256 = '662a196d58f1183bf2d77428b6d5283fe3f45161ab021bea4036bc98e5cac016';

/**
 * What the font draws. Letters, digits and punctuation for prose and code in
 * the Latin languages, the arrows and keyboard symbols KeyHint prints, and
 * every mark and spinner frame the tokens define, in every repertoire,
 * because a state mark that falls back to another font is the one place a
 * reader would see the seam.
 *
 * Not box drawing (U+2500–257F) and not blocks (U+2580–259F): the cell draws
 * those from its edge weights (0116), so the font never has to. Until the cell
 * renderer lands (0117) they fall through to the metric-matched fallback, which
 * has the same advance, so a frame stays on the grid either way.
 */
const ranges: ReadonlyArray<readonly [number, number]> = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x00ff], // Latin-1 Supplement, which is most of Western Europe
  [0x0100, 0x017f], // Latin Extended-A: Central Europe, the Baltics, Turkish
  [0x2010, 0x2027], // dashes, quotes, the bullet, the ellipsis
  [0x2030, 0x203a], // per mille, primes, angle quotes
  [0x20ac, 0x20ac], // €
  [0x2122, 0x2122], // ™
  [0x2190, 0x2195], // ← ↑ → ↓ ↔ ↕
  [0x2212, 0x2212], // − the minus sign, which is not the hyphen
  [0x2248, 0x2248], // ≈
  [0x2260, 0x2260], // ≠
  [0x2264, 0x2265], // ≤ ≥
];

/** KeyHint's glyphs (packages/react/src/components/key-hint.tsx). */
const keys = '⌘⌥⇧⌃⌫⌦⎋⏎⇥↵';

function charset(): string {
  const chars = new Set<string>();
  for (const [from, to] of ranges) {
    for (let code = from; code <= to; code++) chars.add(String.fromCodePoint(code));
  }
  const fromTokens = [
    ...Object.values(marks).flatMap((set) => Object.values(set)),
    ...Object.values(spinnerFrames).flat(),
  ];
  for (const char of [...fromTokens.join(''), ...keys]) {
    // What the cell draws stays out, even when a token names it.
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x2500 || code > 0x259f) chars.add(char);
  }
  return [...chars].sort().join('');
}

/** The few numbers the fallback faces need, read from the font's own tables. */
export interface FontMetrics {
  readonly unitsPerEm: number;
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
  /** Every glyph's advance, since the font is monospaced; `1ch` is this over the em. */
  readonly advance: number;
}

function metrics(font: Buffer): FontMetrics {
  const tables = new Map<string, number>();
  const count = font.readUInt16BE(4);
  for (let i = 0; i < count; i++) {
    const entry = 12 + i * 16;
    tables.set(font.toString('latin1', entry, entry + 4), font.readUInt32BE(entry + 8));
  }
  const table = (tag: string): number => {
    const offset = tables.get(tag);
    if (offset === undefined) throw new Error(`the font has no ${tag} table`);
    return offset;
  };
  const head = table('head');
  const os2 = table('OS/2');
  const post = table('post');
  if (font.readUInt32BE(post + 12) === 0) throw new Error('the font does not say it is monospaced');
  // USE_TYPO_METRICS is set, so the typo metrics are the ones browsers use.
  if ((font.readUInt16BE(os2 + 62) & 0x80) === 0) throw new Error('expected USE_TYPO_METRICS');
  return {
    unitsPerEm: font.readUInt16BE(head + 18),
    advance: font.readInt16BE(os2 + 2),
    ascent: font.readInt16BE(os2 + 68),
    descent: font.readInt16BE(os2 + 70),
    lineGap: font.readInt16BE(os2 + 72),
  };
}

/** `U+20-7E,U+A0-FF,…`, for the face's `unicode-range`. */
function unicodeRange(text: string): string {
  const codes = [...text].map((c) => c.codePointAt(0) ?? 0).sort((a, b) => a - b);
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

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`${SOURCE}: ${response.status}`);
const source = Buffer.from(await response.arrayBuffer());
const hash = createHash('sha256').update(source).digest('hex');
if (hash !== SHA256) throw new Error(`${SOURCE} has changed: sha256 ${hash}`);

const text = charset();
const woff2 = await subsetFont(source, text, {
  targetFormat: 'woff2',
  // Regular and bold are the only weights a cell has (attribute.bold).
  variationAxes: { wght: { min: 400, max: 700, default: 400 } },
  // Ligatures are off on the grid (a ligature is two characters in one cell),
  // so `calt` and the stylistic sets go. Mark positioning stays, for accents.
  keepFeatures: ['ccmp', 'locl', 'mark', 'mkmk'],
  noLayoutClosure: true,
  // Copyright, licence description and licence URL: the OFL travels with the
  // font in its own metadata, wherever the file ends up.
  preserveNameIds: [0, 13, 14],
});

const out = path.join(import.meta.dirname, '..', 'src', 'fonts');
writeFileSync(path.join(out, 'jetbrains-mono.woff2'), woff2);
writeFileSync(
  path.join(out, 'jetbrains-mono.json'),
  `${JSON.stringify(
    {
      family: 'JetBrains Mono',
      license: 'OFL-1.1',
      source: { url: SOURCE, sha256: SHA256 },
      // As the face's `font-weight` writes it (and as the formatter leaves it).
      weight: '400 700',
      metrics: metrics(source),
      unicodeRange: unicodeRange(text),
      bytes: woff2.length,
    },
    null,
    2,
  )}\n`,
);
console.log(`jetbrains-mono.woff2: ${text.length} characters, ${woff2.length} bytes`);
