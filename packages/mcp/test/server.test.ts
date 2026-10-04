/**
 * The MCP server driven by a real client (cairn 0048): the built `rockaway-mcp`
 * started on stdio, as an MCP client starts it, and every tool's answer
 * checked against what the packages publish. The metadata is read from
 * `@rockaway/react/meta.json`, and the tokens from the DTCG files
 * `@rockaway/tokens` ships, independently of the server's own snapshot.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import type { MetadataDocument } from '@rockaway/react/metadata';
import { vars } from '@rockaway/tokens';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const { components } = meta as unknown as MetadataDocument;
const bin = fileURLToPath(new URL('../dist/bin.js', import.meta.url));
const dtcg = new URL('dtcg/', import.meta.resolve('@rockaway/tokens/package.json'));
const tokenFile = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(name, dtcg), 'utf8'));

/** A DTCG node by its path. */
const at = (tree: Record<string, unknown>, path: string): Record<string, unknown> =>
  path
    .split('.')
    .reduce<Record<string, unknown>>((node, key) => node[key] as Record<string, unknown>, tree);

type Content = { type: string; text?: string }[];

let client: Client;

beforeAll(async () => {
  if (!existsSync(bin)) throw new Error(`${bin} is not built: run pnpm build first`);
  client = new Client({ name: 'rockaway-test', version: '0.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [bin] }));
});

afterAll(async () => {
  await client?.close();
});

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  return { content: result.content as Content, isError: result.isError === true };
}

const firstJson = async (name: string, args?: Record<string, unknown>) => {
  const { content, isError } = await call(name, args);
  expect(isError).toBe(false);
  return JSON.parse(content[0]?.text ?? 'null');
};

test('introduces itself, and offers exactly the four tools, read-only', async () => {
  expect(client.getServerVersion()?.name).toBe('rockaway');
  expect(client.getInstructions()).toMatch(/list_components/);
  const { tools } = await client.listTools();
  expect(tools.map((t) => t.name)).toEqual([
    'list_components',
    'get_component',
    'get_tokens',
    'search_docs',
  ]);
  for (const tool of tools) {
    expect(tool.description?.length).toBeGreaterThan(40);
    expect(tool.annotations?.readOnlyHint).toBe(true);
  }
});

test('list_components lists every component in the metadata, in its order', async () => {
  const listed = await firstJson('list_components');
  expect(listed).toEqual(
    components.map((c) => ({
      name: c.name,
      summary: c.summary,
      imports: c.anatomy.filter((p) => p.kind === 'import').map((p) => p.name),
    })),
  );
});

describe.each(components.map((c) => [c.name, c] as const))(
  'get_component %s',
  (name, component) => {
    test('answers with its metadata as published, and each snapshot as text', async () => {
      const { content, isError } = await call('get_component', { name });
      expect(isError).toBe(false);
      expect(JSON.parse(content[0]?.text ?? 'null')).toEqual(component);
      expect(content).toHaveLength(1 + component.snapshots.length);
      component.snapshots.forEach((snapshot, i) => {
        const block = content[i + 1]?.text ?? '';
        expect(block.startsWith(`${name}: ${snapshot.title}\n`)).toBe(true);
        expect(block.endsWith(`\n\n${snapshot.text}`)).toBe(true);
      });
    });

    test('finds it by its slug, in any case', async () => {
      const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      expect((await firstJson('get_component', { name: slug })).name).toBe(name);
      expect((await firstJson('get_component', { name: name.toUpperCase() })).name).toBe(name);
    });
  },
);

test('get_component says which components there are when asked for one that is not', async () => {
  const { content, isError } = await call('get_component', { name: 'Carousel' });
  expect(isError).toBe(true);
  for (const c of components) expect(content[0]?.text).toContain(c.name);
});

describe('get_tokens', () => {
  test('answers every token with a custom property, in the default context', async () => {
    const { context, tokens } = await firstJson('get_tokens');
    expect(context).toEqual({ theme: 'default', mode: 'light', density: 'normal' });
    expect(tokens.map((t: { path: string }) => t.path).sort()).toEqual(Object.keys(vars).sort());
    for (const token of tokens) {
      expect(`var(${token.name})`).toBe(vars[token.path as keyof typeof vars]);
    }
  });

  test('follows the aliases to the theme’s palette for the mode asked for', async () => {
    const theme = tokenFile('theme.dracula.tokens.json');
    for (const mode of ['light', 'dark'] as const) {
      const { tokens } = await firstJson('get_tokens', { group: 'fg', theme: 'dracula', mode });
      const fg = tokens.find((t: { path: string }) => t.path === 'fg.default');
      // fg.default is ansi.foreground, which the mode points at the palette.
      expect(fg.value).toBe('{ansi.foreground}');
      expect(fg.resolved).toEqual(at(theme, `palette.${mode}.foreground`).$value);
      expect(fg.css).toMatch(/^#[0-9a-f]{6}$/);
      expect(fg.type).toBe('color');
      expect(fg.description).toMatch(/Body text/);
      expect(tokens.every((t: { path: string }) => t.path.startsWith('fg.'))).toBe(true);
    }
  });

  test('takes the density’s cell', async () => {
    for (const density of ['dense', 'normal', 'airy', 'touch']) {
      const { tokens } = await firstJson('get_tokens', { group: 'cell', density });
      const line = tokens.find((t: { path: string }) => t.path === 'cell.line');
      expect(line.resolved).toBe(
        at(tokenFile(`density.${density}.tokens.json`), 'cell.line').$value,
      );
    }
  });

  test('refuses a theme that does not exist', async () => {
    const result = await client.callTool({ name: 'get_tokens', arguments: { theme: 'vaporwave' } });
    expect(result.isError).toBe(true);
  });
});

describe('search_docs', () => {
  test('finds a document’s section by the words in its heading', async () => {
    const concept = readFileSync(new URL('../../../docs/concept.md', import.meta.url), 'utf8');
    const heading = /^## (.+)$/m.exec(concept)?.[1] ?? '';
    const { content } = await call('search_docs', { query: heading, limit: 3 });
    expect(content[0]?.text).toMatch(/^docs\/concept\.md — /);
    expect(content[0]?.text).toContain(`## ${heading}`);
    expect(content.length).toBeLessThanOrEqual(3);
  });

  test('finds a component by what it is for', async () => {
    const { content } = await call('search_docs', { query: 'shortcut chord' });
    expect(content.some((c) => c.text?.startsWith('components/key-hint — KeyHint'))).toBe(true);
  });

  test('says so when nothing matches', async () => {
    const { content, isError } = await call('search_docs', { query: 'zzqx' });
    expect(isError).toBe(false);
    expect(content).toEqual([{ type: 'text', text: 'Nothing matches “zzqx”.' }]);
  });
});
