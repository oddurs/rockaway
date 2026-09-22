/**
 * A small DTCG resolver: apply a resolver input to generated files and follow
 * aliases to their final values. Enough for checks that must judge the real
 * output rather than the functions that produced it.
 */
import type { ResolverDocument } from './dtcg.ts';
import { type GeneratedFiles, resolverFile } from './generate.ts';

type Node = Record<string, unknown>;

function merge(target: Node, source: Node): Node {
  for (const [k, v] of Object.entries(source)) {
    const t = target[k];
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !('$value' in v) &&
      t &&
      typeof t === 'object'
    ) {
      merge(t as Node, v as Node);
    } else {
      target[k] = structuredClone(v);
    }
  }
  return target;
}

/** The merged token tree for one resolver input, e.g. `{ mode: 'dark', density: 'regular' }`. */
export function resolveTree(files: GeneratedFiles, input: Readonly<Record<string, string>>): Node {
  const resolver = files.get(resolverFile) as ResolverDocument;
  const tree: Node = {};
  const load = (refs: readonly { readonly $ref: string }[]) => {
    for (const { $ref } of refs) merge(tree, files.get($ref) as Node);
  };
  for (const { $ref } of resolver.resolutionOrder) {
    const [, kind, name] = $ref.split('/') as [string, 'sets' | 'modifiers', string];
    if (kind === 'sets') load(resolver.sets[name]?.sources ?? []);
    else {
      const modifier = resolver.modifiers[name];
      if (!modifier) continue;
      load(modifier.contexts[input[name] ?? modifier.default] ?? []);
    }
  }
  return tree;
}

/** The final `$value` of a token path, following aliases. */
export function resolveValue(tree: Node, path: string, seen: string[] = []): unknown {
  if (seen.includes(path)) throw new Error(`alias cycle: ${[...seen, path].join(' → ')}`);
  const token = path.split('.').reduce<unknown>((n, k) => (n as Node | undefined)?.[k], tree) as
    | Node
    | undefined;
  if (!token || !('$value' in token)) throw new Error(`no token at ${path}`);
  const v = token.$value;
  return typeof v === 'string' && /^\{[^}]+\}$/.test(v)
    ? resolveValue(tree, v.slice(1, -1), [...seen, path])
    : v;
}
