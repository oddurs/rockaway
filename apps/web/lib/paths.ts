/**
 * Where a page is, as the router names it. Next adds the base path (`/rockaway`
 * on GitHub Pages) to every link and route itself, so a path here is the
 * route alone: `href('components/frame/')` is `/components/frame/`.
 */
export function href(path: string): string {
  return `/${path.replace(/^\/+/, '')}`;
}

/** The base path the site is served under, as `next.config.ts` sets it: `` or `/rockaway`. */
export const BASE: string =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.SITE_BASE === '/' ? '' : (process.env.SITE_BASE ?? '/rockaway').replace(/\/$/, ''));

/** A URL for a file in `public/`, which Next does not prefix the way it does routes. */
export function asset(path: string): string {
  return `${BASE}/${path.replace(/^\/+/, '')}`;
}
