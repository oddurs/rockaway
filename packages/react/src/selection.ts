/**
 * Selection as a terminal draws it (cairn 0299).
 *
 * A browser paints `::selection` on each line's text, as tall as the font: in
 * a line box taller than that, which is every density but dense, a selection
 * of several lines is striped, and Firefox and WebKit stripe even the rows of
 * a painted screen. A terminal selects whole cells, a whole row tall, and
 * nothing between two rows is left out.
 *
 * So this paints the selection itself. For each line the selection crosses,
 * one box: from the first selected cell to the last, a full row tall, laid
 * over the text in the theme's selection colour and blended into it, so the
 * ground takes the colour and the text keeps its own. The browser's own
 * highlight is made transparent while this runs (`base.css`), and is still
 * the selection: what is copied, and what a screen reader hears, are the
 * browser's, unchanged.
 *
 * An enhancement, as `watchOverflowMarks` is: with no script the browser's own
 * highlight shows. Under forced colours it does nothing, and the reader's
 * Highlight and HighlightText draw the selection.
 *
 * No React here: a page of prose with no components calls it as well.
 */

interface Line {
  top: number;
  height: number;
  left: number;
  right: number;
}

/** A length in pixels read off a custom property, when it is one. */
function pixels(style: CSSStyleDeclaration, name: string): number | undefined {
  const value = /^\s*(\d+(?:\.\d+)?)px\s*$/.exec(style.getPropertyValue(name))?.[1];
  return value === undefined ? undefined : Number(value);
}

/** The width of one character of `el`'s font, measured once and remembered. */
function measure(el: HTMLElement, known: WeakMap<Element, number>): number {
  const cached = known.get(el);
  if (cached !== undefined) return cached;
  const probe = el.ownerDocument.createElement('span');
  probe.textContent = '0'.repeat(50);
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;pointer-events:none';
  el.append(probe);
  const width = probe.getBoundingClientRect().width / 50;
  probe.remove();
  known.set(el, width);
  return width;
}

/**
 * The grid a piece of selected text sits on: the cell's width and height, and
 * where the cells start across. A screen says its own cell; anywhere else, the
 * text's font and line height make one, from the left of the block it is in.
 */
function gridOf(
  node: Text,
  widths: WeakMap<Element, number>,
): { width: number; height: number; origin: number } | undefined {
  const parent = node.parentElement;
  if (!parent) return undefined;
  const view = parent.ownerDocument.defaultView;
  if (!view) return undefined;
  const screen = parent.closest<HTMLElement>('.rk-screen');
  if (screen) {
    const style = view.getComputedStyle(screen);
    const width = pixels(style, '--rk-cell-width') ?? measure(screen, widths);
    const height =
      pixels(style, '--rk-cell-height') ??
      Number.parseFloat(view.getComputedStyle(parent).lineHeight);
    return { width, height, origin: screen.getBoundingClientRect().left + screen.clientLeft };
  }
  let block: HTMLElement = parent;
  while (block.parentElement && view.getComputedStyle(block).display.startsWith('inline')) {
    block = block.parentElement;
  }
  const height = Number.parseFloat(view.getComputedStyle(parent).lineHeight);
  const box = block.getBoundingClientRect();
  const style = view.getComputedStyle(block);
  return {
    width: measure(block, widths),
    height: Number.isFinite(height) ? height : 0,
    origin: box.left + block.clientLeft + Number.parseFloat(style.paddingLeft || '0'),
  };
}

/** Every text node a range touches, in order. */
function textIn(range: Range): Text[] {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) return [root as Text];
  const walker = root.ownerDocument?.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let node = walker?.nextNode(); node; node = walker?.nextNode()) {
    if (range.intersectsNode(node)) found.push(node as Text);
  }
  return found;
}

/**
 * The lines a selection crosses, each as whole cells a full row tall, in
 * viewport coordinates. Pure but for the layout it reads: exported so a test
 * can hold the boxes to the grid.
 */
