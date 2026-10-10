/**
 * The example apps (cairn 0151), on their own pages of the built site: each
 * works by keyboard alone, wide, narrow and at touch density, and nothing in
 * it scrolls across. Ported from the Astro site's tests. Each page sits in the
 * shell, so a test enters the app at its first stop and is keyboard from
 * there. Run after `pnpm build`, against `out/`.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { type Serving, serve } from '../scripts/serve.ts';
import { servePackageFile } from './checks.ts';

const out = path.join(import.meta.dirname, '..', 'out');

let browser: Browser;
let site: Serving;

beforeAll(async () => {
  if (!existsSync(path.join(out, 'index.html'))) throw new Error('no export: run pnpm build first');
  site = await serve(out, { port: 0, extra: servePackageFile });
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser?.close();
  await site?.close();
});

/** An app's first stop: a control React has made live, which the server's HTML has not. */
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex="0"]';

/** Live: the app's first stop carries React's props, so it has hydrated. */
const hydrated = (page: Page, name: string) =>
  page.waitForFunction(
    ([n, focusable]) => {
      const first = document.querySelector(`[data-example="${n}"]`)?.querySelector(focusable);
      return first != null && Object.keys(first).some((key) => key.startsWith('__reactProps'));
    },
    [name, FOCUSABLE] as const,
  );

/** Focus the app's first stop, as Tab from the content before it would. */
const enter = (page: Page, name: string) =>
  page.evaluate(
    ([n, focusable]) => {
      document
        .querySelector(`[data-example="${n}"]`)
        ?.querySelector<HTMLElement>(focusable)
        ?.focus();
    },
    [name, FOCUSABLE] as const,
  );

test('the settings example works by keyboard alone, wide, narrow and at touch (0151)', async () => {
  for (const { width, density } of [
    { width: 1200, density: undefined },
    { width: 420, density: undefined },
    { width: 420, density: 'touch' },
  ]) {
    const reader = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors: string[] = [];
    reader.on('pageerror', (error) => errors.push(error.message));
    reader.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await reader.goto(`${site.url}examples/settings/`);
    if (density) {
      await reader.evaluate((d) => {
        document.documentElement.dataset.density = d;
      }, density);
    }
    await reader.waitForSelector('.settings .rk-frame[data-rk-painted]');
    await hydrated(reader, 'settings');
    const at = `${width}px${density ? `, ${density}` : ''}`;

    // Nothing scrolls across, at a phone's width either.
    const overflow = await reader.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, at).toBe(0);

    // Into the app, Tab to the name, change it, and save with the keyboard.
    const name = reader.getByRole('textbox', { name: 'Name' });
    await enter(reader, 'settings');
    for (let i = 0; i < 10 && !(await name.evaluate((el) => el === document.activeElement)); i++) {
      await reader.keyboard.press('Tab');
    }
    await expect(name.evaluate((el) => el === document.activeElement)).resolves.toBe(true);
    // End puts the caret after the value, wherever focus put it.
    await reader.keyboard.press('End');
    await reader.keyboard.type(' King');
    expect(await name.inputValue(), at).toBe('Ada Lovelace King');
    await reader.keyboard.press('ControlOrMeta+s');
    await reader.waitForFunction(
      () => document.querySelector('.settings-status')?.textContent === 'Saved.',
    );

    // A server error lands on its field, and nothing is saved.
    const email = reader.getByRole('textbox', { name: 'Email' });
    await email.focus();
    await reader.keyboard.press('ControlOrMeta+a');
    await reader.keyboard.type('ada@x');
    await reader.keyboard.press('ControlOrMeta+s');
    await reader.waitForFunction(() =>
      document.querySelector('.settings-status')?.textContent?.startsWith('Not saved'),
    );
    await expect(email.getAttribute('aria-invalid')).resolves.toBe('true');

    // Deleting asks for the account's name before it does anything.
    await reader.getByRole('button', { name: 'Delete account' }).focus();
    await reader.keyboard.press('Enter');
    const dialog = reader.getByRole('alertdialog', { name: /Delete account/ });
    await dialog.waitFor();
    const remove = dialog.getByRole('button', { name: 'Delete' });
    await expect(remove.isDisabled()).resolves.toBe(true);
    await reader.keyboard.type('ada');
    await expect(remove.isDisabled()).resolves.toBe(false);
    await reader.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });

    expect(errors, at).toEqual([]);
    await reader.close();
  }
});

