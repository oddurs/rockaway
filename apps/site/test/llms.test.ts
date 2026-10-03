/**
 * The agent files (cairn 0048), checked against what they are generated from:
 * every component in the metadata has a twin that says everything its
 * metadata says, and `llms.txt` lists every twin in llmstxt.org's shape.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import meta from '@rockaway/react/meta.json' with { type: 'json' };
import type { MetadataDocument } from '@rockaway/react/metadata';
import { describe, expect, test } from 'vitest';
import { docFor } from '../src/lib/docs.ts';
import {
  absoluteLinks,
  componentMarkdown,
  type DocSource,
  docMarkdown,
  llmsFull,
  llmsIndex,
  slugOf,
} from '../src/lib/llms.ts';

const metadata = meta as unknown as MetadataDocument;
const docsDir = path.join(import.meta.dirname, '../../../docs');
const docs: DocSource[] = readdirSync(docsDir)
  .filter((file) => file.endsWith('.md'))
  .sort()
  .map((file) => {
    const id = file.slice(0, -3);
    return { id, ...docFor(id), body: readFileSync(path.join(docsDir, file), 'utf8') };
  });
const locate = (p: string) => `https://example.test/rockaway/${p}`;
const site = { metadata, docs, locate };

const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

/** The cells of a table row, split on the pipes that are not escaped. */
const cells = (row: string): number => row.split(/(?<!\\)\|/).length - 2;

describe.each(metadata.components.map((c) => [c.name, c] as const))('%s', (_, component) => {
  const twin = componentMarkdown(component, locate);

  test('is titled, summarised and imported by its name', () => {
    expect(twin.startsWith(`# ${component.name}\n\n> ${component.summary}\n`)).toBe(true);
    expect(twin).toContain(component.description);
    expect(twin).toMatch(
      new RegExp(`import \\{ [^}]*\\b${component.name}\\b[^}]* \\} from '@rockaway/react';`),
    );
  });

  test('carries every snapshot as text, character for character', () => {
    expect(component.snapshots.length).toBeGreaterThan(0);
    for (const snapshot of component.snapshots) {
      expect(twin).toContain(`### ${snapshot.title}\n`);
      expect(twin).toMatch(new RegExp(`\`{3,}text\\n${literal(snapshot.text)}\\n\`{3,}\\n`));
    }
  });

  test('says what its metadata says', () => {
    for (const text of component.whenToUse) expect(twin).toContain(text);
    for (const { text } of component.whenNotToUse) expect(twin).toContain(text);
    for (const part of component.anatomy) {
      expect(twin).toContain(`### ${part.name}\n`);
      if (part.kind === 'import') {
        for (const prop of part.props) expect(twin).toContain(`| \`${prop.name}\``);
      } else {
        expect(twin).toContain(`\`.${part.className}\``);
      }
    }
    for (const variant of component.variants) {
      for (const { value } of variant.values) expect(twin).toContain(`- \`${value}\`: `);
    }
    for (const state of component.states) expect(twin).toContain(`| \`${state.state}\` |`);
    for (const binding of component.accessibility.keyboard) expect(twin).toContain(binding.action);
    for (const token of component.tokens) expect(twin).toContain(`\`${token}\``);
  });

  test('links the components it names to their twins', () => {
    const named = [
      ...component.related.map((r) => r.name),
      ...component.whenNotToUse.flatMap((w) => (w.instead ? [w.instead] : [])),
    ];
    for (const name of named) {
      expect(twin).toContain(`[${name}](${locate(`components/${slugOf(name)}.md`)})`);
    }
  });

  test('keeps every table row as wide as its header, whatever pipes a type holds', () => {
    const lines = twin.split('\n');
    lines.forEach((line, i) => {
      if (!line.startsWith('| ') || lines[i - 1]?.startsWith('|')) return;
      const width = cells(line);
      for (let j = i + 1; lines[j]?.startsWith('|'); j++) {
        expect(cells(lines[j] ?? ''), lines[j]).toBe(width);
      }
    });
  });
});

describe('llms.txt', () => {
  const index = llmsIndex(site);
  const lines = index.split('\n');

  test('is in llmstxt.org’s shape: a title, a summary, then sections of links', () => {
    expect(lines[0]).toBe('# rockaway');
    expect(lines[2]?.startsWith('> ')).toBe(true);
    expect(lines.filter((l) => l.startsWith('# '))).toHaveLength(1);
    const sections = lines.filter((l) => l.startsWith('## '));
    expect(sections).toEqual(['## Docs', '## Components', '## Optional']);
    // After the first section, every line is a heading, a blank or a link with a note.
    const body = lines.slice(lines.indexOf('## Docs'));
    for (const line of body) {
      if (line === '' || line.startsWith('## ')) continue;
      expect(line).toMatch(/^- \[[^\]]+\]\(https?:\/\/[^)]+\): \S/);
    }
  });

  test('lists every component and every document, at its twin', () => {
    for (const c of metadata.components) {
      expect(index).toContain(
        `- [${c.name}](${locate(`components/${slugOf(c.name)}.md`)}): ${c.summary}`,
      );
    }
    expect(docs.length).toBeGreaterThan(0);
    for (const doc of docs) {
      expect(index).toContain(`- [${doc.title}](${locate(`${doc.id}.md`)}): ${doc.description}\n`);
    }
  });

  test('llms-full.txt holds every twin in full', () => {
    const full = llmsFull(site);
    for (const c of metadata.components) expect(full).toContain(componentMarkdown(c, locate));
    for (const doc of docs) expect(full).toContain(docMarkdown(doc).trimEnd());
  });
});

describe('a document’s twin', () => {
  test('relative links go to the file on GitHub, and nothing else moves', () => {
    expect(
      absoluteLinks('[R](../README.md) [C](concept.md#rules) [A](#here) [W](https://x.test/)'),
    ).toBe(
      '[R](https://github.com/oddurs/rockaway/blob/main/README.md) ' +
        '[C](https://github.com/oddurs/rockaway/blob/main/docs/concept.md#rules) ' +
        '[A](#here) [W](https://x.test/)',
    );
  });
});
