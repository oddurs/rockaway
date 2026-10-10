import { cellsIn } from '@rockaway/react';

const cellsCovering = (px: number, cell: number): number =>
  Math.max(0, Math.ceil(px / cell - 1 / 16));

import { test } from 'vitest';
import { commands } from 'vitest/browser';
import jbUrl from './jb.woff2?url';
import plexUrl from './plex.woff2?url';

/** Ascent plus descent over the em, from hhea/typo (identical in both, USE_TYPO_METRICS on). */
const fonts = [
  { name: 'Plex', url: plexUrl, A: 1.3, ascent: 1.025 },
  { name: 'JB', url: jbUrl, A: 1.32, ascent: 1.02 },
] as const;
const densities = [
  ['dense', 1],
  ['normal', 1.5],
  ['airy', 2],
  ['touch', 2.75],
] as const;
const TEXT = 'Hgjy Éx';

const css = `
.box { position: absolute; left: 0; top: 0; font-size: 16px; white-space: pre; }
.sz {
  display: inline-block; vertical-align: top; white-space: pre;
  inline-size: round(up, calc(var(--chars) * 1ch * var(--n) * var(--L) / var(--A) - 1px / 32), 1ch);
  block-size: calc(var(--n) * 1lh);
}
.szt {
  display: block;
  font-size: calc(var(--n) * var(--L) * 1em / var(--A));
  line-height: calc(var(--A) * 1em);
}
.mark { display: inline-block; inline-size: 0; block-size: 0; vertical-align: baseline; }
.after { display: inline-block; vertical-align: top; }
`;

test('type sized in rows', async () => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  for (const f of fonts) {
    const face = new FontFace(f.name, await (await fetch(f.url)).arrayBuffer());
    await face.load();
    document.fonts.add(face);
  }
  const ua = navigator.userAgent.includes('Firefox')
    ? 'firefox'
    : navigator.userAgent.includes('Chrome')
      ? 'chromium'
      : 'webkit';
  const rows: string[] = [];
  const canvas = document.createElement('canvas').getContext('2d');
  if (!canvas) throw new Error('no canvas');
  for (const f of fonts) {
    for (const [density, L] of densities) {
      for (const n of [1, 2, 3, 4]) {
        const box = document.createElement('div');
        box.className = 'box';
        box.style.fontFamily = `"${f.name}"`;
        box.style.lineHeight = String(L);
        box.style.setProperty('--L', String(L));
        box.style.setProperty('--A', String(f.A));
        box.innerHTML = `<span class="ruler">${'x'.repeat(100)}</span><br><span class="sz" style="--n:${n};--chars:${[...TEXT].length}"><span class="szt">${TEXT}<span class="mark"></span></span></span><span class="after">|</span>`;
        document.body.append(box);
        const origin = box.getBoundingClientRect();
        const cw = (box.querySelector('.ruler') as HTMLElement).getBoundingClientRect().width / 100;
        const H = Number.parseFloat(getComputedStyle(box).lineHeight);
        const sz = box.querySelector('.sz') as HTMLElement;
        const r = sz.getBoundingClientRect();
        const t = sz.querySelector('.szt') as HTMLElement;
        const F = Number.parseFloat(getComputedStyle(t).fontSize);
        const range = document.createRange();
        range.selectNodeContents(t.firstChild as Text);
        const content = range.getBoundingClientRect();
        const base = (t.querySelector('.mark') as HTMLElement).getBoundingClientRect().top - r.top;
        const after =
          (box.querySelector('.after') as HTMLElement).getBoundingClientRect().left - origin.left;
        canvas.font = `${F}px "${f.name}"`;
        const up = canvas.measureText('ÉHbdfhkl|');
        const down = canvas.measureText('gjpqy|');
        const out = {
          ua,
          font: f.name,
          density,
          n,
          F: +F.toFixed(4),
          scale: +(F / 16).toFixed(4),
          rowsH: +(r.height / H).toFixed(4),
          contentTop: +(content.top - r.top).toFixed(3),
          contentBottom: +(r.bottom - content.bottom).toFixed(3),
          baseline: +base.toFixed(3),
          baselineWant: +(f.ascent * F).toFixed(3),
          inkTop: +(base - up.actualBoundingBoxAscent).toFixed(2),
          inkBelow: +(r.height - base - down.actualBoundingBoxDescent).toFixed(2),
          textCells: +(content.width / cw).toFixed(4),
          boxCells: +(r.width / cw).toFixed(5),
          afterCells: +(after / cw).toFixed(5),
          cellsIn: cellsIn(r.width, cw),
          cellsCovering: cellsCovering(r.width, cw),
        };
        rows.push(JSON.stringify(out));
        box.remove();
      }
    }
  }
  await commands.writeFile(`./scratch/out-${ua}-${devicePixelRatio}.jsonl`, rows.join('\n'));
});
