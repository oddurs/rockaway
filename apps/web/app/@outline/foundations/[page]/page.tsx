import type { ReactNode } from 'react';
import { Outline } from '../../../../components/Outline.tsx';
import { FOUNDATION_PAGES, renderFoundation } from '../../../../lib/foundations-pages.ts';
import { outlineItems } from '../../../../lib/shell.ts';

export const dynamicParams = false;

export function generateStaticParams(): { page: string }[] {
  return FOUNDATION_PAGES.map((p) => ({ page: p.id }));
}

/** A foundations page's sections. */
export default async function FoundationOutline({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<ReactNode> {
  const page = await renderFoundation((await params).page);
  return <Outline sections={outlineItems(page.headings)} />;
}
