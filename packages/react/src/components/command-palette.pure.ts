/**
 * `CommandPalette`: the pure half (cairn 0102, 0126).
 *
 * The fuzzy matcher, the ranked and sectioned results, and the whole palette
 * as cells: its input row, the rule under it, its results with their matched
 * cells marked, and the states that have nothing to list. No React and no
 * client boundary, so a server component, a static renderer or a test can
 * call them; `command-palette.tsx` imports them from here.
 */
import { Attr, type Buffer, drawText, graphemes, type Style, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { formatKeys } from './key-hint.pure.ts';
import { scrollbarBuffer } from './list.pure.ts';
import { menuMarks, menuRowStyle } from './menu.pure.ts';
import { type OverlayDivider, overlayBuffer } from './overlay.pure.ts';

/** A command the palette can run. */
export interface PaletteCommand {
  readonly id: string;
  /** What it does, as the reader searches for it: `Open file`. */
  readonly label: string;
  /** Its chord, `mod+o`, when it has one: shown at the end of its row. */
  readonly keys?: string;
  /** The section it is listed under: `Files`. */
  readonly section?: string;
}

/** Where a query matched a label: which of its graphemes, and how well. */
export interface FuzzyMatch {
  /** Higher is better. Only comparable between matches of the same query. */
  readonly score: number;
  /** The matched graphemes of the label, by index, in order. */
  readonly indices: readonly number[];
}

/** A command that matched, and where. */
export interface PaletteResult {
  readonly command: PaletteCommand;
  readonly match: FuzzyMatch;
}

/** A section of results, in the order it is listed. */
export interface PaletteSection {
  /** Its title, or `undefined` for commands listed under none. */
  readonly title: string | undefined;
  readonly results: readonly PaletteResult[];
}

/** A grapheme that starts a word: the first, or one after a separator. */
const SEPARATOR = /[\s\-_./:\\]/;

/**
 * Whether `query` matches `text` in order, a subsequence ignoring case, and
 * how well: each matched character scores, more when it starts a word or
 * follows the one before it, and less the further it had to skip to get
 * there. Every starting point for the first character is tried, so `of` in
 * `Open file` takes the `f` that starts `file`, not a later one.
 *
 * An empty query matches everything, with nothing marked.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | undefined {
  const needle = [...graphemes(query.trim().toLowerCase())].filter((g) => !/^\s$/.test(g));
  if (needle.length === 0) return { score: 0, indices: [] };
  const hay = [...graphemes(text)];
  const lower = hay.map((g) => g.toLowerCase());
  const starts = (i: number): boolean => i === 0 || SEPARATOR.test(hay[i - 1] ?? '');

  let best: FuzzyMatch | undefined;
  for (let first = 0; first < lower.length; first++) {
    if (lower[first] !== needle[0]) continue;
    const indices = [first];
    let at = first + 1;
    for (let q = 1; q < needle.length; q++) {
      // The next occurrence, preferring one that starts a word if it comes
      // before any run would break: a cheap stand-in for a full alignment.
      let found = -1;
      for (let i = at; i < lower.length; i++) {
        if (lower[i] !== needle[q]) continue;
        if (found === -1) found = i;
        if (i === at || starts(i)) {
          found = i;
          break;
        }
      }
      if (found === -1) break;
      indices.push(found);
      at = found + 1;
    }
    if (indices.length !== needle.length) break;
    let score = 0;
    indices.forEach((i, k) => {
      score += 1;
      if (starts(i)) score += 3;
      const previous = indices[k - 1];
      if (previous !== undefined) {
        if (i === previous + 1) score += 2;
        else score -= Math.min(3, (i - previous - 1) * 0.5);
      }
    });
    // An earlier match is a better one, a little.
    score -= first * 0.1;
    if (best === undefined || score > best.score) best = { score, indices };
  }
  return best;
}

/**
 * The commands that match `query`, in sections. With no query every command
 * is listed in the order given. With one, each section's results are ranked
 * best first, and the sections by their best result; a section with nothing
 * that matches is left out. Ties keep the order given.
 */
export function matchCommands(
  commands: readonly PaletteCommand[],
  query: string,
): readonly PaletteSection[] {
  const sections: { title: string | undefined; results: PaletteResult[]; order: number }[] = [];
  for (const command of commands) {
    const match = fuzzyMatch(query, command.label);
    if (match === undefined) continue;
    let section = sections.find((s) => s.title === command.section);
    if (section === undefined) {
      section = { title: command.section, results: [], order: sections.length };
      sections.push(section);
    }
    section.results.push({ command, match });
  }
  if (query.trim() === '') return sections;
  for (const section of sections) {
    section.results = section.results
      .map((result, i) => ({ result, i }))
      .sort((a, b) => b.result.match.score - a.result.match.score || a.i - b.i)
      .map(({ result }) => result);
  }
  const bestOf = (s: { results: PaletteResult[] }): number => s.results[0]?.match.score ?? 0;
  return [...sections].sort((a, b) => bestOf(b) - bestOf(a) || a.order - b.order);
}

/** The results flattened, in the order the palette lists them: what the cursor moves through. */
export function resultsInOrder(sections: readonly PaletteSection[]): readonly PaletteResult[] {
  return sections.flatMap((s) => s.results);
}

/** What the palette is showing below its input row. */
export type PaletteState = 'results' | 'loading' | 'empty' | 'no-match';

/** Which of those it is, from what it has and what was asked. */
export function paletteState(
  commands: readonly PaletteCommand[],
  sections: readonly PaletteSection[],
  loading = false,
): PaletteState {
  if (loading) return 'loading';
  if (commands.length === 0) return 'empty';
  return sections.length === 0 ? 'no-match' : 'results';
}

/** What each state says, where there are no results to list. */
export const PALETTE_TEXT = {
  loading: 'Loading commands',
  empty: 'No commands.',
  noMatch: (query: string): string => `Nothing matches "${query.trim()}".`,
} as const;

/** A matched grapheme: underlined, and in the accent, so it reads without colour too. */
export function matchedStyle(row: Style): Style {
  return {
    ...row,
    ...(row.attrs & Attr.reverse ? {} : { fg: 'fg.accent' }),
    attrs: row.attrs | Attr.underline,
  };
}

export interface CommandPaletteBufferOptions {
  readonly commands: readonly PaletteCommand[];
  /** What has been typed. */
  readonly query?: string;
  /** The chord that opens the palette, shown at the end of the input row: `mod+k`. */
  readonly chord?: string;
  /** The index, in the listed order, of the result under the cursor. */
  readonly cursor?: number;
  /** Cells across, the frame included. */
  readonly width: number;
  /** The most rows the results take before they scroll. */
  readonly rows?: number;
  /** Still loading commands: the spinner and what it is waiting for. */
  readonly loading?: boolean;
  /** Which of the spinner's frames to draw. */
  readonly frame?: number;
}

/**
 * The mark at the start of the input row. The theme's cursor mark until the
 * theme has a prompt mark of its own (asked of the tokens engineer for 0102):
 * where the typing goes, `▸` or `>`.
 */
export function promptMark(glyphs: Glyphs = themeGlyphs.default): string {
  return glyphs.mark.cursor;
}

/** The input row, the rule under it: the first result is on the frame's fourth row. */
const RESULTS_TOP = 3;

/**
 * The palette as cells, framed as a modal is: the input row (the theme's
 * prompt mark, what has been typed, and the chord that opens the palette at
 * its end), a rule across the frame, then the results. Each section's title
 * is a rule set into the frame, as a menu's is; each result is a menu row,
 * its matched graphemes underlined and in the accent, its chord at its end.
 * With nothing to list, the first row says why: loading, no commands, or
 * nothing matching what was typed.
 *
 * This is the palette's text snapshot; the component draws its rows with the
 * same functions.
 */
export function commandPaletteBuffer(
  {
    commands,
    query = '',
    chord,
    cursor = 0,
    width,
    rows = 8,
    loading = false,
    frame = 0,
  }: CommandPaletteBufferOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const across = Math.max(8, width);
  const inner = across - 2;
  const sections = matchCommands(commands, query);
  const state = paletteState(commands, sections, loading);

  // The listed rows: a title row for each titled section, then its results.
  type Line =
    | { readonly kind: 'title'; readonly title: string }
    | { readonly kind: 'result'; readonly result: PaletteResult; readonly index: number };
  const lines: Line[] = [];
  let index = 0;
  for (const section of sections) {
    if (section.title !== undefined) lines.push({ kind: 'title', title: section.title });
    for (const result of section.results) lines.push({ kind: 'result', result, index: index++ });
  }

  const visible = Math.max(1, Math.min(rows, state === 'results' ? lines.length : 1));
  // The cursor's row is always in sight: scrolled to, as the list scrolls.
  const cursorLine = lines.findIndex((l) => l.kind === 'result' && l.index === cursor);
  const offset =
    state !== 'results' || lines.length <= visible
      ? 0
      : Math.max(0, Math.min(lines.length - visible, cursorLine - visible + 1));
  const height = RESULTS_TOP + visible + 1;

  const dividers: OverlayDivider[] = [{ row: RESULTS_TOP - 1 }];
  if (state === 'results') {
    lines.slice(offset, offset + visible).forEach((line, y) => {
      if (line.kind === 'title') dividers.push({ row: RESULTS_TOP + y, title: line.title });
    });
  }
  const chrome = overlayBuffer({ width: across, height }, { kind: 'modal', dividers }, glyphs);
  // The results scroll on their own, under an input row that stays: their
  // position is a scrollbar column in their last cell, as a List's is, not
  // the frame's edge, which runs past the input row too.
  const bar =
    state === 'results' && lines.length > visible
      ? scrollbarBuffer({ total: lines.length, visible, offset }, glyphs)
      : undefined;

  const prompt = promptMark(glyphs);
  const muted: Style = { fg: 'fg.muted', attrs: Attr.none };
  return chrome.draw((draft) => {
    // The input row: a cell of air, the prompt, a cell of air, the query;
    // the chord at the end, a cell of air before the frame.
    const opener = chord === undefined ? '' : formatKeys(chord, 'other', 'platform', glyphs);
    const room = Math.max(0, inner - 3 - (opener === '' ? 0 : stringWidth(opener) + 2));
    drawText(draft, { x: 2, y: 1 }, prompt, { style: { fg: 'fg.accent', attrs: Attr.none } });
    drawText(draft, { x: 4, y: 1 }, query, { maxWidth: room, ellipsis: '' });
    if (opener !== '') {
      drawText(draft, { x: across - 2 - stringWidth(opener), y: 1 }, opener, { style: muted });
    }

    if (state !== 'results') {
      const said =
        state === 'loading'
          ? `${glyphs.spinner[frame % glyphs.spinner.length] ?? ''} ${PALETTE_TEXT.loading}`
          : state === 'empty'
            ? PALETTE_TEXT.empty
            : PALETTE_TEXT.noMatch(query);
      drawText(draft, { x: 2, y: RESULTS_TOP }, said, {
        maxWidth: inner - 2,
        ellipsis: glyphs.mark.ellipsis,
        style: muted,
      });
      return;
    }

    lines.slice(offset, offset + visible).forEach((line, y) => {
      if (line.kind !== 'result') return;
      const at = RESULTS_TOP + y;
      const state = { cursor: line.index === cursor };
      const style = menuRowStyle(state);
      for (let x = 1; x <= inner; x++) drawText(draft, { x, y: at }, ' ', { style });
      const [mark] = menuMarks(state, false, glyphs);
      drawText(draft, { x: 1, y: at }, mark ?? ' ', { style });
      const keys =
        line.result.command.keys === undefined
          ? ''
          : formatKeys(line.result.command.keys, 'other', 'platform', glyphs);
      const end = across - 2;
      const labelRoom = Math.max(0, inner - 2 - (keys === '' ? 0 : stringWidth(keys) + 2));
      const marked = new Set(line.result.match.indices);
      let x = 2;
      [...graphemes(line.result.command.label)].forEach((g, i) => {
        if (x - 2 >= labelRoom) return;
        x += drawText(draft, { x, y: at }, g, {
          style: marked.has(i) ? matchedStyle(style) : style,
        });
      });
      if (keys !== '') {
        const chordStyle: Style = state.cursor ? style : { ...style, fg: 'fg.muted' };
        drawText(draft, { x: end - stringWidth(keys), y: at }, keys, { style: chordStyle });
      }
    });
    if (bar !== undefined) {
      for (let y = 0; y < visible; y++) {
        // A title's row is a rule, and the rule runs through the column.
        if (lines[offset + y]?.kind === 'title') continue;
        drawText(draft, { x: across - 2, y: RESULTS_TOP + y }, bar.at({ x: 0, y })?.ch ?? ' ', {
          style: muted,
        });
      }
    }
  });
}
