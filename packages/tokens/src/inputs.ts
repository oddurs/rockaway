/**
 * The theme model (cairn 0058, 0075). The inputs that define a theme are
 * fixed at build time; mode and density are contexts, switched at runtime
 * through the DTCG Resolver.
 *
 * Radius and elevation left with 0092: corners are glyphs on a character
 * grid, and a shadow cannot be drawn in a cell. The border set and the
 * padding step arrive with the glyph tokens (0091).
 */

/** The inputs that define a theme. A preset is one of these and nothing else. */
export interface ThemeInputs {
  /** OKLCH hue of the accent, 0–360. */
  readonly accentHue: number;
  /** Which way the neutrals lean. `neutral` tints them faintly toward the accent. */
  readonly neutralTemperature: NeutralTemperature;
  /** The type pairing: which monospace family, and how heavy its weights are. */
  readonly typePairing: TypePairing;
  /** How strictly this theme holds the grid (0072). */
  readonly conformance: Conformance;
}

/** Strictness is a dial, not a law (cairn 0072). */
export type Conformance = 'strict' | 'standard' | 'loose';
export const conformanceLevels: readonly Conformance[] = ['strict', 'standard', 'loose'];

export type NeutralTemperature = 'cool' | 'neutral' | 'warm';
export type TypePairing = 'inter' | 'editorial' | 'friendly' | 'technical';

export type Mode = 'light' | 'dark';
export type Density = 'dense' | 'normal' | 'airy' | 'touch';

/** Runtime contexts: resolver modifiers, not theme inputs. */
export interface ThemeContexts {
  readonly mode: Mode;
  readonly density: Density;
}

export const modes: readonly Mode[] = ['light', 'dark'];
export const densities: readonly Density[] = ['dense', 'normal', 'airy', 'touch'];

/** The opinionated default. */
export const defaultTheme: ThemeInputs = {
  accentHue: 262,
  neutralTemperature: 'neutral',
  typePairing: 'inter',
  conformance: 'standard',
};

export const defaultContexts: ThemeContexts = {
  mode: 'light',
  density: 'normal',
};
