---
'@rockaway/tokens': minor
'@rockaway/css': patch
'@rockaway/react': patch
---

Add the `sunset` theme, a beach sunset at Rockaway: subdued, with no neon. Dark mode is dusk: a blue-grey ground, dune-sand text, a faded coral accent, sea-glass success and bay-blue info. Light mode is golden hour: sand paper, harbour-navy ink and a bridge-rust accent. In both modes focus is amber and reverse video is coral, and the sixteen ANSI colours are at the same low chroma. It draws with rounded corners and passes the contrast gate as written, in both modes and in every view.

- **An authored palette:** a preset may now write its palette itself, every slot in each mode in OKLCH, beside its five inputs. It is refused when any slot is missing, unknown or not `oklch(l c h)`. It is also refused if the contrast gate would have to move a colour; the message says what to write instead.
- **`focus` and `inverse` palette slots:** `border.focus` and `bg.inverse` now read slots of their own. That lets a theme focus in a colour other than its accent, and reverse to a colour other than its ink. Every other theme fills them with its accent and its foreground, so every token in every other theme resolves to the same colour as before.
- **Increased contrast reverses to the ink:** under increased contrast, reverse video is the foreground in every theme.
- **Reverse video everywhere reads `bg.inverse`:** this covers selected rows in List and Tree, a pressed Checkbox, and a focused fill. Before, they read `fg.default` directly. List and Tree rows are now gate-checked: the surface colour on `bg.inverse` must reach 4.5:1. The metadata for List, Tree, Checkbox, Table and Button names `bg.inverse` among the tokens each one reads.
