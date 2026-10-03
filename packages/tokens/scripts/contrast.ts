/**
 * Contrast report for the committed tokens (cairn 0022).
 *
 *   node scripts/contrast.ts        print every pair; exit 1 if any fails
 *
 * Each pair is measured in every view a browser can show it in — sRGB, the
 * p3 override on a p3 screen, that override as Chromium reports it in sRGB,
 * and the same for rec2020 (cairn 0163) — and the worst is what is printed,
 * with the view it came from and its margin over the minimum.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkContrast, describeFailure } from '../src/contrast-check.ts';

const dir = path.join(import.meta.dirname, '..', 'dtcg');
const files = new Map<string, unknown>();
for (const name of await readdir(dir))
  files.set(name, JSON.parse(await readFile(path.join(dir, name), 'utf8')));

const results = checkContrast(files);
const pad = (s: string, n: number) => s.padEnd(n);
console.log(
  `${pad('mode', 6)}${pad('foreground', 20)}${pad('background', 24)}${pad('WCAG', 9)}${pad('min', 6)}${pad('margin', 8)}${pad('worst in', 17)}APCA Lc`,
);
for (const r of results) {
  console.log(
    `${pad(r.mode, 6)}${pad(r.fg, 20)}${pad(r.bg, 24)}${pad(`${r.ratio.toFixed(2)}:1`, 9)}${pad(String(r.min), 6)}${pad(`${r.margin >= 0 ? '+' : ''}${r.margin.toFixed(2)}`, 8)}${pad(r.view, 17)}${r.apca.toFixed(1).padStart(6)}${r.pass ? '' : '  FAIL'}`,
  );
}
const failures = results.filter((r) => !r.pass);
if (failures.length > 0) {
  console.error(
    `\n${failures.length} pair(s) below their minimum:\n  ${failures.map(describeFailure).join('\n  ')}`,
  );
  process.exit(1);
}
const closest = results.reduce((a, b) => (b.margin < a.margin ? b : a));
console.log(
  `\n${results.length} pairs, all at or above their minimum in every view. Closest: ${closest.fg} on ${closest.bg} (${closest.mode}, ${closest.view}), +${closest.margin.toFixed(3)}.`,
);
