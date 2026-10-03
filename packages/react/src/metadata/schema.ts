/**
 * Component metadata (cairn 0047): what a component is, as data.
 *
 * Coding agents read the system as much as people do, and documentation that
 * exists only as prose serves one of them. So each component describes itself
 * once, beside its source (`components/<name>.meta.ts`), and the site (0147)
 * and the agent surfaces (0048) both read the result.
 *
 * Nothing in here restates what the code already knows:
 *
 *   - variants come from the component's variant helper (0032)
 *   - states are rows of the state vocabulary (0118), by name
 *   - props are read from the component's TypeScript source, and tokens from
 *     the stylesheets it uses, by `scripts/metadata.ts`
 *   - snapshots are drawn by the component's own buffer functions
 *
 * What is left is what only a person can say: what it is for, when not to use
 * it, what it is made of, and how it sounds. Every value is plain data, so the
 * whole of it serialises to `meta.json` and validates against
 * `meta.schema.json`, which a test keeps in step with these types.
 */
import type { VariantDefinition, Variants } from '../variants.ts';
import type { StateName, StateRow } from './states.ts';

/** A prop, as the component's TypeScript source declares it. */
export interface PropMeta {
  readonly name: string;
  /** The type as written in the source. A variant's lists its values. */
  readonly type: string;
  readonly required: boolean;
  /** The default as written where the component destructures its props. */
  readonly default?: string;
  /** The prop's doc comment. */
  readonly description?: string;
}

/**
 * What `scripts/metadata.ts` reads for each exported component, and writes to
 * `extracted.ts`.
 */
export interface ExtractedPart {
  /** The source file, in `src/components`. */
  readonly file: string;
  readonly props: readonly PropMeta[];
  readonly inherits: readonly string[];
  readonly tokens: readonly string[];
}

/** A part the reader imports: `List`, `ListItem`. */
export interface ImportedPart {
  readonly kind: 'import';
  /** The export's name in `@rockaway/react`. */
  readonly name: string;
  readonly description: string;
  /** The ARIA role it renders, explicit or implicit. Absent when it has none. */
  readonly role?: string;
  /** Its own props, read from its source. */
  readonly props: readonly PropMeta[];
  /** Props it passes through, as the source spells the type it extends. */
  readonly inherits: readonly string[];
}

/** A part drawn inside a component: the delimiters, the label, the cursor. */
export interface ElementPart {
  readonly kind: 'element';
  readonly name: string;
  readonly description: string;
  /** The class it carries, which is how the CSS reaches it. */
  readonly className: string;
  /** Chrome is `aria-hidden`: it is drawn, and never heard. */
  readonly chrome: boolean;
}

export type AnatomyPart = ImportedPart | ElementPart;

/** One variant, from the helper: the values, the default and the attribute. */
export interface VariantMeta {
  readonly name: string;
  /** The attribute the CSS selects on: `data-variant`. */
  readonly attribute: string;
  readonly description: string;
  readonly default: string;
  readonly values: readonly { readonly value: string; readonly description: string }[];
}

/** A state the component draws: a row of the vocabulary, and where it applies. */
export interface StateMeta {
  readonly state: StateName;
  /** The part that carries the attribute. */
  readonly part: string;
  /** From the vocabulary: what the CSS selects on. */
  readonly selectors: readonly string[];
  /** From the vocabulary: how it is drawn. */
  readonly drawnAs: string;
  /** From the vocabulary: what carries it without colour. */
  readonly withoutColour: string;
  /** Where this component departs from the row, or adds to it. */
  readonly note?: string;
}

/** A key, or keys that do the same thing, and what they do. */
export interface KeyBinding {
  /** In KeyHint's notation (`mod+s`, `shift+tab`, `pagedown`), so the site can draw them. */
  readonly keys: readonly string[];
  readonly action: string;
}

export interface Accessibility {
  /** Where the accessible name comes from. */
  readonly name: string;
  readonly keyboard: readonly KeyBinding[];
  /** Typing a printable character moves to the next match. */
  readonly typeAhead: boolean;
  /** What a screen reader says, roughly, for the common case. */
  readonly announces: string;
  readonly notes: readonly string[];
}

/** The component as text: the documentation as much as the test. */
export interface Snapshot {
  readonly title: string;
  readonly description?: string;
  /** Drawn by the component's own buffer functions, one line per row. */
  readonly text: string;
}

