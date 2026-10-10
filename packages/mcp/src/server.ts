/**
 * The MCP server (cairn 0048): four tools over the snapshot in `data.ts`.
 *
 *   list_components   every component, one line each
 *   get_component     one component's metadata, and its snapshots as text
 *   get_tokens        the tokens, resolved for a theme, mode and density
 *   search_docs       the documentation and the components, by words
 *
 * Every answer is the metadata as published, never a paraphrase of it, so an
 * agent reads what the site and the types say.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type Data, loadData } from './data.ts';
import {
  type Context,
  findComponent,
  getTokens,
  listComponents,
  modifiers,
  searchDocs,
} from './tools.ts';

/** The tools, by name, in the order they are listed. */
export const toolNames: readonly string[] = [
  'list_components',
  'get_component',
  'get_tokens',
  'search_docs',
];

type Text = { type: 'text'; text: string };
const text = (value: string): Text => ({ type: 'text', text: value });
const json = (value: unknown): Text => text(JSON.stringify(value, null, 2));
const failure = (message: string) => ({ content: [text(message)], isError: true });

export interface ServerOptions {
  /** The snapshot to answer from; the one built beside the server by default. */
  readonly data?: Data;
}

/** A server with every tool registered, ready to connect to a transport. */
export function createServer({ data = loadData() }: ServerOptions = {}): McpServer {
  const server = new McpServer(
    { name: 'rockaway', version: data.version },
    {
      instructions:
        'rockaway is a TUI design system for the web: React components on a monospace ' +
        'character grid. Use list_components to see what exists, get_component before ' +
        'using one (its whenNotToUse says what to use instead), get_tokens for the CSS ' +
        'custom properties a stylesheet may read, and search_docs for how the system works. ' +
        'Size things in whole cells (ch) and rows (lh), and take colour from tokens only.',
    },
  );

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description:
        'Every component in @rockaway/react: its name, what it is in one line, and what to import.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    () => ({ content: [json(listComponents(data))] }),
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get a component',
      description:
        'One component’s metadata as published: what it is for, when not to use it and what ' +
        'to use instead, its parts and props, variants, states, keyboard, tokens, and ' +
        'snapshots of it drawn as text. The first block is the metadata as JSON; each ' +
        'snapshot follows as text.',
      inputSchema: {
        name: z.string().describe('The component: `KeyHint`, or its slug, `key-hint`.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ name }) => {
      const component = findComponent(data, name);
      if (!component) {
        const names = data.components.map((c) => c.name).join(', ');
        return failure(`No component named ${name}. There are: ${names}.`);
      }
      return {
        content: [
          json(component),
          ...component.snapshots.map((s) =>
            text(
              [`${component.name}: ${s.title}`, ...(s.description ? [s.description] : [])]
                .concat(['', s.text])
                .join('\n'),
            ),
          ),
        ],
      };
    },
  );

  const known = modifiers(data);
  const contextShape = Object.fromEntries(
    Object.entries(known).map(([name, { values, default: fallback }]) => [
      name,
      z
        .enum(values as [string, ...string[]])
        .optional()
        .describe(`The ${name}; ${fallback} if not given.`),
    ]),
  );
  server.registerTool(
    'get_tokens',
    {
      title: 'Get tokens',
      description:
        'The design tokens a stylesheet reads, as CSS custom properties (`--rk-fg-muted`), ' +
        'with their DTCG path, type, description, the value as written, and the value it ' +
        `comes to for a ${Object.keys(known).join(', ')}. Components read the semantic ` +
        'groups (fg, bg, border, …), never palette slots.',
      inputSchema: {
        group: z
          .string()
          .optional()
          .describe('Only tokens under this DTCG path: `fg`, `bg.accent`, `space`.'),
        ...contextShape,
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    (args) => {
      const { group, ...rest } = args as { group?: string } & Record<string, string | undefined>;
      const context: Context = Object.fromEntries(
        Object.entries(rest).filter((entry): entry is [string, string] => entry[1] !== undefined),
      );
      return { content: [json(getTokens(data, { group, context }))] };
    },
  );

  server.registerTool(
    'search_docs',
    {
      title: 'Search the documentation',
      description:
        'Search rockaway’s documentation and components by words. Returns the best ' +
        'sections whole, each with where it is from.',
      inputSchema: {
        query: z.string().min(1).describe('Words to look for: `forced colors`, `density`.'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('At most this many; 5 if not given.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    ({ query, limit }) => {
      const hits = searchDocs(data, query, limit ?? 5);
      if (hits.length === 0) return { content: [text(`Nothing matches “${query}”.`)] };
      return {
        content: hits.map((hit) => text(`${hit.source} — ${hit.title}\n\n${hit.text}`)),
      };
    },
  );

  return server;
}
