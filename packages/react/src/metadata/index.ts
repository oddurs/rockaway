/**
 * `@rockaway/react/metadata` (cairn 0047): every component, as data.
 *
 * Each component's `.meta.ts` says what only a person can; this adds what the
 * code already knows — props and tokens from `extracted.ts`, and each state's
 * row of the vocabulary — and publishes the lot. The same data is written to
 * `meta.json` when the package is built, for anything that reads JSON rather
 * than JavaScript.
 *
 * The component modules carry `'use client'`, and this imports them for their
 * variant helpers and buffer functions. In a React Server Component graph
 * their exports are client references, so read `meta.json` there instead.
 */
import { registry } from './components.ts';
import { extracted, focusRingTokens } from './extracted.ts';
import type {
  AnatomyPart,
  ComponentMeta,
  ComponentMetaInput,
  MetadataDocument,
  PropMeta,
  StateMeta,
  VariantMeta,
} from './schema.ts';
import { type StateRow, stateVocabulary } from './states.ts';

export type {
  Accessibility,
  AnatomyPart,
  ComponentMeta,
  ElementPart,
  ImportedPart,
  KeyBinding,
  MetadataDocument,
  PropMeta,
  Snapshot,
  StateMeta,
  VariantMeta,
} from './schema.ts';
export { type StateName, type StateRow, stateVocabulary } from './states.ts';

/** A variant prop's type is its values, and its default the helper's. */
function withVariant(prop: PropMeta, variants: readonly VariantMeta[]): PropMeta {
  const variant = variants.find((v) => v.name === prop.name);
  if (variant === undefined) return prop;
  return {
    ...prop,
    type: variant.values.map(({ value }) => `'${value}'`).join(' | '),
    default: `'${variant.default}'`,
  };
}

function rowOf(name: string): StateRow {
  const row = stateVocabulary.find((r) => r.name === name);
  if (row === undefined) throw new TypeError(`"${name}" is not a row of the state vocabulary.`);
  return row;
}

function assemble(input: ComponentMetaInput): ComponentMeta {
  const variants = input.variants ?? [];
  const anatomy = input.anatomy.map((part): AnatomyPart => {
    if (part.kind === 'element') return part;
    const found = extracted[part.name];
    if (found === undefined) {
      throw new TypeError(
        `${input.name}: "${part.name}" is not an exported component in src/components. If it is new, run \`pnpm --filter @rockaway/react metadata\`.`,
      );
    }
    return {
      ...part,
      props: found.props.map((prop) => withVariant(prop, variants)),
      inherits: found.inherits,
    };
  });
  const states = input.states.map((s): StateMeta => {
    const row = rowOf(s.state);
    return {
      state: s.state,
      part: s.part,
      selectors: row.selectors,
      drawnAs: row.drawnAs,
      withoutColour: row.withoutColour,
      ...(s.note === undefined ? {} : { note: s.note }),
    };
  });
  const tokens = new Set(
    input.anatomy.flatMap((part) =>
      part.kind === 'import' ? (extracted[part.name]?.tokens ?? []) : [],
    ),
  );
  if (states.some((s) => rowOf(s.state).global)) {
    for (const token of focusRingTokens) tokens.add(token);
  }
  return {
    name: input.name,
    summary: input.summary,
    description: input.description,
    whenToUse: input.whenToUse,
    whenNotToUse: input.whenNotToUse,
    related: input.related,
    anatomy,
    variants,
    states,
    accessibility: input.accessibility,
    tokens: [...tokens].sort(),
    snapshots: input.snapshots,
  };
}

/**
 * Every component in `@rockaway/react`, published, in name order. The
 * registry is generated from the `*.meta.ts` files, in file order.
 */
export const components: readonly ComponentMeta[] = registry
  .map(({ meta }) => assemble(meta))
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/** The whole of `meta.json`. */
export const metadata: MetadataDocument = {
  $schema: './meta.schema.json',
  states: stateVocabulary,
  components,
};
