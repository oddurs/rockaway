# site

The rockaway website, built out of the system it documents (cairn 0077).
Astro, static, with React islands where a page needs to run.

```sh
pnpm site                      # build the packages, then the dev server
pnpm --filter site build       # typecheck, then build into dist/
pnpm --filter site test        # build twice (at /rockaway/ and /) and test in Chromium
```

## It is a consumer

The site imports `@rockaway/*` the way anyone else would: from each package's
`dist`, through its published exports. The workspace's `@rockaway/source`
condition is off for the site's TypeScript, Vite never had it, and a plugin in
`astro.config.ts` fails the build if a package's TypeScript source is reached.
So the packages have to be built first, and a change to one shows up here
after `pnpm build`, not on save. If something only works from source, that is
a packaging bug, and it is fixed in the package.

## Where things go

| Path | What |
| --- | --- |
| `src/pages/` | One file per route. Pages compose; they bring no CSS of their own. |
| `src/layouts/Document.astro` | The one `<html>`: head order, the font, the stylesheet. |
| `src/islands/` | One module per hydrated thing, never a component hydrated straight from the package (see `frame.ts` for why). |
| `src/lib/` | Logic, in TypeScript. Astro frontmatter is not typechecked, so keep it thin. |
| `src/styles/site.css` | The system's CSS as a consumer imports it, and page layout. |
| `src/fonts/` | The one font, its metrics and its licence. |
| `src/content/` | Markdown, when the prose arrives (0143), as Astro content collections. |

Component pages (0147) will read the components' metadata from
`@rockaway/react` (0047); theme, mode and density (0148) are applied by an
inline script at the top of the head, before the stylesheet, so the first
frame is already the reader's choice.

## The base path

GitHub Pages serves the site at `oddurs.github.io/rockaway/`, so that is the
default. `SITE_BASE=/` builds it for a domain root, and `SITE_URL` sets the
origin. Link inside the site with `href()` from `src/lib/paths.ts`.

## The font

JetBrains Mono (OFL 1.1, `src/fonts/OFL.txt`): the one face, subset to 18 kB
of WOFF2 with regular to bold on its weight axis, preloaded. Every fallback is
a system monospace font scaled to the same advance, so `1ch` is the same
before and after the font arrives (`src/lib/font.ts`). Box drawing and blocks
are not in the subset: the cell draws them (0116).

To change the character set or the version, edit `scripts/font.ts`, run
`pnpm --filter site font` after `pnpm build`, and commit what it writes.

## Not yet checked

`astro check` needs TypeScript 5 or 6 and the repository is on 7, so `.astro`
files are not typechecked. `tsc` checks everything else.