export function selectionLines(selection: Selection): Line[] {
  const widths = new WeakMap<Element, number>();
  const lines = new Map<string, Line>();
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    for (const node of textIn(range)) {
      const grid = gridOf(node, widths);
      if (!grid || grid.width <= 0) continue;
      const part = node.ownerDocument.createRange();
      part.selectNodeContents(node);
      if (node === range.startContainer) part.setStart(node, range.startOffset);
      if (node === range.endContainer) part.setEnd(node, range.endOffset);
      for (const rect of part.getClientRects()) {
        if (rect.width === 0) continue;
        // The row the text is in: centred on the text, as the line box is,
        // and as tall as the row, or the text where that is taller.
        const height = Math.max(grid.height, rect.height);
        const top = rect.top + rect.height / 2 - height / 2;
        // Whole cells across: the cell a glyph starts in to the cell it ends in.
        const from = Math.floor((rect.left - grid.origin) / grid.width + 0.02);
        const to = Math.ceil((rect.right - grid.origin) / grid.width - 0.02);
        const left = grid.origin + from * grid.width;
        const right = grid.origin + to * grid.width;
        const key = `${Math.round(top)}:${Math.round(grid.origin)}`;
        const line = lines.get(key);
        if (line) {
          line.left = Math.min(line.left, left);
          line.right = Math.max(line.right, right);
        } else {
          lines.set(key, { top, height, left, right });
        }
      }
    }
  }
  return [...lines.values()];
}

/** The relative luminance of a CSS colour, by letting a canvas resolve it. */
function luminance(colour: string, doc: Document): number {
  const canvas = doc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The selection colour and the page's ground, resolved. */
function resolve(doc: Document, value: string): string {
  const probe = doc.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  doc.body.append(probe);
  const colour = doc.defaultView?.getComputedStyle(probe).color ?? value;
  probe.remove();
  return colour;
}

/**
 * Paint the selection in `doc` as whole cells a full row tall, while it
 * changes and while what it covers moves. Returns a function that stops it.
 */
export function watchSelection(doc: Document = document): () => void {
  const view = doc.defaultView;
  if (!view || view.matchMedia('(forced-colors: active)').matches) return () => {};

  const layer = doc.createElement('div');
  layer.className = 'rk-selection';
  layer.setAttribute('aria-hidden', 'true');
  doc.body.append(layer);
  doc.documentElement.setAttribute('data-rk-selection', '');

  const paint = (): void => {
    const selection = view.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      layer.replaceChildren();
      return;
    }
    // Over a light ground the colour darkens what is under it, over a dark
    // one it lightens: either way the ground becomes the selection colour
    // and the text keeps its own.
    const colour = resolve(doc, 'var(--rk-ansi-selection)');
    const ground = view.getComputedStyle(doc.body).backgroundColor;
    const blend = luminance(colour, doc) <= luminance(ground, doc) ? 'multiply' : 'screen';
    const origin = layer.getBoundingClientRect();
    const boxes = selectionLines(selection).map((line) => {
      const box = doc.createElement('div');
      box.className = 'rk-selection-row';
      box.style.cssText = [
        `left:${line.left - origin.left}px`,
        `top:${line.top - origin.top}px`,
        `width:${line.right - line.left}px`,
        `height:${line.height}px`,
        `mix-blend-mode:${blend}`,
      ].join(';');
      return box;
    });
    layer.replaceChildren(...boxes);
  };

  let frame = 0;
  const soon = (): void => {
    if (frame) return;
    frame = view.requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  doc.addEventListener('selectionchange', soon);
  // Text that scrolls inside a region moves under a selection; so does a page
  // that changes size or density.
  doc.addEventListener('scroll', soon, { capture: true, passive: true });
  view.addEventListener('resize', soon);
  const resized = new ResizeObserver(soon);
  resized.observe(doc.body);
  paint();

  return () => {
    doc.removeEventListener('selectionchange', soon);
    doc.removeEventListener('scroll', soon, { capture: true });
    view.removeEventListener('resize', soon);
    resized.disconnect();
    if (frame) view.cancelAnimationFrame(frame);
    layer.remove();
    doc.documentElement.removeAttribute('data-rk-selection');
  };
}
