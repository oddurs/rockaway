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
| `src/islands/` | Compositions of the system's components that the site hydrates. A single component is hydrated from its own entry, `@rockaway/react/<component>`, never from the package's index: an island keeps every export of the module it comes from, and the index would ship the whole package for one box. |
| `src/lib/` | Logic, in TypeScript. Astro frontmatter is not typechecked, so keep it thin. |
| `src/styles/site.css` | The system's CSS as a consumer imports it, and page layout. |
| `src/fonts/` | The one font, its metrics and its licence. |
| `src/content.config.ts` | Content collections. `docs` is the repository's own `docs/`, so a document is written once for GitHub and the site. |
| `src/pages/[doc].astro`, `src/lib/docs.ts` | One page per document in `docs/` (`concept.md` is `/concept/`), with its title and description. A document with no entry fails the build. |
| `src/layouts/Prose.astro` | A page of Markdown: `<article class="rk-prose">`, and nothing else. |

Component pages (0147) will read the components' metadata from
`@rockaway/react` (0047); theme, mode and density (0148) are applied by an
inline script at the top of the head, before the stylesheet, so the first
frame is already the reader's choice.

## Markdown

Prose is set by `.rk-prose` from `@rockaway/css` (0143); a page brings no CSS.
The pipeline (`src/lib/markdown.ts`) only says what Markdown cannot:

- relative links in a repository document go to the file on GitHub;
- code blocks and tables get a tab stop, because they scroll;
- a table wider than the measure gets column widths in whole cells, so its
  cells wrap instead of the browser squeezing it off the grid;
- box drawing and blocks become cells the cell draws (0116), so a diagram in
  a code block joins up at every density and still copies as text.

Code is highlighted at build time by Shiki (0144), in the ANSI 16: the theme
in `src/lib/highlight.ts` maps TextMate scopes to the `syntax.*` roles, and
the page gets a class per role, `rk-syntax-keyword`, which `@rockaway/css`
colours from the tokens. No colour is written into the page and no
highlighter ships, so a change of theme or mode recolours code in place.

The content layer caches rendered Markdown and cannot tell when the pipeline
has changed, so `build` runs `astro build --force`.

## The quickstart

`docs/getting-started.md` is code a stranger runs, so it is run as a stranger
would: `pnpm build && pnpm --filter site quickstart` packs the four packages,
scaffolds a Vite app and a Next.js app with their own starters, installs the
tarballs, writes in every fence marked `quickstart="vite"` or
`quickstart="next"` (its `file` attribute is the path), builds each for
production, and reads the screen back as text against the fence marked
`quickstart="screen"`. It needs the network, so it is not part of `pnpm
check`; CI runs it (0155).

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
