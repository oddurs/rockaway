/**
 * The colour pairs the system promises are readable (cairn 0022). Each names a
 * foreground, the backgrounds it may sit on, and the WCAG 2 minimum it must
 * meet there: 4.5:1 for text, 3:1 for control boundaries and focus (1.4.11).
 * `fg.default` is held to 7:1, above AA, because it is most of the text.
 */
import { type Contrast, intents, syntaxRoles } from './semantic.ts';

export interface Pair {
  readonly fg: string;
  readonly bg: readonly string[];
  readonly min: number;
}

const surfaces = ['bg.page', 'bg.surface', 'bg.subtle', 'bg.hover', 'bg.active'];

export const pairs: readonly Pair[] = [
  { fg: 'fg.default', bg: surfaces, min: 7 },
  { fg: 'fg.muted', bg: surfaces, min: 4.5 },
  { fg: 'fg.on-inverse', bg: ['bg.inverse'], min: 4.5 },
  ...intents.flatMap((i): Pair[] => [
    { fg: `fg.${i}`, bg: ['bg.page', 'bg.surface', `bg.${i}.subtle`], min: 4.5 },
    { fg: `fg.on-${i}`, bg: [`bg.${i}.solid`, `bg.${i}.solid-hover`], min: 4.5 },
    { fg: `border.${i}`, bg: ['bg.page', 'bg.surface'], min: 3 },
  ]),
  // The ordinary edge is a boundary: on a grid a frame is all that separates
  // a pane from the next, so it is a non-text pair like a control's (0178).
  { fg: 'border.default', bg: ['bg.page', 'bg.surface', 'bg.subtle'], min: 3 },
  { fg: 'border.control', bg: ['bg.page', 'bg.surface'], min: 3 },
  { fg: 'border.focus', bg: ['bg.page', 'bg.surface'], min: 3 },
  { fg: 'bg.accent.solid', bg: ['bg.page', 'bg.surface'], min: 3 },
  // Code sits on a surface, or on the subtle ground of a code block (0144).
  ...syntaxRoles.map(
    (role): Pair => ({
      fg: `syntax.${role}`,
      bg: ['bg.surface', 'bg.subtle'],
      min: 4.5,
    }),
  ),
];

/**
 * A pair's minimum in a contrast context. Increased contrast (0065) holds text
 * to 7:1, WCAG's AAA; an edge or a fill is a boundary, and stays at 3:1.
 */
export function minimumIn(pair: Pair, contrast: Contrast): number {
  return contrast === 'more' && pair.min >= 4.5 ? Math.max(pair.min, 7) : pair.min;
}
