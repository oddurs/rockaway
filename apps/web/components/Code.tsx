/**
 * A block of code, highlighted at build in the ANSI 16 (0144): a server
 * component, so no highlighter reaches the page.
 */
import type { ReactNode } from 'react';
import { highlight } from '../lib/render.ts';

export async function Code({
  code,
  lang,
}: {
  readonly code: string;
  readonly lang: string;
}): Promise<ReactNode> {
  const html = await highlight(code, lang);
  // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki's output, at build, from the site's own source.
  return <div className="site-code" dangerouslySetInnerHTML={{ __html: html }} />;
}
