/**
 * Variants as typed data (cairn 0032).
 *
 * On the grid a variant changes a border set, an attribute or a palette role,
 * never a size in pixels (0076). It reaches the CSS as a `data-*` attribute and
 * never as a class name, because the CSS reads state and nothing else (0009).
 * So a component declares its variants once, as data, and the rest is derived
 * from that one declaration: the prop types, the defaults, the attributes, and
 * the value lists the metadata publishes (0047).
 *
 *   const BUTTON = { variant: ['default', 'fill'], size: ['md', 'lg'] } as const;
 *   export const buttonVariants: Variants<typeof BUTTON> = defineVariants(BUTTON, {
 *     variant: 'default',
 *     size: 'md',
 *   });
 *
 * The annotation is the price of `isolatedDeclarations`: an exported value made
 * by a call has to spell its type, and `typeof` of the literal is the cheapest
 * spelling there is. It cannot drift, because it is the literal.
 *
 * States are not variants. React Aria writes them (`data-hovered`,
 * `data-pressed`, ...) and the state vocabulary (0118) says how each is drawn;
 * a variant may not take one of their names, so the two can never be confused
 * in a selector.
 */

/** The values a variant can take: at least one, written as literals. */
export type VariantValues = readonly [string, ...string[]];

/** Every variant a component has, by the name its prop and attribute share. */
export type VariantDefinition = { readonly [name: string]: VariantValues };

/** One value chosen for every variant. */
export type VariantSelection<D extends VariantDefinition> = {
  readonly [K in keyof D]: D[K][number];
};

/** What a component hands over: any variant may be left out, or undefined. */
export type VariantInput<D extends VariantDefinition> = {
  readonly [K in keyof D]?: D[K][number] | undefined;
};

/** The attributes written to the element: `variant` becomes `data-variant`. */
export type VariantAttributes<D extends VariantDefinition> = {
  readonly [K in keyof D & string as `data-${K}`]: D[K][number];
};

export interface Variants<D extends VariantDefinition> {
  /** Every value of every variant, in declared order. The metadata reads these. */
  readonly values: D;
  /** The value each variant takes when the prop is left out. */
  readonly defaults: VariantSelection<D>;
  /** Fills in the defaults: what the component is actually drawing. */
  select(props: VariantInput<D>): VariantSelection<D>;
  /**
   * The `data-*` attributes for the element, defaults written out, so the CSS
   * can select the default as plainly as any other value.
   */
  dataAttributes(props: VariantInput<D>): VariantAttributes<D>;
}

/** A component's variant props: each optional, because each has a default. */
export type VariantProps<V> =
  V extends Variants<infer D> ? { readonly [K in keyof D]?: D[K][number] } : never;

/** The values one variant can take: `VariantValue<typeof buttonVariants, 'size'>`. */
export type VariantValue<V, K extends string> =
  V extends Variants<infer D> ? (K extends keyof D ? D[K][number] : never) : never;

/**
 * Names a variant may not take, because they are already attributes: the
 * states React Aria writes and the state vocabulary draws (0118), and the
 * attributes the base CSS reads from an ancestor.
 */
const RESERVED = [
  'current',
  'disabled',
  'expanded',
  'focused',
  'hovered',
  'indeterminate',
  'invalid',
  'open',
  'pending',
  'placeholder',
  'pressed',
  'readonly',
  'required',
  'selected',
  'attrs',
  'density',
  'motion',
] as const;

type Reserved = (typeof RESERVED)[number];

/** Rejects a reserved name at the call, before it reaches a selector. */
type NoReserved<D> = { readonly [K in keyof D & Reserved]: never };

// A name is the prop and the attribute both, so it has to be a valid word for
// each. A value is written into selectors and the metadata, so it stays plain.
const NAME = /^[a-z][a-z0-9]*$/;
const VALUE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Declares a component's variants. Throws when the module loads if the
 * declaration is malformed, so a bad one never reaches a render.
 */
export function defineVariants<const D extends VariantDefinition>(
  values: D & NoReserved<D>,
  defaults: VariantSelection<D>,
): Variants<D> {
  const names = Object.keys(values) as Array<keyof D & string>;
  const lists: { readonly [name: string]: readonly string[] } = values;
  for (const name of names) {
    if (!NAME.test(name)) {
      throw new TypeError(
        `Variant "${name}" must be one lowercase word: it is a prop and a data-* attribute.`,
      );
    }
    if ((RESERVED as readonly string[]).includes(name)) {
      throw new TypeError(
        `Variant "${name}" is a state attribute, and a variant may not take its name (0118).`,
      );
    }
    const list = lists[name] ?? [];
    if (list.length === 0) throw new TypeError(`Variant "${name}" has no values.`);
    for (const value of list) {
      if (!VALUE.test(value)) {
        throw new TypeError(
          `Variant "${name}" has value "${value}": values are lowercase kebab-case.`,
        );
      }
    }
    if (new Set(list).size !== list.length) {
      throw new TypeError(`Variant "${name}" lists a value twice.`);
    }
    if (!list.includes(defaults[name])) {
      throw new TypeError(
        `Variant "${name}" defaults to "${defaults[name]}", which is not one of its values.`,
      );
    }
  }
  for (const name of Object.keys(defaults)) {
    if (!Object.hasOwn(values, name))
      throw new TypeError(`Default given for unknown variant "${name}".`);
  }

  // A value that is not declared is drawn as the default rather than written
  // through: the types already refuse it, and the CSS should only ever see a
  // value it has a rule for.
  const select = (props: VariantInput<D>): VariantSelection<D> => {
    const chosen: Record<string, string> = {};
    for (const name of names) {
      const value = props[name];
      chosen[name] = value !== undefined && lists[name]?.includes(value) ? value : defaults[name];
    }
    return chosen as VariantSelection<D>;
  };

  return {
    values: Object.freeze(
      Object.fromEntries(names.map((name) => [name, Object.freeze([...(lists[name] ?? [])])])),
    ) as unknown as D,
    defaults: Object.freeze({ ...defaults }),
    select,
    dataAttributes(props) {
      const chosen: Record<string, string> = select(props);
      return Object.fromEntries(
        names.map((name) => [`data-${name}`, chosen[name]]),
      ) as VariantAttributes<D>;
    },
  };
}
