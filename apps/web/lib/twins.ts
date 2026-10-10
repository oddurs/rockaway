/**
 * The Markdown twins (cairn 0048): `/concept.md` beside `/concept/`, and
 * `/components/key-hint.md` beside `/components/key-hint/`. Each is a route
 * of its own, written by `scripts/routes.ts`, because a twin's address is a
 * page's with `.md` after it, and Next takes a dynamic segment whole.
 */
import { componentMarkdown, docMarkdown } from './llms.ts';
import { docSources, locate, metadata, text } from './llms-site.ts';

/** A document's twin: the file from `docs/` as written, its relative links sent to GitHub. */
export function docTwin(id: string): Response {
  const doc = docSources().find((d) => d.id === id);
  if (!doc) throw new Error(`docs/${id}.md is not listed in lib/docs.ts`);
  return text(docMarkdown(doc), 'text/markdown');
}

/** A component's twin: everything its metadata says, snapshots included, as text. */
export function componentTwin(name: string): Response {
  const component = metadata.components.find((c) => c.name === name);
  if (!component) throw new Error(`no metadata for ${name}`);
  return text(componentMarkdown(component, locate), 'text/markdown');
}
