/**
 * The colour pairs the system promises are readable (cairn 0022). Each names a
 * foreground, the backgrounds it may sit on, and the WCAG 2 minimum it must
 * meet there: 4.5:1 for text, 3:1 for control boundaries and focus (1.4.11).
 * `fg.default` is held to 7:1, above AA, because it is most of the text.
 */
import { intents } from './semantic.ts';

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
  { fg: 'border.control', bg: ['bg.page', 'bg.surface'], min: 3 },
  { fg: 'border.focus', bg: ['bg.page', 'bg.surface'], min: 3 },
  { fg: 'bg.accent.solid', bg: ['bg.page', 'bg.surface'], min: 3 },
];
