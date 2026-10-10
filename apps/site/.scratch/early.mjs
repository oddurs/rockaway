// Does the page move between the frame before the script and the live one? Not a test.
import * as pw from 'playwright';

const chromium = pw[process.env.ENGINE ?? 'chromium'];

const root = process.env.ROOT ?? 'http://localhost:4330/rockaway/';
const pages = (
  process.env.PAGES ?? ',concept/,foundations/grid/,components/tree/,getting-started/'
).split(',');
const sizes = process.env.SIZES
  ? process.env.SIZES.split(',').map((s) => s.split('x').map(Number))
  : [
      [390, 844],
      [320, 640],
      [430, 932],
      [1280, 800],
    ];
const browser = await chromium.launch();

const rects = () => {
  const main = document.getElementById('content');
  const out = [];
  const visible = (el) => getComputedStyle(el).visibility === 'visible';
  for (const el of [main, ...main.querySelectorAll('*')]) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (el.closest('[data-site-drawing] > .rk-screen')) continue;
    out.push({
      el: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : ''}`,
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
      v: visible(el),
    });
  }
  return out;
};

for (const [width, height] of sizes) {
  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    if (process.env.DENSITY)
      await context.addInitScript(
        (d) =>
          localStorage.setItem(
            'rockaway:look',
            JSON.stringify({ theme: 'default', mode: 'light', density: d }),
          ),
        process.env.DENSITY,
      );
    await page.route('**/_astro/*.js', (route) => route.abort());
    await page.goto(root + p);
    await page.evaluate(() => document.fonts.ready);
    const before = await page.evaluate(rects);
    await context.close();

    const live = await browser.newContext({ viewport: { width, height } });
    const lp = await live.newPage();
    if (process.env.DENSITY)
      await live.addInitScript(
        (d) =>
          localStorage.setItem(
            'rockaway:look',
            JSON.stringify({ theme: 'default', mode: 'light', density: d }),
          ),
        process.env.DENSITY,
      );
    await lp.goto(root + p);
    await lp.waitForFunction(
      () =>
        document.documentElement.dataset.rkShell === 'live' &&
        document.querySelectorAll('astro-island[ssr]').length === 0,
    );
    await lp.evaluate(() => document.fonts.ready);
    await lp.waitForTimeout(200);
    const after = await lp.evaluate(rects);
    await live.close();

    const shown = before.filter((r) => r.v).length;
    const moved = [];
    for (let i = 0; i < Math.max(before.length, after.length); i++) {
      const a = before[i];
      const b = after[i];
      if (!a || !b || a.el !== b.el) {
        moved.push(`#${i} differs: ${a?.el} vs ${b?.el}`);
        break;
      }
      if (!a.v) continue;
      const d = Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.w - b.w),
        Math.abs(a.h - b.h),
      );
      if (d > 0.02)
        moved.push(
          `${a.el} ${JSON.stringify([a.x, a.y, a.w, a.h].map((n) => +n.toFixed(2)))} -> ${JSON.stringify([b.x, b.y, b.w, b.h].map((n) => +n.toFixed(2)))}`,
        );
    }
    console.log(
      `${width}x${height} ${p || '(home)'}: ${shown} visible before; ${moved.length} moved${moved.length ? `\n  ${moved.slice(0, 5).join('\n  ')}` : ''}`,
    );
  }
}
await browser.close();