test('the git client works by keyboard alone, in panes and in tabs (0151)', async () => {
  for (const { width, density } of [
    { width: 1200, density: undefined },
    { width: 420, density: undefined },
    { width: 420, density: 'touch' },
  ]) {
    const reader = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors: string[] = [];
    reader.on('pageerror', (error) => errors.push(error.message));
    reader.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await reader.goto(`${site.url}examples/git-client/`);
    if (density) {
      await reader.evaluate((d) => {
        document.documentElement.dataset.density = d;
      }, density);
    }
    await hydrated(reader, 'settings');
    const narrow = width < 600;
    const at = `${width}px${density ? `, ${density}` : ''}`;

    // Under 60 cells it is tabs, one pane at a time; over, every pane at once.
    if (narrow) await reader.getByRole('tab', { name: 'Files' }).waitFor();
    await expect(reader.getByRole('tab').count(), at).resolves.toBe(narrow ? 3 : 0);
    const overflow = await reader.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, at).toBe(0);

    // Into the app, Tab to the tree, and Space on a file stages it.
    const list = reader.getByRole('row', { name: /list\.tsx/ });
    await enter(reader, 'git-client');
    for (
      let i = 0;
      i < 10 && !(await reader.evaluate(() => document.activeElement?.role === 'row'));
      i++
    ) {
      await reader.keyboard.press('Tab');
    }
    await list.focus();
    await reader.keyboard.press('Space');
    await expect(list.getAttribute('aria-selected'), at).resolves.toBe('true');
    await reader.getByRole('status').getByText('Staged src/components/list.tsx').waitFor();

    // The summary, then mod+enter from the field commits what is staged.
    await reader.keyboard.press('Tab');
    await expect(
      reader
        .getByRole('textbox', { name: 'Summary' })
        .evaluate((el) => el === document.activeElement),
      at,
    ).resolves.toBe(true);
    await reader.keyboard.type('Clamp the list');
    await reader.keyboard.press('ControlOrMeta+Enter');
    await reader
      .getByRole('status')
      .getByText(/^Committed [0-9a-f]{7}, signed$/)
      .waitFor();
    await expect(list.count(), at).resolves.toBe(0);

    // `?` lists the keys, generated from the bindings.
    const tree = reader.getByRole('row', { name: /tree\.tsx/ });
    await tree.focus();
    await reader.keyboard.press('Shift+Slash');
    const help = reader.getByRole('dialog', { name: 'Keys' });
    await help.waitFor();
    await expect(help.textContent()).resolves.toContain('Discard the file’s changes');
    await reader.keyboard.press('Escape');
    await help.waitFor({ state: 'detached' });

    // Backspace asks first; Discard drops the file, and focus goes to the next.
    await tree.focus();
    await reader.keyboard.press('Backspace');
    const ask = reader.getByRole('alertdialog', { name: /Discard changes/ });
    await ask.waitFor();
    const discard = ask.getByRole('button', { name: 'Discard' });
    for (
      let i = 0;
      i < 4 && !(await discard.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await reader.keyboard.press('Tab');
    }
    await reader.keyboard.press('Enter');
    await ask.waitFor({ state: 'detached' });
    await expect(tree.count(), at).resolves.toBe(0);
    await expect(
      reader.evaluate(() => document.activeElement?.getAttribute('data-key')),
      at,
    ).resolves.toBe('docs/old.md');

    expect(errors, at).toEqual([]);
    await reader.close();
  }
});

