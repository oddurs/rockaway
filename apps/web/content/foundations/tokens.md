# Tokens

The tokens are [DTCG](https://www.designtokens.org/) files, generated from each
theme's inputs and shipped in `@rockaway/tokens`: `dtcg/` holds the sources and
a resolver that says how they combine; `tokens.css` is what a browser reads.
This reference is read from those files when the site is built, so it lists
exactly what ships: {{count}} tokens, in the default theme, light mode and the
`normal` density.

Every token is a custom property, its path with dashes: `fg.muted` is
`--rk-fg-muted`. An arrow is an alias: the token takes its value from the one it
points at, so a theme or a mode changes the target and everything pointing at it
follows.

<!-- part: tokens -->
