/**
 * A component's Markdown twin (cairn 0048): `/components/key-hint.md`, beside
 * its page at `/components/key-hint/` (0147). Everything its metadata says,
 * snapshots included, as text.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { componentMarkdown, slugOf } from '../../lib/llms.ts';
import { locate, metadata, text } from '../../lib/llms-site.ts';

export const getStaticPaths = (() =>
  metadata.components.map((component) => ({
    params: { component: slugOf(component.name) },
    props: { name: component.name },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ name: string }> = ({ props }) => {
  const component = metadata.components.find((c) => c.name === props.name);
  if (!component) throw new Error(`No metadata for ${props.name}`);
  return text(componentMarkdown(component, locate), 'text/markdown');
};
