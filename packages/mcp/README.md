# @rockaway/mcp

An [MCP](https://modelcontextprotocol.io) server that tells a coding agent what
rockaway has and how to use it: its components, its tokens and its
documentation, as the packages publish them.

> [!NOTE]
> Not published yet. Until it is, build it from the repository and point
> your client at `packages/mcp/dist/bin.js`.

```sh
claude mcp add rockaway -- npx -y @rockaway/mcp
```

Any client that starts a server on stdio works the same way: the command is
`rockaway-mcp`, with no arguments.

## Tools

| Tool | What it answers |
| --- | --- |
| `list_components` | Every component: its name, what it is in one line, and what to import. |
| `get_component` | One component's metadata as published: what it is for, when not to use it and what to use instead, its parts and props, variants, states, keyboard, tokens, and its snapshots drawn as text. By name (`KeyHint`) or slug (`key-hint`). |
| `get_tokens` | The tokens a stylesheet reads, as custom properties (`--rk-fg-muted`), with each one's path, type, description, value as written and value resolved, for a `theme`, `mode` and `density`. `group` narrows it: `fg`, `bg.accent`, `space`. |
| `search_docs` | The documentation and the components, searched by words, best sections first. |

Every answer is read-only and comes from a snapshot the build takes of the
component metadata (`@rockaway/react/meta.json`), the DTCG tokens
(`@rockaway/tokens/dtcg/*`) and the repository's `docs/`. It is shipped inside
the package as `dist/data.json`, so the server installs without React and
describes exactly the release it came with.

## In code

```ts
import { createServer } from '@rockaway/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

await createServer().connect(new StdioServerTransport());
```

## Development

```sh
pnpm --filter @rockaway/mcp build   # tsdown, then the snapshot (scripts/data.ts)
pnpm --filter @rockaway/mcp test    # drives the built server with an MCP client
```

`test/server.test.ts` starts `dist/bin.js` on stdio with the MCP SDK's own
client and checks every tool's answer against `@rockaway/react/meta.json` and
the DTCG files, read independently of the server's snapshot. Build the
workspace first: the snapshot is read from the other packages' `dist`.
