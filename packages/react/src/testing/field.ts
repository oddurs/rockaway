/**
 * The field contract, checked (cairn 0203, 0127).
 *
 * A field's parts are React Aria's semantics placed on the grid, and React
 * Aria does most of the wiring. One thing it cannot do: it puts `required` in
 * no context a label can read, so a field author passes `isRequired` to
 * `Label` (or to `Fieldset`) by hand, and forgetting it draws a required
 * field with no mark. This reads a rendered field back and says so, with the
 * rest of what the contract promises a reader:
 *
 *   - the required mark is drawn exactly when the field is required, and is
 *     hidden from the reader, who hears `aria-required` instead
 *   - the description and the error are in the control's `aria-describedby`
 *   - no accessible name holds a glyph: the mark, the cross, the delimiters,
 *     the frame are all chrome
 *   - nothing is a live region: a failed submit moves focus to the field, and
 *     the error is heard there once; a live region would say it twice
 *
 * It reads the DOM only, so it runs wherever a field is rendered.
 */
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { glyphTest, spoken } from './names.ts';

export interface FieldProblem {
  /** The field, as a selector-ish description: `div.rk-field[Email]`. */
  readonly field: string;
  readonly problem: string;
}

export interface FieldReport {
  /** Fields found and checked. */
  readonly fields: number;
  readonly problems: readonly FieldProblem[];
}

export interface FieldOptions {
  /**
   * The theme's glyphs, for the required mark drawn in a frame's edge and the
   * marks a name must not hold. The default theme's when not given.
   */
  readonly glyphs?: Glyphs;
}

const LIVE = '[aria-live]:not([aria-live="off"]), [role="alert"], [role="status"], [role="log"]';

/** A control a label can name. */
const CONTROLS =
  'input:not([type="hidden"]), textarea, select, [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], [role="textbox"], [role="spinbutton"], [role="slider"], [role="group"], [role="radiogroup"], [role="listbox"], button';

function describe(field: Element, label: string | undefined): string {
  const cls =
    typeof field.className === 'string' && field.className
      ? `.${field.className.trim().split(/\s+/).join('.')}`
      : '';
  return `${field.tagName.toLowerCase()}${cls}${label ? `[${label}]` : ''}`;
}

/** A control's accessible name, by the routes a field gives it one. */
function nameOf(control: Element): string {
  const doc = control.ownerDocument;
  const ids = control.getAttribute('aria-labelledby');
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => {
        const el = doc.getElementById(id);
        return el ? spoken(el) : '';
      })
      .join(' ')
      .trim();
  }
  const label = control.getAttribute('aria-label');
  if (label) return label.trim();
  const labels = (control as HTMLInputElement).labels;
  if (labels && labels.length > 0) {
    return [...labels]
      .map((l) => spoken(l))
      .join(' ')
      .trim();
  }
  return '';
}

/** Is this the field's own, rather than a field nested inside it? */
function own(field: Element, el: Element): boolean {
  return el.closest('.rk-field') === field || el === field;
}

