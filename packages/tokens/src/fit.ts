/**
 * Fitting a palette to the contrast gate (cairn 0022, 0163).
 *
 * The gate measures every pair in every view a browser can put it in (0163):
 * the sRGB value, the p3 override as a p3 screen lights it, and the same
 * override as Chromium reports it in sRGB. A palette designed in OKLCH can
 * hold in one and fall short in another — a vivid green that reads at 4.5:1
 * mapped into sRGB reads at 4.4:1 clipped. So the generator fits what it
 * writes: each slot that fails one of the declared pairs is moved away from
 * the background in lightness, keeping its hue and chroma, until it passes
 * everywhere. Every move is recorded, so the generator prints it and the
 * tokens say what changed. A palette that cannot be fitted is an error.
 */
import { palette as generated, type Palette, type PaletteSlot } from './ansi.ts';
import { contrast, type Oklch, round, toHex } from './color.ts';
import type { Group } from './dtcg.ts';
import type { Mode, ThemeInputs } from './inputs.ts';
import { minimumIn, pairs } from './pairs.ts';
import { type Contrast, moreContrast, semanticColors } from './semantic.ts';

/** One slot, moved to pass the gate. */
export interface Adjustment {
  readonly mode: Mode;
  readonly slot: PaletteSlot;
  readonly from: string;
  readonly to: string;
  /** The pair that needed it, as the gate names it. */
  readonly because: string;
}

/**
 * The slots a palette's text sits on. They are never moved: changing the ground
 * would change the theme. What moves is whatever sits on it.
 */
const grounds: ReadonlySet<PaletteSlot> = new Set<PaletteSlot>([
  'background',
  'surface',
  'subtle',
  'hover',
  'active',
  'tint-blue',
  'tint-cyan',
  'tint-green',
  'tint-yellow',
  'tint-red',
]);

/** `fg.muted` → `muted`: which palette slot each semantic token names. */
function slotsOf(group: Group, trail: string[] = [], out = new Map<string, PaletteSlot>()) {
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith('$')) continue;
    const at = [...trail, key];
    const value = (node as { $value?: unknown }).$value;
    if (typeof value === 'string')
      out.set(at.join('.'), value.slice('{ansi.'.length, -1) as PaletteSlot);
    else if (value === undefined) slotsOf(node as Group, at, out);
  }
  return out;
}

const semanticSlots = slotsOf(semanticColors());

/**
 * Each contrast context (0065) reads the palette its own way, and each pair is
 * held to that context's minimum: the standard reading, and increased
 * contrast, where muted text is the foreground, colour takes the bright slot
 * and text is held to 7:1.
 */
const readings: readonly {
  readonly name: Contrast;
  readonly slots: ReadonlyMap<string, PaletteSlot>;
}[] = [
  { name: 'standard', slots: semanticSlots },
  { name: 'more', slots: new Map([...semanticSlots, ...Object.entries(moreContrast)]) },
];

function slotIn(slots: ReadonlyMap<string, PaletteSlot>, path: string): PaletteSlot {
  const found = slots.get(path);
  if (!found) throw new Error(`${path} is not a semantic colour`);
  return found;
}

const STEP = 0.005;
const clampL = (l: number): number => Math.min(1, Math.max(0, l));

/**
 * Fit a palette for one mode. Returns the palette unchanged, with no
 * adjustments, when it already passes; throws when moving lightness cannot
 * make it pass.
 */
export function fitContrast(
  palette: Palette,
  mode: Mode,
): { palette: Palette; adjustments: Adjustment[] } {
  const fitted: Record<PaletteSlot, Oklch> = { ...palette };
  const moved = new Map<PaletteSlot, string>();
  // Away from the page: lighter on a dark background, darker on a light one.
  const direction = fitted.background.l < 0.5 ? 1 : -1;

  for (let pass = 0; pass < 400; pass++) {
    let failing = 0;
    for (const reading of readings) {
      for (const pair of pairs) {
        const min = minimumIn(pair, reading.name);
        for (const bg of pair.bg) {
          const [f, b] = [slotIn(reading.slots, pair.fg), slotIn(reading.slots, bg)];
          if (f === b || contrast(fitted[f], fitted[b]) >= min) continue;
          failing += 1;
          const target = grounds.has(f) ? b : f;
          const where = `${pair.fg} on ${bg} (${mode}${reading.name === 'more' ? ', more contrast' : ''})`;
          if (grounds.has(target)) {
            throw new Error(`${where}: both are grounds, so neither can move`);
          }
          const before = fitted[target];
          const l = Math.min(1, Math.max(0, before.l + direction * STEP));
          if (l === before.l) throw new Error(`${where} cannot reach ${min}:1`);
          fitted[target] = round({ ...before, l });
          const because = `${pair.fg} on ${bg}${reading.name === 'more' ? ', in more contrast' : ''}`;
          if (!moved.has(target)) moved.set(target, because);
        }
      }
    }
    if (failing === 0) break;
    if (pass === 399) throw new Error(`the ${mode} palette could not be fitted to the gate`);
  }

  // Fitting can bring two edges to the same 3:1 from different starts, and a
  // control's edge must never end up quieter than the ordinary one (0178).
  for (let pass = 0; pass < 200; pass++) {
    const edge = contrast(fitted.border, fitted.background);
    if (contrast(fitted['border-strong'], fitted.background) > edge) break;
    const before = fitted['border-strong'];
    fitted['border-strong'] = round({ ...before, l: clampL(before.l + direction * STEP) });
    if (!moved.has('border-strong'))
      moved.set('border-strong', 'border.control past border.default');
  }

  const adjustments = [...moved].map(([s, because]) => ({
    mode,
    slot: s,
    from: toHex(palette[s]),
    to: toHex(fitted[s]),
    because,
  }));
  return { palette: fitted, adjustments };
}

/** One line per adjustment, for the generator's output and the theme file. */
export function describeAdjustment(a: Adjustment): string {
  return `${a.mode} ${a.slot}: ${a.from} → ${a.to} (for ${a.because})`;
}

/** The palette a theme's inputs generate, fitted to the gate: what the tokens and terminal files hold. */
export function fittedPalette(
  inputs: ThemeInputs,
  mode: Mode,
): { palette: Palette; adjustments: Adjustment[] } {
  return fitContrast(generated(inputs, mode), mode);
}
