/**
 * The settings app's model (cairn 0151): what the form holds, as plain data,
 * and the server it saves to, simulated. Pure, so the app's text snapshot is
 * a fixture and its tests need no network.
 */
export type Mode = 'system' | 'light' | 'dark';
export type Density = 'dense' | 'normal' | 'airy' | 'touch';

export interface Settings {
  readonly name: string;
  readonly email: string;
  /** A theme's name, from `@rockaway/tokens`. */
  readonly theme: string;
  readonly mode: Mode;
  readonly density: Density;
  readonly reduceMotion: boolean;
  /** What to be emailed about. */
  readonly notify: readonly string[];
}

/** What the account holds before anything is changed. */
export const SAVED: Settings = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  theme: 'default',
  mode: 'system',
  density: 'normal',
  reduceMotion: false,
  notify: ['mentions', 'security'],
};

/** The account's name, which a reader types back to delete it. */
export const ACCOUNT = 'ada';

export const MODES: readonly Mode[] = ['system', 'light', 'dark'];
export const DENSITIES: readonly Density[] = ['dense', 'normal', 'airy', 'touch'];

export const NOTIFICATIONS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'pushes', label: 'Every push' },
  { id: 'security', label: 'Security alerts' },
];

/** Whether anything differs from what was saved. */
export function changed(a: Settings, b: Settings): boolean {
  return (Object.keys(a) as (keyof Settings)[]).some((key) => {
    const x = a[key];
    const y = b[key];
    return Array.isArray(x) && Array.isArray(y)
      ? x.length !== y.length || x.some((v, i) => v !== y[i])
      : x !== y;
  });
}

/** What the server says is wrong, by field name. Empty when it takes the change. */
export function serverErrors(settings: Settings): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(settings.email)) {
    errors.email = 'Enter an email address, like ada@example.com.';
  }
  if (settings.name.trim().length < 2) errors.name = 'A name needs two letters at least.';
  return errors;
}

/** The server, a moment away: it answers after `ms`, with any errors. */
export function save(settings: Settings, ms = 400): Promise<Record<string, string>> {
  return new Promise((resolve) => setTimeout(() => resolve(serverErrors(settings)), ms));
}
