// `@rockaway/react/breadcrumbs`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type BreadcrumbItem,
  type BreadcrumbsTextOptions,
  breadcrumbsBuffer,
  foldPath,
  type Shown,
} from '../components/breadcrumbs.pure.ts';
export { Breadcrumbs, type BreadcrumbsProps } from '../components/breadcrumbs.tsx';
