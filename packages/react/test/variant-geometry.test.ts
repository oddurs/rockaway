/**
 * Variants and states do not change geometry (cairn 0032, 0118).
 *
 * A variant changes a border set, an attribute or a palette role; a state
 * changes attributes, colour, border weight or a glyph in a reserved cell.
 * Neither adds or removes a cell, because the grid forbids a control that
 * moves its neighbours. `data-size` is the one attribute whose job is geometry.
 *
 * So no rule in a component's CSS that is keyed on any other `data-*`
 * attribute may set a size, a padding, a margin or an inset. A rule that has
 * to declares it, in a comment directly above the declaration:
 *
 *   /* geometry exception: <why> *\/
 *
 * and the exceptions are listed below as a snapshot, so a new one is a change
 * a reviewer sees.
 *
 * A size can also change at one remove: a state rule sets a custom property,
 * `--rk-x-pad`, and a base rule pads with `var(--rk-x-pad)`. So the check
 * follows `var()` (cairn 0159). Every custom property a geometric declaration
 * reads, in any component stylesheet, is geometric, and so is every one a
 * geometric custom property is set from; a variant or state rule that sets
 * one is held to the same rule, and declares its exception the same way.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import postcss, { type Declaration, type Node, type Rule } from 'postcss';
import { describe, expect, test } from 'vitest';

/** The attributes whose job is geometry. Everything else is a variant or a state. */
const SIZING = new Set(['size']);

const GEOMETRY =
  /^(?:(?:min-|max-)?(?:width|height|inline-size|block-size)|(?:padding|margin|inset)(?:-.+)?|top|right|bottom|left)$/;

const EXCEPTION = /^geometry exception:\s*(\S.*)$/s;

interface Finding {
  readonly where: string;
  readonly reason?: string;
}

function selectorOf(rule: Rule): string {
  const parts = [rule.selector];
  for (let node: Node | undefined = rule.parent; node; node = node.parent) {
    if (node.type === 'rule') parts.unshift((node as Rule).selector);
  }
  return parts.join(' ');
}

/** The custom properties a value reads: `var(--a, var(--b))` reads both. */
function reads(value: string): string[] {
  return [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1] ?? '');
}

/**
 * Every custom property that ends up in a size, padding, margin or inset:
 * read by a geometric declaration, or set into one that is, however many
 * steps away. Across every sheet given, because a property set in one
 * stylesheet may be read in another.
 */
function geometricProperties(sheets: readonly string[]): Set<string> {
  const geometric = new Set<string>();
  const feeds = new Map<string, Set<string>>();
  for (const css of sheets) {
    postcss.parse(css).walkDecls((decl: Declaration) => {
      if (GEOMETRY.test(decl.prop)) {
        for (const name of reads(decl.value)) geometric.add(name);
      } else if (decl.prop.startsWith('--')) {
        for (const name of reads(decl.value)) {
          const into = feeds.get(decl.prop) ?? new Set<string>();
          into.add(name);
          feeds.set(decl.prop, into);
        }
      }
    });
  }
  // A property is geometric if a geometric one is set from it.
  let grew = true;
  while (grew) {
    grew = false;
    for (const [property, from] of feeds) {
      if (!geometric.has(property)) continue;
      for (const name of from) {
        if (!geometric.has(name)) {
          geometric.add(name);
          grew = true;
        }
      }
    }
  }
  return geometric;
}

/**
 * Every geometric declaration under a non-sizing `data-*` key, declared or
 * not: a size, padding, margin or inset, or a custom property that one of
 * those reads.
 */
