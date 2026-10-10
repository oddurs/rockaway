// Paint budget (cairn 0113): the site shell (0104) at three window sizes, two
// painters, unthrottled and at 4x CPU throttle. Measures nodes, first paint,
// a resize, a density switch and scroll frames.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

// The site's built output, at base `/`: `SITE_BASE=/ pnpm --filter site build`.
const root = path.resolve(
  process.argv[2] ?? path.join(import.meta.dirname, '..', '..', 'site', 'dist'),
);
const page = process.argv[3] ?? '/concept/';
const runs = Number(process.argv[4] ?? 3);
const require = createRequire(path.join(import.meta.dirname, '..', 'package.json'));
const { chromium } = require('playwright');

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};
const server = createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

// JetBrains Mono at 16px: 9.6px advance; the normal density's line box is 24px.
const CELL = { w: 9.6, h: 24 };
const SIZES = [
  [80, 24],
  [120, 40],
  [200, 60],
];
const PAINTERS = ['glyph', 'rule'];
const THROTTLES = [1, 4];

// The rule painter is the glyph painter's cells with hairline strokes: the same
// elements, other stroke variables. Forcing those variables is that painter.
const RULE_CSS = `[data-rk-painted] { --rk-stroke-light: var(--rk-stroke-rule-light) !important; --rk-stroke-heavy: var(--rk-stroke-rule-heavy) !important; --rk-stroke-gap: var(--rk-stroke-rule-gap) !important; }`;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function measure(browser, [cols, rows], painter, throttle) {
  const context = await browser.newContext({
    viewport: { width: Math.ceil(cols * CELL.w), height: rows * CELL.h },
  });
  const tab = await context.newPage();
  const cdp = await context.newCDPSession(tab);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  if (painter === 'rule')
    await tab.addInitScript((css) => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.append(s);
      });
    }, RULE_CSS);
  // When the shell is shown, and the frame after it.
  await tab.addInitScript(() => {
    window.__shown = new Promise((done) => {
      const look = () =>
        document.documentElement?.hasAttribute('data-rk-shell')
          ? requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now())))
          : requestAnimationFrame(look);
      look();
    });
  });
  await tab.goto(`${base}${page}`, { waitUntil: 'load' });
  const shown = await tab.evaluate(() => window.__shown);
  const fcp = await tab.evaluate(
    () => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1,
  );
  await tab.waitForTimeout(300);

  const nodes = await tab.evaluate(() => ({
    all: document.getElementsByTagName('*').length,
    runs: document.querySelectorAll('.rk-run').length,
    shaped: document.querySelectorAll('[data-rk-shape]').length,
    screens: [...document.querySelectorAll('.rk-screen')].map(
      (s) => `${s.dataset.rkCols}x${s.dataset.rkRows}`,
    ),
  }));

  // A frame: change, then the second animation frame after it, which runs once
  // the frame with the change in it has been produced.
  const frame = (change) =>
    tab.evaluate(async (src) => {
      const t0 = performance.now();
      new Function(src)();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t0;
    }, change);

  // Resize: the window narrower by a cell and back, waiting each time for the
  // screens to redraw at the new size.
  const resize = [];
  for (let i = 0; i < runs; i++) {
    for (const width of [Math.ceil((cols - 1) * CELL.w), Math.ceil(cols * CELL.w)]) {
      const before = await tab.evaluate(() =>
        [...document.querySelectorAll('.rk-screen')].map((s) => s.dataset.rkCols).join(),
      );
      const t0 = Date.now();
      await tab.setViewportSize({ width, height: rows * CELL.h });
      await tab
        .waitForFunction(
          (b) =>
            [...document.querySelectorAll('.rk-screen')].map((s) => s.dataset.rkCols).join() !== b,
          before,
          { timeout: 5000 },
        )
        .catch(() => {});
      await tab.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      resize.push(Date.now() - t0);
    }
  }

  // Density: every density in turn, a frame each.
  const density = [];
  for (let i = 0; i < runs; i++) {
    for (const d of ['dense', 'airy', 'touch', 'normal']) {
      density.push(await frame(`document.documentElement.dataset.density = '${d}'`));
    }
  }

  // Scroll: wheel the page pane for two seconds, counting frames.
  const pane = await tab.$('.site-page');
  const box = pane ? await pane.boundingBox() : null;
  let scroll = null;
  if (box) {
    await tab.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await tab.evaluate(() => {
      window.__frames = [];
      const tick = (t) => {
        window.__frames.push(t);
        if (window.__frames.length < 100000) window.__raf = requestAnimationFrame(tick);
      };
      window.__raf = requestAnimationFrame(tick);
    });
    const end = Date.now() + 2000;
    while (Date.now() < end) {
      await tab.mouse.wheel(0, 60);
      await tab.waitForTimeout(16);
    }
    scroll = await tab.evaluate(() => {
      cancelAnimationFrame(window.__raf);
      const f = window.__frames;
      const gaps = f.slice(1).map((t, i) => t - f[i]);
      const s = gaps.reduce((a, b) => a + b, 0) / 1000;
      return {
        fps: Math.round(gaps.length / s),
        worst: Math.round(Math.max(...gaps)),
        long: gaps.filter((g) => g > 1000 / 30).length,
        scrolled: document.querySelector('.site-page')?.scrollTop ?? 0,
      };
    });
  }
  await context.close();
  return {
    cols,
    rows,
    painter,
    throttle,
    nodes,
    fcp: Math.round(fcp),
    shown: Math.round(shown),
    resize: median(resize),
    density: Math.round(median(density)),
    densityMax: Math.round(Math.max(...density)),
    scroll,
  };
}

const browser = await chromium.launch({ headless: true });
const out = [];
for (const throttle of THROTTLES)
  for (const size of SIZES)
    for (const painter of PAINTERS) {
      const r = await measure(browser, size, painter, throttle);
      out.push(r);
      console.log(JSON.stringify(r));
    }
await browser.close();
server.close();
