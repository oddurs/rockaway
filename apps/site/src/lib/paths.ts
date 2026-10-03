/**
 * Where the site lives (cairn 0103). On GitHub Pages it is a project site, at
 * `oddurs.github.io/rockaway/`; on a domain of its own it would be at `/`.
 * Every internal link goes through `href`, so moving it is one setting.
 */

/** Where the site is served unless `SITE_BASE` says otherwise. */
export const DEFAULT_BASE = '/rockaway/';

/** A base path with one slash at each end: `rockaway` → `/rockaway/`, `` → `/`. */
export function normaliseBase(value: string | undefined): string {
  const trimmed = (value ?? DEFAULT_BASE).replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? '/' : `/${trimmed}/`;
}

/** A path within the site, under its base: `href('components/frame/')`. */
export function href(path: string, base: string = import.meta.env.BASE_URL): string {
  return `${normaliseBase(base)}${path.replace(/^\/+/, '')}`;
}
