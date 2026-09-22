# @rockaway/tokens

Design decisions as data. Five theme inputs produce every token (cairn 0058);
mode and density are runtime contexts, resolved through the DTCG Resolver.

## The theme

[`themes/default.json`](themes/default.json) holds the five inputs and nothing else:

| Input | Values |
| --- | --- |
| `accentHue` | OKLCH hue, 0–360 |
| `neutralTemperature` | `cool`, `neutral`, `warm` |
| `radius` | whole px, 0–24 |
| `typePairing` | `inter`, `editorial`, `friendly`, `technical` |
| `elevation` | `border`, `shadow`, `tone` |

## Generated DTCG

```sh
pnpm --filter @rockaway/tokens generate        # themes/default.json → dtcg/
pnpm --filter @rockaway/tokens generate:check  # fails if dtcg/ is stale
```

[`dtcg/`](dtcg) is committed so changes to the rules show up in review. Do not
edit it by hand. The tests fail if it is stale, and Terrazzo validates it.

| File | Holds |
| --- | --- |
| `rockaway.resolver.json` | How the files combine; `mode` and `density` modifiers |
| `base.tokens.json` | Font primitives |
| `palette.{light,dark}.tokens.json` | Palettes, one per `mode` context |
| `density.{compact,regular,comfortable}.tokens.json` | Space and control sizes, one per `density` context |
