# rockaway

An opinionated design system with timeless bones and a totally themable skin.

rockaway is built as three contracts, kept separate on purpose:

| Contract | What it holds | Built on |
| --- | --- | --- |
| **Tokens** | Design decisions as data: reference → semantic → component | [DTCG 2025.10](https://www.designtokens.org/tr/drafts/format/) and its Resolver module |
| **Behaviour** | Accessibility, focus, keyboard and state. No styling | [React Aria Components](https://react-spectrum.adobe.com/react-aria/) |
| **Style** | CSS that reads semantic tokens and `data-*` state, and nothing else | Custom properties and cascade layers |

A theme is five inputs (accent hue, neutral temperature, radius, type pairing
and elevation) and every token is derived from them. Mode and density are
runtime contexts, switched without a rebuild. Components read semantic tokens
only, so a theme is a remapping, never a rewrite.

> [!NOTE]
> rockaway is pre-release. Nothing is published yet; the [roadmap](ROADMAP.md) says what is being built and in what order.

## Packages

| Package | What it is |
| --- | --- |
| [`@rockaway/tokens`](packages/tokens) | DTCG sources, the resolver, and CSS custom properties |
| [`@rockaway/css`](packages/css) | The CSS contract: cascade layers, reset, base and component styles |
| [`@rockaway/react`](packages/react) | React primitives on React Aria Components |

The tokens and CSS are framework-free. Only the behaviour layer is React.

## Principles

- **Semantic tokens only.** A component that needs a raw value has found a missing semantic token.
- **The platform first.** OKLCH, `light-dark()`, relative colour syntax, `@layer` and container queries do the work a styling library used to. The browser floor is [Baseline 2024](https://web.dev/baseline).
- **Your CSS wins.** Everything ships inside `@layer ds.*`, so unlayered consumer styles override it without `!important`.
- **Accessibility is a test, not a review.** Every story runs in a real browser with axe; a violation fails the build.
- **Decisions are written down.** Each architecture choice is a cairn item with its context, options and consequences.

## Development

Requires Node 24 and pnpm 12.

```sh
pnpm install
pnpm storybook     # the workbench, with mode and density in the toolbar
pnpm check         # lint, typecheck, build, stories as tests, roadmap
```

The roadmap and issues live in the repository as Markdown, managed with
[cairn](https://github.com/oddurs/cairn): `cairn next` shows what is ready to
work on. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
