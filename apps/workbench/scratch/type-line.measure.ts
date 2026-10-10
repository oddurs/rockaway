import { test } from 'vitest';
import { commands } from 'vitest/browser';
import plexUrl from './plex.woff2?url';

const css = `
.box { position: absolute; left: 0; top: 0; font-size: 16px; white-space: pre; font-family: "Plex"; --A: 1.3; }
.sz {
  display: inline-block; white-space: pre;
  inline-size: round(up, calc(var(--chars) * 1ch * var(--n) * var(--L) / var(--A) - 1px / 32), 1ch);
}
.szt { display: block; font-size: calc(var(--n) * var(--L) * 1em / var(--A)); line-height: calc(var(--A) * 1em); }
`;

test('a sized block in a line of text', async () => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const face = new FontFace('Plex', await (await fetch(plexUrl)).arrayBuffer());
  await face.load();
  document.fonts.add(face);
  const ua = navigator.userAgent.includes('Firefox')
    ? 'firefox'
    : navigator.userAgent.includes('Chrome')
      ? 'chromium'
      : 'webkit';
  const out: string[] = [];
  for (const L of [1, 1.5, 2, 2.75]) {
    for (const n of [2, 3]) {
      for (const align of ['top', 'bottom', 'baseline', 'text-bottom']) {
        const box = document.createElement('div');
        box.className = 'box';
        box.style.lineHeight = String(L);
        box.style.setProperty('--L', String(L));
        box.innerHTML = `<span class="pre">ab </span><span class="sz" style="--n:${n};--chars:4;vertical-align:${align}"><span class="szt">Hgjy</span></span><span class="post"> cd</span><br><span class="next">ef</span>`;
        document.body.append(box);
        const o = box.getBoundingClientRect();
        const H = L * 16;
        const at = (sel: string) => {
          const r = (box.querySelector(sel) as HTMLElement).getBoundingClientRect();
          return +((r.top - o.top) / H).toFixed(3);
        };
        const r = document.createRange();
        r.selectNodeContents((box.querySelector('.post') as HTMLElement).firstChild as Text);
        out.push(
          JSON.stringify({
            ua,
            L,
            n,
            align,
            sz: at('.sz'),
            postContentTopRows: +((r.getBoundingClientRect().top - o.top) / H).toFixed(3),
            next: at('.next'),
          }),
        );
        box.remove();
      }
    }
  }
  await commands.writeFile(`./scratch/line-${ua}.jsonl`, out.join('\n'));
});
