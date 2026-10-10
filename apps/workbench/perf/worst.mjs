// Paint budget, worst case (cairn 0113): a screen where nearly every cell is a
// shape ('lattice') and a screen of text ('text'), painted by paintCells, at
// three sizes, both painters, unthrottled and at 4x CPU throttle. One JSON
// line a case. Build the page first: see README.md.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.join(import.meta.dirname, 'dist');
const require = createRequire(path.join(import.meta.dirname, '..', 'package.json'));
const { chromium } = require('playwright');
const RUNS = 5;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
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

const SIZES = [
  [80, 24],
  [120, 40],
  [200, 60],
];
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return Math.round(s[Math.floor(s.length / 2)] * 10) / 10;
};

async function measure(browser, kind, [cols, rows], painter, throttle) {
  const context = await browser.newContext({ viewport: { width: 2200, height: 1600 } });
  const tab = await context.newPage();
  const cdp = await context.newCDPSession(tab);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await cdp.send('Performance.enable');
  await tab.addInitScript(() => {
    window.__shown = new Promise((done) => {
      const look = () =>
        document.documentElement?.hasAttribute('data-painted')
          ? requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now())))
          : requestAnimationFrame(look);
      look();
    });
  });
  await tab.goto(`${base}/?cols=${cols}&rows=${rows}&painter=${painter}&kind=${kind}`, {
    waitUntil: 'load',
  });
  const shown = await tab.evaluate(() => window.__shown);
  const nodes = await tab.evaluate(() => {
    const shaped = [...document.querySelectorAll('[data-rk-shape]')];
    // Background layers actually drawn: one per mark, across every shaped run.
    const layers = shaped.reduce(
      (n, el) => n + (getComputedStyle(el).backgroundImage.match(/gradient\(/g)?.length ?? 0),
      0,
    );
    return {
      all: document.getElementsByTagName('*').length,
      runs: document.querySelectorAll('.rk-run').length,
      shaped: shaped.length,
      layers,
    };
  });

  const metrics = async () =>
    Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
  // A repaint: the change, then the second frame after it, and how much of
  // that was script, style and layout.
  const timed = async (src) => {
    const a = await metrics();
    const ms = await tab.evaluate(async (s) => {
      const t0 = performance.now();
      new Function(s)();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t0;
    }, src);
    const b = await metrics();
    const d = (k) => (b[k] - a[k]) * 1000;
    return {
      ms,
      script: d('ScriptDuration'),
      style: d('RecalcStyleDuration'),
      layout: d('LayoutDuration'),
    };
  };
  const resize = [];
  for (let i = 0; i < RUNS; i++) {
    resize.push(await timed(`repaint(${cols - 1}, ${rows})`));
    resize.push(await timed(`repaint(${cols}, ${rows})`));
  }
  // A density switch moves the line box, so the screen remeasures and repaints.
  const density = [];
  for (let i = 0; i < RUNS; i++) {
    for (const d of ['dense', 'normal']) {
      density.push(
        await timed(`document.documentElement.dataset.density = '${d}'; repaint(${cols}, ${rows})`),
      );
    }
  }
  await context.close();
  const pick = (xs, k) => median(xs.map((x) => x[k]));
  return {
    kind,
    cols,
    rows,
    painter,
    throttle,
    nodes,
    shown: Math.round(shown),
    resize: {
      ms: pick(resize, 'ms'),
      script: pick(resize, 'script'),
      style: pick(resize, 'style'),
      layout: pick(resize, 'layout'),
    },
    density: {
      ms: pick(density, 'ms'),
      script: pick(density, 'script'),
      style: pick(density, 'style'),
      layout: pick(density, 'layout'),
    },
  };
}

async function scroll(browser, kind, [cols, rows], painter, throttle) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const tab = await context.newPage();
  const cdp = await context.newCDPSession(tab);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await tab.goto(`${base}/?cols=${cols}&rows=${rows}&painter=${painter}&kind=${kind}&screens=6`, {
    waitUntil: 'load',
  });
  await tab.waitForTimeout(300);
  await tab.mouse.move(400, 400);
  await tab.evaluate(() => {
    window.__frames = [];
    const tick = (t) => {
      window.__frames.push(t);
      window.__raf = requestAnimationFrame(tick);
    };
    window.__raf = requestAnimationFrame(tick);
  });
  const end = Date.now() + 2000;
  while (Date.now() < end) {
    await tab.mouse.wheel(0, 80);
    await tab.waitForTimeout(16);
  }
  const r = await tab.evaluate(() => {
    cancelAnimationFrame(window.__raf);
    const f = window.__frames;
    const gaps = f.slice(1).map((t, i) => t - f[i]);
    const s = gaps.reduce((a, b) => a + b, 0) / 1000;
    return {
      fps: Math.round(gaps.length / s),
      worst: Math.round(Math.max(...gaps)),
      long: gaps.filter((g) => g > 1000 / 30).length,
      scrolled: Math.round(scrollY),
    };
  });
  await context.close();
  return r;
}

const browser = await chromium.launch({ headless: true });
const THR = (process.env.THROTTLES ?? '1,4').split(',').map(Number);
const KINDS = (process.env.KINDS ?? 'lattice,text').split(',');
const PAINTS = (process.env.PAINTERS ?? 'glyph,rule').split(',');
for (const throttle of THR)
  for (const kind of KINDS)
    for (const size of SIZES)
      for (const painter of PAINTS) {
        const r = await measure(browser, kind, size, painter, throttle);
        r.scroll = await scroll(browser, kind, size, painter, throttle);
        console.log(JSON.stringify(r));
      }
await browser.close();
server.close();
