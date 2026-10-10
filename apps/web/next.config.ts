/**
 * The site as one Next.js app: a static export of an app shell that never
 * reloads. Every option here is set on purpose; anything Next defaults well
 * is left out.
 */
import path from 'node:path';
import type { NextConfig } from 'next';

/** Where the site is served: GitHub Pages' project path by default, `/` for a domain of its own. */
const base =
  process.env.SITE_BASE === '/' ? '' : (process.env.SITE_BASE ?? '/rockaway').replace(/\/$/, '');

const config: NextConfig = {
  // Static files, served by GitHub Pages: no server at request time. Every
  // route is prerendered at build, and navigation between them is the
  // client router's, so a page never reloads.
  output: 'export',
  basePath: base,
  // `/components/tree/` is a directory with an index.html, which is what a
  // static host serves without rewrites.
  trailingSlash: true,
  // There is no image server in a static export, and the site has no raster
  // images to optimise: the screens are text.
  images: { unoptimized: true },
  // Memoisation by the compiler rather than by hand: the shell re-renders on
  // every route change, and only what changed should.
  reactCompiler: true,
  // A link to a route that does not exist fails the type check.
  typedRoutes: true,
  // The repository's TypeScript is 7, which Next's checker does not load;
  // `pnpm build` runs `tsc` on the app first, so the build does not.
  typescript: { ignoreBuildErrors: true },
  // Never ship the server's source maps or the `X-Powered-By` header: neither
  // is used, and the header is not sent by a static host anyway.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    // The workspace root, so the packages it links resolve from their own
    // `dist` like any dependency's.
    root: path.join(import.meta.dirname, '..', '..'),
  },
  experimental: {
    // Import a component from the barrel and get only that component's
    // entry: the packages publish one entry per component.
    optimizePackageImports: ['@rockaway/react', '@rockaway/grid', '@rockaway/tokens'],
  },
};

export default config;
