import type { ReactNode } from 'react';
import { Outline } from '../../../components/Outline.tsx';
import { DOC_IDS, renderDoc } from '../../../lib/docs-pages.ts';
import { outlineItems } from '../../../lib/shell.ts';

export const dynamicParams = false;

export function generateStaticParams(): { doc: string }[] {
  return DOC_IDS.map((doc) => ({ doc }));
}

export default async function DocOutline({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<ReactNode> {
  const page = await renderDoc((await params).doc);
  return <Outline sections={outlineItems(page.headings)} />;
}
