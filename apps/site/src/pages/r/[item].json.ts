/**
 * A registry item (cairn 0046), `/r/<name>.json`, in shadcn's format:
 * `npx shadcn add <site>/r/<name>.json` copies it in.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { registryItem } from '../../lib/registry.ts';
import { entries, json } from '../../lib/registry-site.ts';

export const getStaticPaths = (() =>
  entries.map((entry) => ({
    params: { item: entry.item.name },
    props: entry,
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<(typeof entries)[number]> = ({ props }) =>
  json(registryItem(props.item, props.files));
