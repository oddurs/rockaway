'use client';

/**
 * `TextField` (cairn 0035): free text on one row, or several.
 *
 * The terminal form field, built from the field contract (0127). Its control
 * is a box exactly `cols` cells wide:
 *
 *   md          Name   [Ada Lovelace        ]
 *   lg          ┌ Name ──────────────────┐
 *               │ Ada Lovelace           │
 *               └────────────────────────┘
 *   multiline   the lg frame, `rows` tall, with a scrollbar column
 *
 * A `md` box is the control's delimiters around the input, on `bg.subtle`. A
 * `lg` or `multiline` box is a `FieldFrame`, with the label set into its top
 * edge. A box of several rows is always framed: delimiters bracket one row, and
 * a ground alone vanishes in forced colors.
 *
 * Text longer than the box scrolls inside it and the box never grows. It
 * scrolls by whole cells, and the cells either side of the text say there is
 * more: the theme's `‹` and `›` take the place of the delimiters (or of the
 * frame's air) while text is hidden that way (0207: no native scrollbar,
 * position shown in cells). A multiline box scrolls by whole rows, and its
 * scrollbar is drawn in a cell column, as List's is.
 *
 * States are 0118's and none moves a cell: placeholder dims, read-only drops
 * the ground and the delimiters (the value alone), disabled dims, invalid
 * colours the delimiters (or makes the frame heavy) and puts the error under
 * the box. Behaviour is React Aria's `TextField`, `Input` and `TextArea`; the
 * keyboard is the platform's own.
 */
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  Input,
  TextArea,
  type ValidationResult,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Cells } from '../paint/render.tsx';
import { useBothRefs } from '../refs.ts';
import type { VariantProps, VariantValue } from '../variants.ts';
import { Description, FieldError, fieldClass, Label } from './field.tsx';
import { FieldFrame } from './fieldset.tsx';
import { scrollbarBuffer } from './list.pure.ts';
import { DEFAULT_COLS, DEFAULT_ROWS, textFieldVariants } from './text-field.pure.ts';

export type TextFieldSize = VariantValue<typeof textFieldVariants, 'size'>;

export interface TextFieldProps
  extends VariantProps<typeof textFieldVariants>,
    Omit<AriaTextFieldProps, 'children' | 'className' | 'style'> {
  /** The field's name: inline before a `md` box, in the top edge of a framed one. */
  readonly label: string;
  /** Help, dim, under the box. */
  readonly description?: ReactNode;
  /** Words for the error; the field's own validation messages when not given. */
  readonly errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  readonly placeholder?: string;
  /** The box's width, in cells: the text it shows at once. */
  readonly cols?: number;
  /** `md` is one row between the delimiters; `lg` is three, framed, the label in the edge. */
  readonly size?: TextFieldSize;
  /** Several rows, framed, scrolling by whole rows. */
  readonly multiline?: boolean;
  /** How many rows a `multiline` box shows. */
  readonly rows?: number;
  /**
   * The text box itself, `<input>` or, `multiline`, `<textarea>`: for an app
   * to focus it, select its text or read its caret. An object or a callback;
   * the field keeps its own beside it. `ref` is the field around it.
   */
  readonly inputRef?: Ref<HTMLInputElement | HTMLTextAreaElement>;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** What the cells either side of the text show: more that way, or nothing. */
interface Overflow {
  readonly start: boolean;
  readonly end: boolean;
}

/**
 * Keep a box's text on whole cells, and say which way there is more of it.
 *
 * The browser scrolls a field by pixels, to wherever the caret needs. This
 * rounds what it chose to a whole cell, across for a row and down for a box of
 * rows, unless the browser is at an end: there the end is the cell boundary
 * that matters, and rounding would only fight the caret. It is scrolling, not
 * focus or keys: the platform still owns both.
 */
function useCellScroll(
  ref: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  axis: 'x' | 'y',
): { overflow: Overflow; lines: { total: number; offset: number } } {
  const [overflow, setOverflow] = useState<Overflow>({ start: false, end: false });
  const [lines, setLines] = useState({ total: 0, offset: 0 });

  const read = useCallback(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const cell = measureCell(host);
    const size = axis === 'x' ? cell.width : cell.height;
    const at = axis === 'x' ? el.scrollLeft : el.scrollTop;
    const max = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    if (at > 0.5 && at < max - 0.5) {
      const whole = Math.round(at / size) * size;
      if (Math.abs(whole - at) > 0.5) {
        if (axis === 'x') el.scrollLeft = whole;
        else el.scrollTop = whole;
      }
    }
    const now = axis === 'x' ? el.scrollLeft : el.scrollTop;
    setOverflow({ start: now > 0.5, end: now < max - 0.5 });
    if (axis === 'y') {
      setLines({
        total: Math.max(1, Math.round(el.scrollHeight / size)),
        offset: Math.round(now / size),
      });
    }
  }, [ref, axis]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    read();
    // After the event, never during it. These listeners are on the field
    // itself, so they run before React's, which wait at the root; a state
    // change here re-renders in between, React puts the controlled value back,
    // and its own handler then sees no change and never calls onChange. A
    // reader's real keys show it; a script's synthetic ones do not (0035).
    let frame = 0;
    const later = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    const events = ['scroll', 'input', 'keyup', 'focus', 'select'] as const;
    for (const event of events) el.addEventListener(event, later, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(read);
    observer?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      for (const event of events) el.removeEventListener(event, later);
      observer?.disconnect();
    };
  }, [ref, read]);

  return { overflow, lines };
}