test('the system monitor works by keyboard alone, and its rows hold still on the tick (0151)', async () => {
  for (const { width, density } of [
    { width: 1200, density: undefined },
    { width: 420, density: undefined },
    { width: 420, density: 'touch' },
  ]) {
    const reader = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors: string[] = [];
    reader.on('pageerror', (error) => errors.push(error.message));
    reader.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await reader.goto(`${site.url}examples/top/`);
    if (density) {
      await reader.evaluate((d) => {
        document.documentElement.dataset.density = d;
      }, density);
    }
    await hydrated(reader, 'top');
    const narrow = width < 600;
    const at = `${width}px${density ? `, ${density}` : ''}`;
    const rows = reader.locator('[role="row"][data-key]');
    const keys = () => rows.evaluateAll((all) => all.map((r) => r.getAttribute('data-key')));
    const values = () => rows.evaluateAll((all) => all.map((r) => r.textContent));

    // Over 60 cells every column; under, PID, NAME and CPU% and the rest behind Enter.
    // It lays out once it has measured its cells, a moment after it hydrates.
    await expect
      .poll(() => reader.getByRole('columnheader').count(), { message: at })
      .toBe(narrow ? 3 : 6);
    const overflow = await reader.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, at).toBe(0);

    // On the tick the values change and the rows do not move.
    const order = await keys();
    const before = await values();
    await reader.waitForFunction(
      (was) =>
        [...document.querySelectorAll('[role="row"][data-key]')].some(
          (r, i) => r.textContent !== was[i],
        ),
      before,
    );
    await expect(keys(), at).resolves.toEqual(order);

    // `p` pauses it, and `r` takes one step.
    await rows.first().focus();
    await reader.keyboard.press('p');
    await reader.getByText('paused', { exact: true }).waitFor();
    const paused = await values();
    await reader.waitForTimeout(1200);
    await expect(values(), at).resolves.toEqual(paused);
    await reader.keyboard.press('r');
    await expect.poll(values, { timeout: 2000 }).not.toEqual(paused);

    // Enter shows what the table has no room for.
    const pid = String(order[0]);
    await reader.keyboard.press('Enter');
    const details = reader.getByRole('dialog');
    await details.waitFor();
    await expect(details.textContent(), at).resolves.toContain(`PID: ${pid}`);
    await expect(details.textContent(), at).resolves.toContain('Memory:');
    await reader.keyboard.press('Escape');
    await details.waitFor({ state: 'detached' });

    // `k` asks first; Kill takes the process away, and focus stays in the table.
    await rows.first().focus();
    await reader.keyboard.press('k');
    const ask = reader.getByRole('alertdialog');
    await ask.waitFor();
    const kill = ask.getByRole('button', { name: 'Kill' });
    for (let i = 0; i < 4 && !(await kill.evaluate((el) => el === document.activeElement)); i++) {
      await reader.keyboard.press('Tab');
    }
    await reader.keyboard.press('Enter');
    await ask.waitFor({ state: 'detached' });
    await reader.getByRole('status').getByText(`Killed ${pid}`).waitFor();
    await expect(keys(), at).resolves.not.toContain(pid);
    await expect(
      reader.evaluate(() => document.activeElement?.getAttribute('role')),
      at,
    ).resolves.toBe('row');

    // `/` goes to the filter; a name narrows the table.
    await reader.keyboard.press('/');
    await reader.keyboard.type('postgres');
    await expect.poll(() => rows.count(), { timeout: 2000 }).toBe(2);

    // `?` lists the keys, generated from the bindings.
    await rows.first().focus();
    await reader.keyboard.press('Shift+Slash');
    const help = reader.getByRole('dialog', { name: 'Keys' });
    await help.waitFor();
    await expect(help.textContent()).resolves.toContain('Sort again, by the values now');
    await reader.keyboard.press('Escape');

    expect(errors, at).toEqual([]);
    await reader.close();
  }

  // Under reduced motion the spinner stops, and the numbers still come: current
  // numbers are not motion. They come on the slower refresh, every five seconds.
  const still = await browser.newPage({ reducedMotion: 'reduce' });
  await still.goto(`${site.url}examples/top/`);
  await hydrated(still, 'top');
  await still.getByText('live · every 5s').waitFor();
  const frame = still.locator('.rk-spinner-frame');
  const turned = await frame.textContent();
  const rows = still.locator('[role="row"][data-key]');
  const first = await rows.evaluateAll((all) => all.map((r) => r.textContent));
  await still.waitForTimeout(1500);
  await expect(rows.evaluateAll((all) => all.map((r) => r.textContent))).resolves.toEqual(first);
  await expect
    .poll(() => rows.evaluateAll((all) => all.map((r) => r.textContent)), { timeout: 8000 })
    .not.toEqual(first);
  await expect(frame.textContent()).resolves.toBe(turned);
  await still.close();
}, 60_000);
