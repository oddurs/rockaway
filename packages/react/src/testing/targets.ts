/**
 * Target size (cairn 0125; WCAG 2.2, 2.5.8).
 *
 * Rule 8 of the contract: operable by keyboard alone, and usable with a
 * finger at touch density. Density is the line box, so a one-row control is
 * exactly as tall as a cell: 16px at `dense` with a 16px font, 32px at
 * `touch`. Whether that is big enough is a measurement, not a claim, and this
 * makes it.
 *
 * Every visible target has to pass WCAG 2.5.8 (AA): at least 24 by 24 CSS
 * pixels, or — the spacing exception — a 24px circle centred on it intersects
 * no other target and no other undersized target's circle. A link inside a
 * sentence is exempt, as WCAG exempts it, because its height is the line's.
 *
 * Optionally, every target has to be at least `minHeight` tall as well: the
 * README's claim that touch density puts a one-row control at about 44px is
 * checked by asking for 44 at `touch`.
 */

export interface TargetFailure {
  /** The target itself, so a caller can ask what context it is in. */
  readonly target: HTMLElement;
  readonly element: string;
  readonly width: number;
  readonly height: number;
  /** What it failed: the 24px rule with no room around it, or the height asked for. */
  readonly rule: 'size' | 'height';
  /** For `size`: the target its 24px circle runs into. */
  readonly crowdedBy?: string;
}

export interface TargetReport {
  readonly targets: number;
  readonly failures: readonly TargetFailure[];
}

export interface TargetOptions {
  /** The WCAG 2.5.8 minimum, in CSS pixels. Default 24. */
  readonly minimum?: number;
  /** Also require every target to be at least this tall, in CSS pixels. */
  readonly minHeight?: number;
}

/** What a pointer can activate. A container that is only focusable is not a target. */
const TARGETS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  ...[
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'slider',
    'spinbutton',
    'combobox',
  ].map((role) => `[role="${role}"]`),
].join(', ');

function describe(el: Element): string {
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).join('.')}`
      : '';
  const testId = (el as HTMLElement).dataset?.testid;
  const name = el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 24) ?? '';
  return `${el.tagName.toLowerCase()}${id}${cls}${testId ? `[${testId}]` : ''}${name ? ` "${name}"` : ''}`;
}

function isHidden(el: HTMLElement, style: CSSStyleDeclaration): boolean {
  return (
    style.visibility === 'hidden' ||
    style.display === 'none' ||
    style.clipPath.startsWith('inset(50%') ||
    style.clip === 'rect(0px, 0px, 0px, 0px)' ||
    el.closest('[aria-hidden="true"], [inert]') !== null
  );
}

/** The sr-only technique, in either of its forms, as `conformance.ts` reads it. */
function isClipped(style: CSSStyleDeclaration): boolean {
  return style.clipPath.startsWith('inset(50%') || style.clip === 'rect(0px, 0px, 0px, 0px)';
}

/**
 * What a pointer actually hits for this element. A checkbox, radio or switch
 * drawn by its label keeps the native input inside a visually hidden span:
 * its own box is a 13px square nobody can see or press, and the target is the
 * label around it, which is what a reader sees and what toggles the control.
 * An input hidden that way with no label is no target at all.
 */
function pointerTarget(el: HTMLElement, view: Window | null): HTMLElement | undefined {
  if (el.tagName !== 'INPUT') return el;
  for (let up = el.parentElement; up; up = up.parentElement) {
    const style = view?.getComputedStyle(up);
    if (style && isClipped(style)) {
      return el.closest('label') ?? (el as HTMLInputElement).labels?.[0] ?? undefined;
    }
  }
  return el;
}

function isDisabled(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled === true || el.ariaDisabled === 'true';
}

/**
 * A link in running text: inline, in a block that holds text of its own. Its
 * height is the line's, and WCAG exempts it rather than ask a sentence to
 * grow.
 */
function isInSentence(el: HTMLElement, style: CSSStyleDeclaration): boolean {
  if (style.display !== 'inline') return false;
  const block = el.parentElement;
  if (!block) return false;
  const own = el.textContent ?? '';
  return (block.textContent ?? '').trim().length > own.trim().length;
}

interface Target {
  readonly el: HTMLElement;
  readonly box: DOMRect;
  readonly undersized: boolean;
}

const centre = (box: DOMRect) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

/** How far a point is from a box: zero inside it. */
function distanceToBox(p: { x: number; y: number }, box: DOMRect): number {
  const dx = Math.max(box.left - p.x, 0, p.x - box.right);
  const dy = Math.max(box.top - p.y, 0, p.y - box.bottom);
  return Math.hypot(dx, dy);
}

/** Check every target under `root`. */
export function checkTargets(root: HTMLElement, options: TargetOptions = {}): TargetReport {
  const minimum = options.minimum ?? 24;
  const view = root.ownerDocument.defaultView;
  const targets: Target[] = [];

  const seen = new Set<HTMLElement>();
  for (const control of root.querySelectorAll<HTMLElement>(TARGETS)) {
    if (isDisabled(control)) continue;
    const el = pointerTarget(control, view);
    if (el === undefined || seen.has(el)) continue;
    seen.add(el);
    const style = view?.getComputedStyle(el);
    if (!style || isHidden(el, style)) continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    if (isInSentence(el, style)) continue;
    // Half a pixel of rounding is not a failure.
    const undersized = box.width + 0.5 < minimum || box.height + 0.5 < minimum;
    targets.push({ el, box, undersized });
  }

  const failures: TargetFailure[] = [];
  const radius = minimum / 2;
  for (const target of targets) {
    const { el, box } = target;
    const size = { target: el, element: describe(el), width: box.width, height: box.height };
    if (options.minHeight !== undefined && box.height + 0.5 < options.minHeight) {
      failures.push({ ...size, rule: 'height' });
    }
    if (!target.undersized) continue;
    // The spacing exception: an undersized target passes if its circle
    // touches no other target, and no other undersized target's circle. A
    // target inside another (an option in a list box) is not crowding it.
    const c = centre(box);
    const crowd = targets.find((other) => {
      if (other === target || other.el.contains(el) || el.contains(other.el)) return false;
      if (distanceToBox(c, other.box) < radius - 0.5) return true;
      if (!other.undersized) return false;
      const o = centre(other.box);
      return Math.hypot(c.x - o.x, c.y - o.y) < minimum - 0.5;
    });
    if (crowd) failures.push({ ...size, rule: 'size', crowdedBy: describe(crowd.el) });
  }

  return { targets: targets.length, failures };
}

export function formatTargets(report: TargetReport, options: TargetOptions = {}): string {
  const minimum = options.minimum ?? 24;
  const lines = [`${report.targets} target(s)`];
  for (const f of report.failures) {
    const size = `${f.width.toFixed(1)}×${f.height.toFixed(1)}px`;
    lines.push(
      f.rule === 'height'
        ? `  ${f.element}  ${size}, shorter than ${options.minHeight}px`
        : `  ${f.element}  ${size}, under ${minimum}px with ${f.crowdedBy} inside its ${minimum}px circle`,
    );
  }
  return lines.join('\n');
}

/** Throws with the report when any target is too small. */
export function expectTargets(root: HTMLElement, options?: TargetOptions): TargetReport {
  const report = checkTargets(root, options);
  if (report.failures.length > 0) {
    throw new Error(`targets too small\n${formatTargets(report, options)}`);
  }
  return report;
}
