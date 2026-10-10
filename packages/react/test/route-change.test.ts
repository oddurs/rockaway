import { afterEach, describe, expect, test, vi } from 'vitest';
import { createRouteChanges, type HeadingTarget } from '../src/route-change.ts';

/** A heading that records being moved to. */
function heading(): HeadingTarget & { focused: unknown[] } {
  const focused: unknown[] = [];
  return {
    tabIndex: 0,
    focused,
    focus(options) {
      focused.push(options);
    },
  };
}

/** A pane with an `h1` in it, and a scroll position. */
function pane(h1: HeadingTarget | null = null): {
  scrollTop: number;
  querySelector(s: string): unknown;
} {
  return { scrollTop: 0, querySelector: (selector) => (selector === 'h1' ? h1 : null) };
}

afterEach(() => vi.unstubAllGlobals());

describe('createRouteChanges', () => {
  test('says nothing and moves nothing on the first page', () => {
    const said: string[] = [];
    const h1 = heading();
    const routes = createRouteChanges({ announce: (t) => said.push(t) });
    vi.stubGlobal('document', { title: 'Home' });
    routes.enter('/', { scrollers: { page: pane(h1) } });
    expect(said).toEqual([]);
    expect(h1.focused).toEqual([]);
  });

  test('focuses the heading without scrolling, and announces the title, on later pages', () => {
    const said: string[] = [];
    const h1 = heading();
    const routes = createRouteChanges({ announce: (t) => said.push(t) });
    vi.stubGlobal('document', { title: 'Guide' });
    routes.enter('/', { scrollers: { page: pane() } });
    routes.enter('/guide', { scrollers: { page: pane(h1) } });
    expect(h1.focused).toEqual([{ preventScroll: true }]);
    expect(h1.tabIndex).toBe(-1);
    expect(said).toEqual(['Guide']);
  });

  test('takes a heading and a title from the caller, when it has them', () => {
    const said: string[] = [];
    const given = heading();
    const routes = createRouteChanges({ announce: (t) => said.push(t) });
    routes.enter('/', { scrollers: {} });
    routes.enter('/x', { scrollers: { page: pane(heading()) }, heading: given, title: 'X' });
    expect(given.focused).toHaveLength(1);
    expect(said).toEqual(['X']);
  });

  test('starts a new page at the top of every pane', () => {
    const routes = createRouteChanges({ announce: () => undefined });
    const page = pane();
    const outline = pane();
    page.scrollTop = 300;
    outline.scrollTop = 80;
    routes.enter('/a', { scrollers: { page, outline }, title: 'A' });
    expect([page.scrollTop, outline.scrollTop]).toEqual([0, 0]);
  });

  test('returns each pane to where it was, by route key, when told it is back', () => {
    const routes = createRouteChanges({ announce: () => undefined });
    const page = pane();
    const outline = pane();
    const leave = routes.enter('/a', { scrollers: { page, outline }, title: 'A' });
    page.scrollTop = 300;
    outline.scrollTop = 80;
    leave();
    routes.enter('/b', { scrollers: { page, outline }, title: 'B' });
    expect(page.scrollTop).toBe(0);
    routes.enter('/a', { scrollers: { page, outline }, restore: true, title: 'A' });
    expect([page.scrollTop, outline.scrollTop]).toEqual([300, 80]);
  });

  test('forward to a page it has seen starts at the top; only back restores', () => {
    const routes = createRouteChanges({ announce: () => undefined });
    const page = pane();
    const leave = routes.enter('/a', { scrollers: { page }, title: 'A' });
    page.scrollTop = 300;
    leave();
    routes.enter('/a', { scrollers: { page }, restore: false, title: 'A' });
    expect(page.scrollTop).toBe(0);
  });

  test('scrolls the page to a hash, and leaves the other panes at the top', () => {
    const into = vi.fn();
    vi.stubGlobal('location', { hash: '#api%20docs' });
    vi.stubGlobal('document', {
      title: '',
      getElementById: (id: string) => (id === 'api docs' ? { scrollIntoView: into } : null),
    });
    const routes = createRouteChanges({ announce: () => undefined });
    const page = pane();
    const outline = pane();
    page.scrollTop = 40;
    outline.scrollTop = 40;
    routes.enter('/a', { scrollers: { page, outline } });
    expect(into).toHaveBeenCalledTimes(1);
    expect(page.scrollTop).toBe(40);
    expect(outline.scrollTop).toBe(0);
  });

  test('skips panes that are not there', () => {
    const routes = createRouteChanges({ announce: () => undefined });
    expect(() =>
      routes.enter('/a', { scrollers: { page: null, outline: undefined } })(),
    ).not.toThrow();
  });
});
