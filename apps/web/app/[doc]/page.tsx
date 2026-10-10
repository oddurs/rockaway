/** Every document in the repository's `docs/`, as a page of prose (cairn 0107). */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageBody } from '../../components/shell/PageBody.tsx';
import { docFor } from '../../lib/docs.ts';
import { DOC_IDS, renderDoc } from '../../lib/docs-pages.ts';
import { pageMetadata } from '../../lib/pages.ts';

export const dynamicParams = false;

export function generateStaticParams(): { doc: string }[] {
  return DOC_IDS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  return pageMetadata(`${(await params).doc}/`);
}

export default async function Doc({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<ReactNode> {
  const id = (await params).doc;
  const page = await renderDoc(id);
  return (
    <PageBody title={docFor(id).title}>
      {/* For reading at length (0322): a free zone, so the page is loose (0311). */}
      <article
        className="rk-prose"
        data-rk-reading=""
        data-rk-conformance="loose"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: the repository's own Markdown, rendered at build.
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
    </PageBody>
  );
}