/** The scrollbar of a box of rows: rendered chrome in its own cell column, as List's is. */
function Scrollbar({
  total,
  visible,
  offset,
}: {
  readonly total: number;
  readonly visible: number;
  readonly offset: number;
}): ReactNode {
  const glyphs = useGlyphs();
  const buffer = useMemo(
    () => scrollbarBuffer({ total, visible, offset }, glyphs),
    [total, visible, offset, glyphs],
  );
  return <Cells buffer={buffer} className="rk-text-field-scrollbar" />;
}

/** One row: the input between two cells that are delimiters, air or overflow marks. */
function Row({
  framed,
  readOnly,
  placeholder,
  inputRef,
}: {
  readonly framed: boolean;
  readonly readOnly: boolean;
  readonly placeholder: string | undefined;
  readonly inputRef: Ref<HTMLInputElement | HTMLTextAreaElement> | undefined;
}): ReactNode {
  const glyphs = useGlyphs();
  const input = useRef<HTMLInputElement>(null);
  const refs = useBothRefs<HTMLInputElement, HTMLInputElement | HTMLTextAreaElement>(
    input,
    inputRef,
  );
  const { overflow } = useCellScroll(input, 'x');
  const [open, close] = glyphs.delimiter.control;
  // Framed, the frame is the boundary and the cells are air; read-only, the
  // value stands alone. Either way the cells stay, for the overflow marks.
  const plain = framed || readOnly;
  return (
    <>
      <span aria-hidden="true" className="rk-text-field-end">
        {overflow.start ? glyphs.mark['overflow-start'] : plain ? glyphs.mark.blank : open}
      </span>
      <Input
        ref={refs}
        // Scrolls across: no bar of the browser's (0207); the overflow marks show where.
        className="rk-scroll rk-text-field-input"
        {...(placeholder === undefined ? {} : { placeholder })}
      />
      <span aria-hidden="true" className="rk-text-field-end">
        {overflow.end ? glyphs.mark['overflow-end'] : plain ? glyphs.mark.blank : close}
      </span>
    </>
  );
}

/** A box of rows: the text area, then its scrollbar column. */
function Area({
  rows,
  placeholder,
  inputRef,
}: {
  readonly rows: number;
  readonly placeholder: string | undefined;
  readonly inputRef: Ref<HTMLInputElement | HTMLTextAreaElement> | undefined;
}): ReactNode {
  const area = useRef<HTMLTextAreaElement>(null);
  const refs = useBothRefs<HTMLTextAreaElement, HTMLInputElement | HTMLTextAreaElement>(
    area,
    inputRef,
  );
  const { lines } = useCellScroll(area, 'y');
  const glyphs = useGlyphs();
  return (
    <>
      <span aria-hidden="true" className="rk-text-field-end">
        {glyphs.mark.blank}
      </span>
      <TextArea
        ref={refs}
        rows={rows}
        // Scrolls down: no bar of the browser's (0207); the scrollbar column shows where.
        className="rk-scroll rk-text-field-area"
        {...(placeholder === undefined ? {} : { placeholder })}
      />
      <Scrollbar total={lines.total} visible={rows} offset={lines.offset} />
    </>
  );
}

export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  cols = DEFAULT_COLS,
  size,
  multiline = false,
  rows = DEFAULT_ROWS,
  inputRef,
  className,
  style,
  ...aria
}: TextFieldProps): ReactNode {
  const chosen = textFieldVariants.select({ size });
  const framed = multiline || chosen.size === 'lg';
  const vars = {
    '--rk-text-field-cols': cols,
    '--rk-text-field-rows': multiline ? rows : 1,
    ...style,
  } as CSSProperties;
  return (
    <AriaTextField
      {...aria}
      className={fieldClass('rk-text-field', className)}
      style={vars}
      {...textFieldVariants.dataAttributes(chosen)}
    >
      {({ isRequired, isInvalid, isDisabled, isReadOnly }) => (
        <>
          {framed ? (
            <FieldFrame
              label={label}
              isRequired={isRequired}
              isInvalid={isInvalid}
              isDisabled={isDisabled}
              pad={0}
              className="rk-text-field-frame"
            >
              <span className="rk-text-field-box">
                {multiline ? (
                  <Area rows={rows} placeholder={placeholder} inputRef={inputRef} />
                ) : (
                  <Row framed readOnly={isReadOnly} placeholder={placeholder} inputRef={inputRef} />
                )}
              </span>
            </FieldFrame>
          ) : (
            <>
              <Label isRequired={isRequired}>{label}</Label>
              <span className="rk-text-field-box">
                <Row
                  framed={false}
                  readOnly={isReadOnly}
                  placeholder={placeholder}
                  inputRef={inputRef}
                />
              </span>
            </>
          )}
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </AriaTextField>
  );
}
