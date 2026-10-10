// Layout shifts while a page loads on Slow 4G, as Chromium counts them. Not a test.
import { chromium } from 'playwright';

const root = process.env.ROOT ?? 'http://localhost:4330/rockaway/';
const pages = (process.env.PAGES ?? ',concept/,foundations/grid/,components/tree/').split(',');
const sizes = (process.env.SIZES ?? '390x844,320x640,430x932,1280x800')
  .split(',')
  .map((s) => s.split('x').map(Number));
const browser = await chromium.launch();

for (const [width, height] of sizes) {
  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.shifts.push({
            value: e.value,
            at: Math.round(e.startTime),
            sources: e.sources.map((s) => {
              const n = s.node;
              const name = n
                ? n.nodeType === 1
                  ? `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]}`
                  : '#text'
                : '?';
              return `${name} ${JSON.stringify([s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height])}->${JSON.stringify([s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height])}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    if (!process.env.FAST) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    }
    await page.goto(root + p);
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.rkShell === 'live' &&
        document.querySelectorAll('astro-island[ssr]').length === 0,
      null,
      { timeout: 20000 },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const found = await page.evaluate(() => ({
      shifts: window.shifts,
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1),
    }));
    const total = found.shifts.reduce((s, e) => s + e.value, 0);
    console.log(`${width}x${height} ${p || '(home)'}: FCP ${found.fcp}ms, CLS ${total.toFixed(5)}`);
    for (const s of found.shifts)
      console.log(`  ${s.value.toFixed(5)} at ${s.at}ms: ${s.sources.slice(0, 3).join(' | ')}`);
    await context.close();
  }
}
await browser.close();