function scan(css: string, file: string, geometric: ReadonlySet<string> = new Set()): Finding[] {
  const findings: Finding[] = [];
  postcss.parse(css, { from: file }).walkDecls((decl: Declaration) => {
    const through = decl.prop.startsWith('--') && geometric.has(decl.prop);
    if ((!GEOMETRY.test(decl.prop) && !through) || decl.parent?.type !== 'rule') return;
    const selector = selectorOf(decl.parent as Rule).replace(/\s+/g, ' ');
    const keys = [...selector.matchAll(/\[data-([a-z0-9-]+)/g)].map((match) => match[1] ?? '');
    if (!keys.some((key) => !SIZING.has(key))) return;
    const before = decl.prev();
    const declared = before?.type === 'comment' ? EXCEPTION.exec(before.text) : null;
    const where = `${file}: ${selector} { ${decl.prop} }`;
    findings.push(
      declared?.[1] ? { where, reason: declared[1].replace(/\s*\n\s*\*?\s*/g, ' ') } : { where },
    );
  });
  return findings;
}

const components = path.join(
  path.dirname(createRequire(import.meta.url).resolve('@rockaway/css/package.json')),
  'src/components',
);
const files = readdirSync(components)
  .filter((name) => name.endsWith('.css'))
  .sort();
const sheets = files.map((name) => readFileSync(path.join(components, name), 'utf8'));
const geometric = geometricProperties(sheets);
const findings = files.flatMap((name, i) => scan(sheets[i] ?? '', name, geometric));

describe('variants and states do not change geometry', () => {
  test('reads every component stylesheet', () => {
    expect(files).toContain('button.css');
  });

  test('no rule keyed on a variant or a state sets a size, padding, margin or inset', () => {
    const undeclared = findings.filter((finding) => finding.reason === undefined);
    expect(undeclared.map((finding) => finding.where)).toEqual([]);
  });

  test('the declared exceptions, each with its reason', () => {
    expect(
      findings.map((finding) => `${finding.where}\n  ${finding.reason}`).join('\n'),
    ).toMatchInlineSnapshot(`""`);
  });
});

describe('the check', () => {
  const fixture = `
    @layer rk.components {
      .rk-x { padding-inline: var(--rk-x-1); }
      .rk-x[data-size="lg"] { min-block-size: var(--rk-y-3); }
      .rk-x[data-variant="loud"] { color: var(--rk-fg-danger); margin-inline: var(--rk-x-1); }
      .rk-x[data-pressed] .rk-x-label { inset-block-start: 0; }
      .rk-x { &[data-hovered] { width: 1ch; } }
      .rk-x[data-variant="quiet"] {
        /* geometry exception: it says why */
        padding: 0;
      }
    }`;

  test('fails on a variant, a state or a nested rule that changes geometry, and passes size', () => {
    expect(scan(fixture, 'x.css', geometricProperties([fixture]))).toEqual([
      { where: 'x.css: .rk-x[data-variant="loud"] { margin-inline }' },
      { where: 'x.css: .rk-x[data-pressed] .rk-x-label { inset-block-start }' },
      { where: 'x.css: .rk-x &[data-hovered] { width }' },
      { where: 'x.css: .rk-x[data-variant="quiet"] { padding }', reason: 'it says why' },
    ]);
  });

  const through = `
    @layer rk.components {
      .rk-y {
        --rk-y-gap: var(--rk-y-pad);
        padding-inline: var(--rk-y-pad);
        margin-block: var(--rk-y-gap, 0);
        color: var(--rk-y-ink);
      }
      .rk-y[data-pressed] { --rk-y-pad: var(--rk-x-2); }
      .rk-y[data-selected] { --rk-y-ink: var(--rk-fg-accent); }
      .rk-y[data-size="lg"] { --rk-y-pad: var(--rk-x-3); }
      .rk-y[data-variant="wide"] {
        /* geometry exception: wide is wider on purpose */
        --rk-y-gap: var(--rk-y-1);
      }
    }
    .rk-z[data-hovered] { --rk-y-pad: 0; }`;

  test('follows custom properties: a state that pads through one fails, a colour does not', () => {
    const props = geometricProperties([through]);
    // The tokens they are set from are geometric too, and the ink is not.
    expect([...props].sort()).toEqual([
      '--rk-x-2',
      '--rk-x-3',
      '--rk-y-1',
      '--rk-y-gap',
      '--rk-y-pad',
    ]);
    expect(scan(through, 'y.css', props)).toEqual([
      { where: 'y.css: .rk-y[data-pressed] { --rk-y-pad }' },
      {
        where: 'y.css: .rk-y[data-variant="wide"] { --rk-y-gap }',
        reason: 'wide is wider on purpose',
      },
      { where: 'y.css: .rk-z[data-hovered] { --rk-y-pad }' },
    ]);
  });

  test('follows a property set in one stylesheet and read in another', () => {
    const base = '.rk-a { padding: var(--rk-a-pad); }';
    const state = '.rk-a[data-focused] { --rk-a-pad: var(--rk-x-1); }';
    expect(scan(state, 'state.css', geometricProperties([base, state]))).toEqual([
      { where: 'state.css: .rk-a[data-focused] { --rk-a-pad }' },
    ]);
    expect(scan(state, 'state.css', geometricProperties([state]))).toEqual([]);
  });
});
