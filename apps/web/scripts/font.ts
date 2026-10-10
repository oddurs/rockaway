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
 * The cut faces are renamed: a subset is a modified version, and the OFL
 * reserves the name Plex (app/fonts/NOTICE.md).
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
import fontverter from 'fontverter';
import subsetFont from 'subset-font';

const PLEX =
  'https://raw.githubusercontent.com/IBM/plex/017181e320cd0bea18f798d9ceb27a11c885c618/packages/plex-mono/fonts/complete/ttf';
const FACES = [
  {
    file: 'IBMPlexMono-Regular.ttf',
    out: 'site-mono-regular',
    name: 'Regular',
    weight: 400,
    style: 'normal',
  },
  {
    file: 'IBMPlexMono-Bold.ttf',
    out: 'site-mono-bold',
    name: 'Bold',
    weight: 700,
    style: 'normal',
  },
  {
    file: 'IBMPlexMono-Italic.ttf',
    out: 'site-mono-italic',
    name: 'Italic',
    weight: 400,
    style: 'italic',
  },
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

/** The name table's strings, by name ID, as Windows reads them (platform 3, encoding 1, US English). */
function names({ font, at }: Tables): Map<number, string> {
  const table = at('name');
  const count = font.readUInt16BE(table + 2);
  const strings = table + font.readUInt16BE(table + 4);
  const found = new Map<number, string>();
  for (let i = 0; i < count; i++) {
    const record = table + 6 + i * 12;
    const [platform, encoding, language, id] = [0, 2, 4, 6].map((o) =>
      font.readUInt16BE(record + o),
    ) as [number, number, number, number];
    if (platform !== 3 || encoding !== 1 || language !== 0x409) continue;
    const length = font.readUInt16BE(record + 8);
    const offset = strings + font.readUInt16BE(record + 10);
    found.set(
      id,
      font
        .subarray(offset, offset + length)
        .swap16()
        .toString('utf16le'),
    );
    // `swap16` turned the bytes round in place: turn them back.
    font.subarray(offset, offset + length).swap16();
  }
  return found;
}

/** A name table of the given strings, for Windows and so for every browser. */
function nameTable(strings: ReadonlyMap<number, string>): Buffer {
  const ids = [...strings.keys()].sort((a, b) => a - b);
  const encoded = ids.map((id) => Buffer.from(strings.get(id) ?? '', 'utf16le').swap16());
  const header = Buffer.alloc(6 + ids.length * 12);
  header.writeUInt16BE(0, 0);
  header.writeUInt16BE(ids.length, 2);
  header.writeUInt16BE(header.length, 4);
  let offset = 0;
  ids.forEach((id, i) => {
    const at = 6 + i * 12;
    header.writeUInt16BE(3, at);
    header.writeUInt16BE(1, at + 2);
    header.writeUInt16BE(0x409, at + 4);
    header.writeUInt16BE(id, at + 6);
    header.writeUInt16BE(encoded[i]?.length ?? 0, at + 8);
    header.writeUInt16BE(offset, at + 10);
    offset += encoded[i]?.length ?? 0;
  });
  return Buffer.concat([header, ...encoded]);
}

const checksum = (data: Buffer): number => {
  const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
  return sum;
};

/** The font with its name table replaced, its directory and checksums written again. */
function withNames(font: Buffer, name: Buffer): Buffer {
  const count = font.readUInt16BE(4);
  const entries = Array.from({ length: count }, (_, i) => {
    const at = 12 + i * 16;
    const tag = font.toString('latin1', at, at + 4);
    const offset = font.readUInt32BE(at + 8);
    const length = font.readUInt32BE(at + 12);
    return {
      tag,
      data: tag === 'name' ? name : Buffer.from(font.subarray(offset, offset + length)),
    };
  }).sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const head = entries.find((e) => e.tag === 'head');
  if (!head) throw new Error('the font has no head table');
  head.data.writeUInt32BE(0, 8);
  const directory = Buffer.alloc(12 + count * 16);
  font.copy(directory, 0, 0, 4);
  const power = 2 ** Math.floor(Math.log2(count));
  directory.writeUInt16BE(count, 4);
  directory.writeUInt16BE(power * 16, 6);
  directory.writeUInt16BE(Math.log2(power), 8);
  directory.writeUInt16BE(count * 16 - power * 16, 10);
  const bodies: Buffer[] = [];
  let offset = directory.length;
  entries.forEach(({ tag, data }, i) => {
    const at = 12 + i * 16;
    directory.write(tag, at, 'latin1');
    directory.writeUInt32BE(checksum(data), at + 4);
    directory.writeUInt32BE(offset, at + 8);
    directory.writeUInt32BE(data.length, at + 12);
    const padded = Buffer.concat([data, Buffer.alloc((4 - (data.length % 4)) % 4)]);
    bodies.push(padded);
    offset += padded.length;
  });
  const whole = Buffer.concat([directory, ...bodies]);
  const headAt = whole.readUInt32BE(12 + entries.indexOf(head) * 16 + 8);
  whole.writeUInt32BE((0xb1b0afba - checksum(whole)) >>> 0, headAt + 8);
  return whole;
}

/**
 * The face, renamed (cairn 0295). A subset is a modified version of the font,
 * and the OFL keeps a Reserved Font Name for the original: IBM's "Plex". So
 * the cut faces are named Rockaway Mono Site Subset, in every name a browser
 * or a system reads, and keep IBM's copyright and the licence's description
 * and URL. NOTICE.md beside them says what they were cut from.
 */
async function cut(
  source: Buffer,
  text: string,
  family: string,
  style: string,
  extra: Partial<Parameters<typeof subsetFont>[2]> = {},
): Promise<Buffer> {
  const original = names(tables(source));
  const ttf = await subsetFont(source, text, { ...options, ...extra, targetFormat: 'truetype' });
  const postscript = `${family.replaceAll(' ', '')}-${style.replaceAll(' ', '')}`;
  const strings = new Map<number, string>([
    [0, original.get(0) ?? ''],
    [1, family],
    [2, style],
    [3, `${postscript};${original.get(5) ?? ''}`],
    [4, `${family} ${style}`],
    [5, original.get(5) ?? ''],
    [6, postscript],
    [13, original.get(13) ?? ''],
    [14, original.get(14) ?? ''],
    // A variable face's axes and instances name themselves from 256 up: kept.
    ...[...names(tables(Buffer.from(ttf)))].filter(([id]) => id >= 256),
  ]);
  return fontverter.convert(withNames(Buffer.from(ttf), nameTable(strings)), 'woff2');
}

// Ligatures are off on the grid (a ligature is two characters in one cell),
// so `calt` and the stylistic sets go; mark positioning stays, for accents.
const options = {
  keepFeatures: ['ccmp', 'locl', 'mark', 'mkmk'],
  noLayoutClosure: true,
} as const;

const FAMILY = 'Rockaway Mono Site Subset';
const SYMBOLS_FAMILY = 'Rockaway Mono Site Symbols';

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
  const woff2 = await cut(source, drawn.join(''), FAMILY, face.name);
  writeFileSync(path.join(out, `${face.out}.woff2`), woff2);
  faces.push({ ...face, bytes: woff2.length, unicodeRange: unicodeRange(drawn) });
  console.log(`${face.out}.woff2: ${drawn.length} characters, ${woff2.length} bytes`);
}

const jetbrains = await fetchPinned(JETBRAINS, 'JetBrainsMono[wght].ttf');
const symbols = await cut(jetbrains, missing.join(''), SYMBOLS_FAMILY, 'Regular', {
  variationAxes: { wght: { min: 400, max: 700, default: 400 } },
});
writeFileSync(path.join(out, 'site-symbols.woff2'), symbols);
console.log(`site-symbols.woff2: ${missing.join(' ')}, ${symbols.length} bytes`);

writeFileSync(
  path.join(out, 'site-mono.json'),
  `${JSON.stringify(
    {
      family: FAMILY,
      derivedFrom: 'IBM Plex Mono',
      license: 'OFL-1.1',
      source: PLEX,
      metrics: regular,
      faces,
      symbols: {
        family: SYMBOLS_FAMILY,
        derivedFrom: 'JetBrains Mono',
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
