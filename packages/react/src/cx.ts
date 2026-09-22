/**
 * Joins class names, skipping falsy values. Components compose their stable
 * `ds-*` class with whatever the consumer passes (cairn 0009).
 */
export function cx(...classes: ReadonlyArray<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
