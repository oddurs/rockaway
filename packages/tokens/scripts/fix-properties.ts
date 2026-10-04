/**
 * Repairs `@property` registrations that would not parse (cairn 0066).
 *
 * Terrazzo registers a typography sub-value with the syntax of its type and an
 * initial value copied from the token; because that value is an alias, it comes
 * out as `initial-value: var(--rk-font-size-md)`. A custom property's initial
 * value has to be computationally independent, so no `var()` is allowed, and
 * Lightning CSS — Vite's minifier — rejects the whole stylesheet over it.
 *
 * The registration is rewritten to the untyped form, which is what Terrazzo
 * already does for every other alias. It runs as a step rather than a plugin
 * because `buildEnd` is handed a clone of the output files; `finish-css.ts`
 * runs it.
 */
const REGISTRATION =
  /@property (--[\w-]+) \{\n {2}syntax: '[^']*';\n {2}inherits: (true|false);\n {2}initial-value: [^\n]*var\([^\n]*\n\}/g;

export function repairRegistrations(css: string): string {
  return css.replace(
    REGISTRATION,
    (_, name: string, inherits: string) =>
      `@property ${name} {\n  syntax: '*';\n  inherits: ${inherits};\n}`,
  );
}
