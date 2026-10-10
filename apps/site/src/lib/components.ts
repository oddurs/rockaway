/**
 * The component pages (cairn 0147), read from the metadata `@rockaway/react`
 * publishes (0047). The JSON, not the JavaScript entry: it is what the
 * package builds for anything that reads data, and importing it pulls in no
 * component module.
 */

import meta from '@rockaway/react/meta.json' with { type: 'json' };
import type { ComponentMeta, MetadataDocument } from '@rockaway/react/metadata';
import { escapeHtml } from './html.ts';

export const metadata = meta as unknown as MetadataDocument;
export const components: readonly ComponentMeta[] = metadata.components;

/** `KeyHint` is `key-hint`: the page's address. */
export function slugOf(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function componentNamed(name: string): ComponentMeta | undefined {
  return components.find((c) => c.name === name);
}

/**
 * The little Markdown the metadata uses, as HTML: `code` and nothing else.
 * Everything else is text, escaped.
 */
export function inline(text: string): string {
  return escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
}

/** A token's row on the token reference: `--rk-fg-muted` is `#rk-fg-muted`. */
export function tokenAnchor(cssVar: string): string {
  return cssVar.replace(/^--/, '');
}
