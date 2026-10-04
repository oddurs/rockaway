---
id: 48
uid: 87656858-a060-47ec-898c-bd1c37b7521a
title: Expose the metadata through llms.txt and an MCP server
type: feature
status: review
milestone: v0.1
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 47
- 104
- 147
created: 2026-09-22
updated: 2026-10-03
priority: p2
layer: docs
effort: m
---

## Problem

Agents are a large share of the system's users (0047). They should be able to
ask what exists and how it is used without scraping HTML.

## Acceptance criteria

- [x] `llms.txt` and `llms-full.txt` generated from the metadata and the docs at site build
- [x] Every component page has a Markdown twin at `/components/<name>.md`, including its text snapshot
- [x] An MCP server (stdio), published as a package, offering: list components, get a component (metadata and snapshot), get tokens, search the docs
- [x] A CI test drives the MCP server with a client and checks every tool's answer against the metadata

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

llms.txt, llms-full.txt, /components/<slug>.md twins, /<doc>.md twins and /meta.json are Astro endpoints over @rockaway/react/meta.json and the docs collection (src/lib/llms.ts, pure and unit-tested in test/llms.test.ts; site.test.ts follows every link in the built llms.txt under both bases). Twins sit beside 0147's pages at /components/<slug>/ with the same kebab slug; once both land, keep one slugOf (0147 has one in lib/components.ts) and give each page a <link rel=alternate type=text/markdown> to its twin. The base comes from astro:config/server, not import.meta.env.BASE_URL: in a server module a BASE_URL in the environment overrides it, and vitest sets BASE_URL=/, so href() in endpoints built under vitest dropped /rockaway/. Criteria 3-4 (the MCP server package and its CI test) are a package of their own and are proposed as a follow-up item, so this PR is the site half.

## 2026-10-03

Criteria 3-4 on #161 (stacked on #147): packages/mcp, @rockaway/mcp, the stdio server rockaway-mcp with list_components, get_component, get_tokens and search_docs, answering from a snapshot (dist/data.json) of meta.json, the DTCG files and docs/ taken at build, so it installs without React. test/server.test.ts drives the built bin with the MCP SDK's Client and checks every tool against meta.json and the DTCG files read independently. Packable (check-packages: publint, attw) and not published: the owner decides (0045). meta.json is read at runtime, not imported, because CI typechecks before it builds.
