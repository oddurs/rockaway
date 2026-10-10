import type { ReactNode } from 'react';
import { Outline } from '../../../../components/Outline.tsx';
import { sectionsOf } from '../../../../lib/component-page.ts';
import { components, slugOf } from '../../../../lib/components.ts';

export const dynamicParams = false;

export function generateStaticParams(): { name: string }[] {
  return components.map((c) => ({ name: slugOf(c.name) }));
}

export default async function ComponentOutline({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<ReactNode> {
  const { name } = await params;
  const meta = components.find((c) => slugOf(c.name) === name);
  return meta ? <Outline sections={sectionsOf(meta)} /> : null;
}
