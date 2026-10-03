import { type Density, densities, type Mode, modes } from '@rockaway/tokens';

/**
 * The runtime contexts, and the one place that knows which attribute on the
 * root sets each (cairn 0058, 0052, 0072). The decorator, the matrix and any
 * story that walks a context itself go through here, so renaming an attribute
 * (cairn 0180) is a change to this table and nothing else.
 */
export const contextAttributes = {
  theme: 'data-rk-theme',
  mode: 'data-theme',
  density: 'data-density',
  conformance: 'data-rk-conformance',
} as const;

export type ContextName = keyof typeof contextAttributes;
export type Contexts = { [K in ContextName]?: string | undefined };

export { type Density, densities, type Mode, modes };

/** Set each context given on `root`; one given as `undefined` is removed. */
export function setContexts(root: HTMLElement, contexts: Contexts): void {
  for (const [name, value] of Object.entries(contexts) as [ContextName, string | undefined][]) {
    const attribute = contextAttributes[name];
    if (value === undefined) root.removeAttribute(attribute);
    else root.setAttribute(attribute, value);
  }
}

/** The density an element is drawn at: the nearest context that sets one. */
export function densityOf(el: Element): Density | undefined {
  const attribute = contextAttributes.density;
  return (el.closest(`[${attribute}]`)?.getAttribute(attribute) ?? undefined) as
    | Density
    | undefined;
}

/** What `root` says now, so a walk can put it back the way it found it. */
export function readContexts(root: HTMLElement): Contexts {
  const contexts: Contexts = {};
  for (const name of Object.keys(contextAttributes) as ContextName[]) {
    contexts[name] = root.getAttribute(contextAttributes[name]) ?? undefined;
  }
  return contexts;
}
