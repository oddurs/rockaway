---
'@rockaway/tokens': minor
'@rockaway/react': patch
---

Make the weights a frame stands out by into theme glyphs. `Glyphs.weight` names the border set for each reason: `emphasis` for a frame in a state that asks for attention (a focused or invalid field), `raised` for a frame above the page (a popover), and `modal` for one above everything (a dialog). They default to `heavy`, `heavy` and `double`, and to `ascii` under an ASCII theme. A theme can set its own with the optional `weights` input, within its repertoire. The CSS gains `--rk-glyph-border-{emphasis,raised,modal}-*` beside `--rk-glyph-border-current-*`, and `weightNames`, `frameWeights` and `weightsFor` are exported. `FieldFrame` now draws its focused and invalid frame in the theme's `emphasis` weight, which is what it drew before in every shipped theme.
