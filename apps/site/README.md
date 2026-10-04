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
| `src/content/foundations/`, `src/pages/foundations/` | The foundations (0106), in MDX: prose, with examples the engine draws at build time (`src/lib/foundations.ts`) and tables read from the tokens (`src/lib/tokens.ts`). |
| `src/components/` | Build-time pieces for MDX: `Painted` (a buffer as the painter's own markup, no JavaScript), `Table` (data set as prose, columns sized in cells), `ThemeCard`. Never a component the system should have. |
| `src/pages/components/`, `src/content/components/` | A page per component (0147), generated from `@rockaway/react/meta.json`. The only hand-written part is each component's live example (`src/islands/examples/<name>.tsx`) and the MDX that hydrates it and shows its source. A component without a page, or a page without a component, fails the build. |
| `src/pages/terminal/` | Every theme's terminal files, served from what `@rockaway/tokens` ships. |
| `src/lib/` | Logic, in TypeScript. Astro frontmatter is not typechecked, so keep it thin. |
| `src/styles/site.css` | The system's CSS as a consumer imports it, and page layout. |
| `src/fonts/` | The one font, its metrics and its licence. |
| `src/content.config.ts` | Content collections. `docs` is the repository's own `docs/`, so a document is written once for GitHub and the site. |
| `src/pages/[doc].astro`, `src/lib/docs.ts` | One page per document in `docs/` (`concept.md` is `/concept/`), with its title and description. A document with no entry fails the build. |
| `src/layouts/Prose.astro` | Every page: its content set by `<article class="rk-prose">`, inside the shell. It renders the page first so the outline can be read from it (`src/lib/outline.ts`). |
| `src/islands/shell.tsx`, `src/lib/nav.ts` | The shell (0104): the site as a TUI. See below. |

Theme, mode and density (0148) are the reader's: `t`, `m` and `d` (or the
status bar's buttons) move through the shipped themes, light, dark or the
system's, and the five densities. The choice is three context attributes on
`<html>`, kept in `localStorage`, and the inline script at the top of the
head (`src/lib/look.ts`) sets them, and writes the chosen theme's stylesheet
into the head, before the first frame, so there is never a frame in the wrong
look. With no script there is no choice: the page follows the system's mode
and pointer.

## The shell

Every page is a screen (0104), built only from `@rockaway/react`:

- **Panes** share their borders: the map of the site (a `NavigationTree`
  whose rows are links), the page, and its outline (another, one row per
  section). The outline goes first when there is no room; under 64 cells the
  map stacks over the page.
- **A status bar** says which part of the site you are in, where on the page
  (the section at the top of the pane), how far down, and that `?` shows the
  keys.
- **The keymap** is the page's one key handler: `j`/`k` and the arrows move a
  line, Space a screen, `g g` and `G` go to the ends, and `g` then a letter
  jumps to a section. `?` shows them, generated from the bindings. Every jump
  is also a row of the map, so every route is an ordinary link.
- **The URL is the state.** The map's current row is the path. The section
  you scroll to is written to the fragment, and a fragment opens there.
- **Copying** (0105): `y` copies the screen you are on as text, and `Y` as
  ANSI for a terminal, with the status bar's two buttons doing the same. The
  screen is the one you last pointed at or moved into, a snapshot or an
  example, or else the whole page, panes and status bar and all. The message
  line says what was copied and how big it is. The reading is the system's,
  `@rockaway/react/copy`; a terminal draws the ANSI the same, which the site
  test proves with a headless terminal.

With no script there is no window to measure, so `site.css` turns the shell
into a document (`@media (scripting: none)`): the map, the page and the
outline in order, and no chrome. With script, the shell is hidden until it has
measured the window, so the first frame is the screen at its real size; if
the script never arrives it shows anyway after three seconds.

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

## Checking .astro files

`tsc` checks the TypeScript. The .astro files are checked by Astro's
language server, the checker `astro check` runs, in `scripts/check-astro.ts`
(cairn 0170). It runs in the site's build, after `tsc`, and on its own as
`pnpm --filter site check:astro` once the packages are built. `astro check`
supports TypeScript 5 and 6 and the repository is on 7, so the language server
has a TypeScript 6 of its own, installed under another name in
`pnpm-workspace.yaml`. Everything else stays on 7.
