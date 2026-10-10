/** The sitemap (cairn 0150): every page, as the map lists them. */
import type { MetadataRoute } from 'next';
import { allPages } from '../lib/pages.ts';
import { absolute } from '../lib/paths.ts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return allPages()
    .filter((page) => !page.path.endsWith('.html'))
    .map((page) => ({ url: absolute(page.path) }));
}
