/**
 * Nothing in @rockaway/css transitions or eases (cairn 0075, 0120).
 *
 * Motion on the grid is frames on a tick, stepped by `useTick`. A transition
 * would slide a value between two cells, and a curve would decide how, and
 * neither has anywhere to land on a character grid. So no stylesheet in the
 * package may declare a transition or an animation, name a curve, or define
 * keyframes.
 *
 * The one thing allowed is the reduced-motion blanket in `motion.css`, which
 * shortens a consumer's own animation to nothing: an `!important` duration of
 * `1ms`, or a single iteration. It takes motion away and never adds any.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';

const MOTION_PROPERTY = /^(?:transition|animation)(?:-|$)/;
const CURVE = /\b(?:cubic-bezier|steps|linear)\(|\b(?:ease|ease-in|ease-out|ease-in-out)\b/;

/** What the reduced-motion blanket may say: shorten to nothing, play once. */
function stopsMotion(prop: string, value: string, important: boolean): boolean {
  if (!important) return false;
  if (prop === 'transition-duration' || prop === 'animation-duration') return value === '1ms';
  return prop === 'animation-iteration-count' && value === '1';
}

function scan(css: string, file: string): string[] {
  const found: string[] = [];
  const root = postcss.parse(css, { from: file });
  root.walkAtRules(/keyframes$/, (rule) => {
    found.push(`${file}: @${rule.name} ${rule.params}`);
  });
  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const where = `${file}: ${prop}: ${decl.value}`;
    if (MOTION_PROPERTY.test(prop) && !stopsMotion(prop, decl.value, decl.important)) {
      found.push(where);
    } else if (CURVE.test(decl.value)) {
      found.push(where);
    } else if (prop === 'scroll-behavior' && decl.value === 'smooth') {
      found.push(where);
    }
  });
  return found;
}

const src = path.join(
  path.dirname(createRequire(import.meta.url).resolve('@rockaway/css/package.json')),
  'src',
);
const files = readdirSync(src, { recursive: true, encoding: 'utf8' })
  .filter((name) => name.endsWith('.css'))
  .sort();

describe('@rockaway/css has no transitions and no curves', () => {
  test('reads every stylesheet in the package', () => {
    expect(files).toEqual(expect.arrayContaining(['motion.css', 'components/button.css']));
  });

  test('none declares a transition, an animation, a curve or keyframes', () => {
    const found = files.flatMap((name) => scan(readFileSync(path.join(src, name), 'utf8'), name));
    expect(found).toEqual([]);
  });
});

describe('the check', () => {
  test('fails on motion that moves, and lets the reduced-motion blanket through', () => {
    const fixture = `
      .a { transition: background 200ms; }
      .b { transition-timing-function: linear; }
      .c { animation: spin 1s infinite; }
      .d { color: red; transition-duration: 1ms; }
      .e { offset-path: none; transition-duration: 1ms !important; }
      .f { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
      .g { --curve: cubic-bezier(0.2, 0, 0, 1); }
      .h { scroll-behavior: smooth; }
      @keyframes spin { to { rotate: 1turn; } }`;
    expect(scan(fixture, 'x.css')).toEqual([
      'x.css: @keyframes spin',
      'x.css: transition: background 200ms',
      'x.css: transition-timing-function: linear',
      'x.css: animation: spin 1s infinite',
      'x.css: transition-duration: 1ms',
      'x.css: --curve: cubic-bezier(0.2, 0, 0, 1)',
      'x.css: scroll-behavior: smooth',
    ]);
  });
});
