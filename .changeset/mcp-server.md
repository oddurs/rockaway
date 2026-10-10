---
'@rockaway/mcp': minor
---

Add `@rockaway/mcp`, an MCP server on stdio (`rockaway-mcp`) for coding agents. `list_components` lists every component; `get_component` answers one component's metadata as published, with its snapshots as text; `get_tokens` answers the tokens as custom properties, resolved for a theme, mode and density; `search_docs` searches the documentation and the components. It answers from a snapshot of the metadata, the DTCG tokens and `docs/` taken at build, so it installs without React.
