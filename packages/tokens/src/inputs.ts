/**
 * The theme model (cairn 0058): five inputs define a theme and are fixed at
 * build time; mode and density are contexts, switched at runtime through the
 * DTCG Resolver.
 */

/** The inputs that define a theme. A preset is one of these and nothing else. */
export interface ThemeInputs {
  /** OKLCH hue of the accent, 0–360. */
  readonly accentHue: number;
  /** Which way the neutrals lean. `neutral` tints them faintly toward the accent. */
  readonly neutralTemperature: NeutralTemperature;
  /** Control radius in px. Cards, overlays and tags derive from it. 0 squares everything. */
  readonly radius: number;
  /** The type pairing: display, body and label faces. */
  readonly typePairing: TypePairing;
  /** How resting surfaces separate from the page. Overlays always lift (0060). */
  readonly elevation: Elevation;
}

export type NeutralTemperature = 'cool' | 'neutral' | 'warm';
export type TypePairing = 'inter' | 'editorial' | 'friendly' | 'technical';
export type Elevation = 'border' | 'shadow' | 'tone';

export type Mode = 'light' | 'dark';
export type Density = 'compact' | 'regular' | 'comfortable';

/** Runtime contexts: resolver modifiers, not theme inputs. */
export interface ThemeContexts {
  readonly mode: Mode;
  readonly density: Density;
}

export const modes: readonly Mode[] = ['light', 'dark'];
export const densities: readonly Density[] = ['compact', 'regular', 'comfortable'];

/** The opinionated default. */
export const defaultTheme: ThemeInputs = {
  accentHue: 262,
  neutralTemperature: 'neutral',
  radius: 6,
  typePairing: 'inter',
  elevation: 'border',
};

export const defaultContexts: ThemeContexts = {
  mode: 'light',
  density: 'regular',
};
