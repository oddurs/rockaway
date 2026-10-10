/**
 * Markdown and code, turned into HTML at build (0143, 0144): highlighted in
 * the ANSI 16 through the `syntax.*` roles, as classes, so nothing that
 * highlights is shipped and the colours follow the theme. Server only.
 */
import type { Element, Root } from 'hast';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { createHighlighter, type Highlighter } from 'shiki';
import { unified } from 'unified';
import { ansiTheme, roleClasses } from './highlight.ts';
import {
  rehypeCallouts,
  rehypeCellGlyphs,
  rehypeRepositoryLinks,
  rehypeScrollable,
  rehypeTableColumns,
} from './markdown.ts';
import { BASE } from './paths.ts';

const LANGS = ['tsx', 'ts', 'js', 'jsx', 'sh', 'bash', 'css', 'json', 'html', 'md'] as const;

let highlighter: Promise<Highlighter> | undefined;
function shiki(): Promise<Highlighter> {
  highlighter ??= createHighlighter({ themes: [ansiTheme], langs: [...LANGS] });
  return highlighter;
}

const known = (lang: string): string =>
  (LANGS as readonly string[]).includes(lang) ? lang : 'text';

/** A block of code as highlighted HTML: a `pre` of role classes. */
export async function highlight(code: string, lang: string): Promise<string> {
  const h = await shiki();
  return h.codeToHtml(code.replace(/\n$/, ''), {
    lang: known(lang),
    theme: ansiTheme.name ?? 'ansi',
    transformers: [roleClasses],
  });
}

/** Every fenced block, highlighted where the Markdown is parsed. */
function rehypeHighlight() {
  return async (tree: Root): Promise<void> => {
    const h = await shiki();
    const visit = (node: Root | Element): void => {
      node.children.forEach((child, i) => {
        if (child.type !== 'element') return;
        const code = child.children[0];
        if (child.tagName === 'pre' && code?.type === 'element' && code.tagName === 'code') {
          const classes = (code.properties.className as string[] | undefined) ?? [];
          const lang = classes.find((c) => c.startsWith('language-'))?.slice(9) ?? 'text';
          const text = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
          const out = h.codeToHast(text.replace(/\n$/, ''), {
            lang: known(lang),
            theme: ansiTheme.name ?? 'ansi',
            transformers: [roleClasses],
          });
          const pre = out.children[0];
          if (pre) node.children[i] = pre as Element;
          return;
        }
        visit(child);
      });
    };
    visit(tree);
  };
}

/** A document's Markdown as the site's HTML. */
export async function markdown(source: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight)
    .use(rehypeRepositoryLinks, { base: `${BASE}/` })
    .use(rehypeScrollable)
    // Columns are sized from the text before its box characters become cells.
    .use(rehypeTableColumns)
    .use(rehypeCellGlyphs)
    // After the cell has taken its glyphs out of the text, so a callout's own
    // edges are not taken out a second time.
    .use(rehypeCallouts)
    .use(rehypeStringify)
    .process(source);
  return String(file);
}