function checkOne(field: HTMLElement, glyphs: Glyphs): FieldProblem[] {
  const problems: string[] = [];
  // A label is a word or two, never prose: every mark is chrome in it.
  const isGlyph = glyphTest(glyphs, true);

  // The label: inline, or the hidden one a frame carries for its edge.
  const label =
    [...field.querySelectorAll<HTMLElement>('.rk-label, .rk-field-frame-label')].find((el) =>
      own(field, el),
    ) ?? null;
  const edge = label?.classList.contains('rk-field-frame-label') ?? false;
  const words = label ? spoken(label).trim() : undefined;

  // The controls: what the label names, or, with no label, what the field holds.
  const candidates = [field, ...field.querySelectorAll<HTMLElement>(CONTROLS)].filter(
    (el) => own(field, el) && el.closest('template') === null,
  );
  const controls = label
    ? candidates.filter(
        (el) =>
          (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).includes(label.id) ||
          [...((el as HTMLInputElement).labels ?? [])].includes(label as HTMLLabelElement),
      )
    : candidates.filter((el) => el !== field);
  if (label && controls.length === 0) {
    problems.push(`its label "${words}" names no control`);
  }

  // Required: the mark is drawn exactly when the field is required.
  const required =
    field.dataset.required !== undefined ||
    controls.some(
      (c) => c.getAttribute('aria-required') === 'true' || (c as HTMLInputElement).required,
    );
  // A field inside another (a checkbox in a group) leaves the mark to the
  // group: its legend says the group is required, once.
  const grouped = (field.parentElement?.closest('.rk-field') ?? null) !== null;
  // The mark's cell: the label's, or, for a control that carries its own
  // words (a checkbox), the one after those words.
  const ownMark = label
    ? null
    : ([...field.querySelectorAll('.rk-label-mark')].find((el) => own(field, el)) ?? null);
  if ((label && !edge) || (ownMark && !grouped)) {
    const mark = label ? label.querySelector('.rk-label-mark') : ownMark;
    if (!mark) {
      problems.push('its label has no cell for the required mark');
    } else {
      const drawn = (mark.textContent ?? '').trim() !== '';
      if (mark.getAttribute('aria-hidden') !== 'true') {
        problems.push('its required mark is not aria-hidden');
      }
      if (required && !drawn) {
        problems.push(
          label
            ? 'it is required and its label draws no mark: pass the field’s isRequired to Label'
            : 'it is required and draws no mark after its words',
        );
      }
      if (!required && drawn) {
        problems.push('its label draws the required mark, and the field is not required');
      }
    }
  }
  if (label && edge) {
    // The frame draws the mark in its edge, straight after the words.
    const frame = label.closest('.rk-field-frame');
    const top = frame?.querySelector('.rk-frame .rk-row')?.textContent ?? '';
    const drawn = words !== undefined && top.includes(`${words}${glyphs.mark.required}`);
    if (top !== '' && required && !drawn) {
      problems.push(
        'it is required and its frame draws no mark after the label: pass isRequired to FieldFrame or Fieldset',
      );
    }
    if (top !== '' && !required && drawn) {
      problems.push('its frame draws the required mark, and the field is not required');
    }
  }

  // Description and error: in the control's description, by id.
  const described = new Set(
    controls.flatMap((c) => (c.getAttribute('aria-describedby') ?? '').split(/\s+/)),
  );
  for (const [part, name] of [
    ['.rk-description', 'description'],
    ['.rk-field-error', 'error'],
  ] as const) {
    for (const el of field.querySelectorAll<HTMLElement>(part)) {
      if (!own(field, el)) continue;
      if (el.id === '' || !described.has(el.id)) {
        problems.push(`its ${name} "${spoken(el).trim()}" is in no control's aria-describedby`);
      }
    }
  }
  for (const el of field.querySelectorAll('.rk-field-error-mark')) {
    if (own(field, el) && el.getAttribute('aria-hidden') !== 'true') {
      problems.push('its error mark is not aria-hidden');
    }
  }

  // Names: words, never glyphs.
  for (const control of controls) {
    const name = nameOf(control);
    const found = [...name].filter(isGlyph);
    if (found.length > 0) {
      problems.push(`the name "${name}" holds ${found.join('')}, which is chrome`);
    }
  }

  // No live region: focus carries the error to the reader.
  const live = [...field.querySelectorAll(LIVE)].filter((el) => own(field, el));
  if (field.matches(LIVE)) live.push(field);
  for (const el of live) {
    problems.push(
      `${describe(el, undefined)} is a live region: a failed submit moves focus here, and the error would be said twice`,
    );
  }

  return problems.map((problem) => ({ field: describe(field, words), problem }));
}

/** Check every field under `root`, or `root` itself if it is one. */
export function checkField(root: HTMLElement, options: FieldOptions = {}): FieldReport {
  const glyphs = options.glyphs ?? themeGlyphs.default;
  const fields = [
    ...(root.classList?.contains('rk-field') ? [root] : []),
    ...root.querySelectorAll<HTMLElement>('.rk-field'),
  ].filter((field) => field.closest('template') === null);
  return { fields: fields.length, problems: fields.flatMap((f) => checkOne(f, glyphs)) };
}

/** The report as text, one line per problem. */
export function formatFields(report: FieldReport): string {
  const lines = [`${report.fields} field(s)`];
  if (report.problems.length > 0) {
    lines.push('', `${report.problems.length} problem(s):`);
    for (const p of report.problems) lines.push(`  ${p.field}  ${p.problem}`);
  }
  return lines.join('\n');
}

/** Throws with the report when any field breaks the contract. */
export function expectField(root: HTMLElement, options?: FieldOptions): FieldReport {
  const report = checkField(root, options);
  if (report.problems.length > 0) {
    throw new Error(`the field contract is broken\n${formatFields(report)}`);
  }
  return report;
}
