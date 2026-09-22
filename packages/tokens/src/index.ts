/**
 * The theme model (cairn 0058): five inputs define a theme and are fixed at
 * build time; mode and density are contexts, switched at runtime through the
 * DTCG Resolver. Every token is derived from these by the generator (0062).
 */

/** The inputs that define a theme. A preset is one of these and nothing else. */
export interface ThemeInputs {
  /** OKLCH hue of the accent, 0–360. */
  readonly accentHue: number;
  /** Which way the neutrals lean. `neutral` tints them faintly toward the accent. */
  readonly neutralTemperature: 'cool' | 'neutral' | 'warm';
  /** Control radius in px. Cards, overlays and tags derive from it. 0 squares everything. */
  readonly radius: number;
  /** The type pairing: display, body and label faces. */
  readonly typePairing: 'inter' | 'editorial' | 'friendly' | 'technical';
  /** How resting surfaces separate from the page. Overlays always lift (0060). */
  readonly elevation: 'border' | 'shadow' | 'tone';
}

/** Runtime contexts: resolver modifiers, not theme inputs. */
export interface ThemeContexts {
  readonly mode: 'light' | 'dark';
  readonly density: 'compact' | 'regular' | 'comfortable';
}

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
