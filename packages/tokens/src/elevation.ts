/**
 * Elevation (cairn 0060). Shadow colours are tinted with the neutral hue and
 * vary by mode, so they live in the palette files; the shadow tokens alias
 * them and vary by the elevation input.
 */
import type { ColorValue, Group, Token } from './dtcg.ts';
import type { Elevation, Mode, NeutralTemperature } from './inputs.ts';
import { neutralTint } from './palette.ts';

type Alpha = Readonly<
  Record<'control' | 'contact' | 'ambient' | 'overlay-contact' | 'overlay-ambient', number>
>;

const alphas: Readonly<Record<Mode, Alpha>> = {
  light: {
    control: 0.06,
    contact: 0.05,
    ambient: 0.07,
    'overlay-contact': 0.08,
    'overlay-ambient': 0.14,
  },
  dark: { control: 0, contact: 0.4, ambient: 0.32, 'overlay-contact': 0.5, 'overlay-ambient': 0.5 },
};

function oklch(l: number, c: number, h: number, alpha: number): Token {
  return { $value: { colorSpace: 'oklch', components: [l, c, h], alpha } satisfies ColorValue };
}

/** Raw shadow and scrim colours for one mode (reference tier, in the palette file). */
export function shadowPalette(
  temperature: NeutralTemperature,
  accentHue: number,
  mode: Mode,
): Group {
  const { h } = neutralTint(temperature, accentHue);
  const [l, c] = mode === 'light' ? [0.2, 0.02] : [0, 0];
  return {
    shadow: Object.fromEntries(
      Object.entries(alphas[mode]).map(([k, a]) => [k, oklch(l, c, h, a)]),
    ),
    scrim: mode === 'light' ? oklch(0.25, 0.02, h, 0.28) : oklch(0, 0, 0, 0.45),
  };
}

const px = (value: number) => ({ value, unit: 'px' as const });

function layer(color: string, y: number, blur: number) {
  return {
    color: `{palette.shadow.${color}}`,
    offsetX: px(0),
    offsetY: px(y),
    blur: px(blur),
    spread: px(0),
  };
}

const none = [
  { color: '{palette.shadow.control}', offsetX: px(0), offsetY: px(0), blur: px(0), spread: px(0) },
];

/** Semantic shadows. Only `surface` follows the elevation input; overlays always lift. */
export function shadows(elevation: Elevation): Group {
  return {
    shadow: {
      $type: 'shadow',
      control: {
        $value: [layer('control', 1, 2)],
        $description: 'A hairline under secondary controls. None in dark mode.',
      },
      surface: {
        $value: elevation === 'shadow' ? [layer('contact', 1, 2), layer('ambient', 10, 30)] : none,
        $description: 'Resting surfaces. Follows the elevation input (0060).',
      },
      overlay: {
        $value: [layer('overlay-contact', 1, 2), layer('overlay-ambient', 14, 36)],
        $description: 'Menus, popovers, dialogs, toasts and tooltips, in every theme.',
      },
    },
  };
}
