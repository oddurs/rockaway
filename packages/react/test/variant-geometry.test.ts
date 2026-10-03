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

/** Every geometric declaration under a non-sizing `data-*` key, declared or not. */
function scan(css: string, file: string): Finding[] {
  const findings: Finding[] = [];
  postcss.parse(css, { from: file }).walkDecls((decl: Declaration) => {
    if (!GEOMETRY.test(decl.prop) || decl.parent?.type !== 'rule') return;
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
const findings = files.flatMap((name) =>
  scan(readFileSync(path.join(components, name), 'utf8'), name),
);

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
    ).toMatchInlineSnapshot(`
        "button.css: .rk-button[data-variant="quiet"] .rk-button-label { padding-inline }
          quiet has no delimiters, so the cell of air that holds the label off them goes too. A variant that drops its chrome, not one that resizes it; 0131 decides whether it stays a variant."
      `);
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
    expect(scan(fixture, 'x.css')).toEqual([
      { where: 'x.css: .rk-x[data-variant="loud"] { margin-inline }' },
      { where: 'x.css: .rk-x[data-pressed] .rk-x-label { inset-block-start }' },
      { where: 'x.css: .rk-x &[data-hovered] { width }' },
      { where: 'x.css: .rk-x[data-variant="quiet"] { padding }', reason: 'it says why' },
    ]);
  });
});
