/**
 * A foundations page (cairn 0106): Markdown set as prose, with its examples
 * drawn by the engine at build. Each ends with the next, so the pages can be
 * read through like a chapter.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBody } from '../../../components/shell/PageBody.tsx';
import { FOUNDATION_PAGES, foundation, renderFoundation } from '../../../lib/foundations-pages.ts';
import { BASE } from '../../../lib/paths.ts';
import { THEME_URLS } from '../../../lib/site.ts';

export const dynamicParams = false;

export function generateStaticParams(): { page: string }[] {
  return FOUNDATION_PAGES.map((p) => ({ page: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { title, description } = foundation((await params).page);
  return { title, description };
}

export default async function FoundationPage({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<ReactNode> {
  const id = (await params).page;
  const page = foundation(id);
  const { html } = await renderFoundation(id);
  const next = FOUNDATION_PAGES[FOUNDATION_PAGES.indexOf(page) + 1];
  return (
    <PageBody title={page.title}>
      {/* The themes page shows every theme at once, so it needs every
          theme's stylesheet: React puts them in the head, and the page is
          not shown until they are in. */}
      {id === 'themes'
        ? Object.entries(THEME_URLS).map(([theme, href]) => (
            <link key={theme} rel="stylesheet" href={href} precedence="themes" />
          ))
        : null}
      <article className="rk-prose">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the site's own Markdown and the engine's drawings, rendered at build. */}
        <div className="site-html" dangerouslySetInnerHTML={{ __html: html }} />
        <hr />
        <p>
          {next ? (
            <>
              Next: <a href={`${BASE}/foundations/${next.id}/`}>{next.title}</a>, or back to{' '}
              <a href={`${BASE}/foundations/`}>the foundations</a>.
            </>
          ) : (
            <>
              Back to <a href={`${BASE}/foundations/`}>the foundations</a>.
            </>
          )}
        </p>
      </article>
    </PageBody>
  );
}