/** A component, published. */
export interface ComponentMeta {
  /** The root part's export name. */
  readonly name: string;
  /** One line: what it is. */
  readonly summary: string;
  /** A paragraph: what it is for, and how it does it on the grid. */
  readonly description: string;
  readonly whenToUse: readonly string[];
  readonly whenNotToUse: readonly {
    readonly text: string;
    /** A component to reach for instead. */
    readonly instead?: string;
  }[];
  readonly related: readonly { readonly name: string; readonly why: string }[];
  /** The parts, imported ones first, the root among them. */
  readonly anatomy: readonly AnatomyPart[];
  readonly variants: readonly VariantMeta[];
  readonly states: readonly StateMeta[];
  readonly accessibility: Accessibility;
  /** The tokens its stylesheets and painters read, as custom properties. */
  readonly tokens: readonly string[];
  readonly snapshots: readonly Snapshot[];
  /**
   * What is wrong and not yet fixed, outside the component's control: a
   * dependency's quirk a consumer may meet, and what to do about it.
   */
  readonly knownIssues?: readonly string[];
}

/** The whole of `meta.json`. */
export interface MetadataDocument {
  readonly $schema: string;
  /** The state vocabulary (0118), which every component's states are rows of. */
  readonly states: readonly StateRow[];
  readonly components: readonly ComponentMeta[];
}

/**
 * What a component's `.meta.ts` writes: everything that only a person can
 * say. The generated parts — props, tokens, and the vocabulary's columns for
 * each state — are added when the metadata is assembled.
 */
export interface ComponentMetaInput<Part extends string = string> {
  readonly name: Part;
  readonly summary: string;
  readonly description: string;
  readonly whenToUse: readonly string[];
  readonly whenNotToUse: ComponentMeta['whenNotToUse'];
  readonly related: ComponentMeta['related'];
  readonly anatomy: readonly (
    | (Omit<ImportedPart, 'props' | 'inherits' | 'name'> & { readonly name: Part })
    | (Omit<ElementPart, 'name'> & { readonly name: Part })
  )[];
  readonly variants?: readonly VariantMeta[];
  readonly states: readonly {
    readonly state: StateName;
    readonly part: NoInfer<Part>;
    readonly note?: string;
  }[];
  readonly accessibility: Accessibility;
  readonly snapshots: readonly Snapshot[];
  readonly knownIssues?: ComponentMeta['knownIssues'];
}

/**
 * Declares a component's metadata. The part names are inferred from the
 * anatomy, so a state on a part the anatomy does not list is a type error.
 */
export function defineMeta<const Part extends string>(
  meta: ComponentMetaInput<Part>,
): ComponentMetaInput<Part> {
  return meta;
}

/** What a variant and each of its values are for, keyed so none is missed. */
export type VariantDescriptions<D extends VariantDefinition> = {
  readonly [K in keyof D]: {
    readonly description: string;
    readonly values: { readonly [V in D[K][number]]: string };
  };
};

/**
 * A component's variants as metadata. The names, values and defaults are the
 * helper's; this only adds the words. The descriptions are keyed by the
 * helper's values, so describing a value it does not have, or leaving one out,
 * is a type error — and, for a caller without types, an error when it loads.
 */
export function describeVariants<D extends VariantDefinition>(
  variants: Variants<D>,
  descriptions: VariantDescriptions<D>,
): readonly VariantMeta[] {
  const words: {
    readonly [name: string]:
      | { readonly description: string; readonly values: { readonly [value: string]: string } }
      | undefined;
  } = descriptions;
  const lists: VariantDefinition = variants.values;
  const defaults: { readonly [name: string]: string } = variants.defaults;
  for (const name of Object.keys(words)) {
    if (!Object.hasOwn(lists, name)) {
      throw new TypeError(`Described variant "${name}" is not one the helper declares.`);
    }
  }
  return Object.entries(lists).map(([name, values]) => {
    const described = words[name];
    if (described === undefined) throw new TypeError(`Variant "${name}" is not described.`);
    for (const value of Object.keys(described.values)) {
      if (!values.includes(value)) {
        throw new TypeError(`Variant "${name}" has no value "${value}" to describe.`);
      }
    }
    return {
      name,
      attribute: `data-${name}`,
      description: described.description,
      default: defaults[name] ?? values[0],
      values: values.map((value) => {
        const description = described.values[value];
        if (description === undefined) {
          throw new TypeError(`Variant "${name}" value "${value}" is not described.`);
        }
        return { value, description };
      }),
    };
  });
}
