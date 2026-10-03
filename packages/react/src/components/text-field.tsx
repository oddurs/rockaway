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
import { Attr, Buffer, drawText, stringWidth, wrap } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { paintGlyph } from '../paint/cells.ts';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';
import { Description, FieldError, fieldClass, Label } from './field.tsx';
import { FieldFrame, fieldFrameBuffer } from './fieldset.tsx';
import { scrollbarBuffer } from './list.tsx';

const VARIANTS = {
  size: ['md', 'lg'],
} as const;

/** TextField's variants, as data. */
export const textFieldVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  size: 'md',
});

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
  readonly className?: string;
  readonly style?: CSSProperties;
}

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 3;

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
    const events = ['scroll', 'input', 'keyup', 'focus', 'select'] as const;
    for (const event of events) el.addEventListener(event, read, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      return () => {
        for (const event of events) el.removeEventListener(event, read);
      };
    }
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => {
      for (const event of events) el.removeEventListener(event, read);
      observer.disconnect();
    };
  }, [ref, read]);

  return { overflow, lines };
}

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The scrollbar of a box of rows, painted into its own cell column. */
function Scrollbar({
  total,
  visible,
  offset,
}: {
  total: number;
  visible: number;
  offset: number;
}): ReactNode {
  const host = useRef<HTMLSpanElement>(null);
  const glyphs = useGlyphs();
  useIsomorphicLayoutEffect(() => {
    const el = host.current;
    if (el) paintGlyph(scrollbarBuffer({ total, visible, offset }, glyphs), el);
  }, [total, visible, offset, glyphs]);
  return <span ref={host} aria-hidden="true" className="rk-text-field-scrollbar" />;
}

/** One row: the input between two cells that are delimiters, air or overflow marks. */
function Row({
  framed,
  readOnly,
  placeholder,
}: {
  readonly framed: boolean;
  readonly readOnly: boolean;
  readonly placeholder: string | undefined;
}): ReactNode {
  const glyphs = useGlyphs();
  const input = useRef<HTMLInputElement>(null);
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
        ref={input}
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
}: {
  readonly rows: number;
  readonly placeholder: string | undefined;
}): ReactNode {
  const area = useRef<HTMLTextAreaElement>(null);
  const { lines } = useCellScroll(area, 'y');
  const glyphs = useGlyphs();
  return (
    <>
      <span aria-hidden="true" className="rk-text-field-end">
        {glyphs.mark.blank}
      </span>
      <TextArea
        ref={area}
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
                  <Area rows={rows} placeholder={placeholder} />
                ) : (
                  <Row framed readOnly={isReadOnly} placeholder={placeholder} />
                )}
              </span>
            </FieldFrame>
          ) : (
            <>
              <Label isRequired={isRequired}>{label}</Label>
              <span className="rk-text-field-box">
                <Row framed={false} readOnly={isReadOnly} placeholder={placeholder} />
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

/** What a text field's box shows, for its text model. */
export interface TextFieldTextOptions {
  readonly cols?: number;
  readonly size?: TextFieldSize;
  readonly multiline?: boolean;
  readonly rows?: number;
  /** The value, or the placeholder (drawn dim) when there is none. */
  readonly value?: string;
  readonly placeholder?: string;
  /** Cells scrolled across (one row) or rows scrolled down (several). */
  readonly scroll?: number;
  /** The label, for a framed box's top edge. */
  readonly label?: string;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly focused?: boolean;
}

/**
 * A text field's box as cells: its text snapshot, and the control `formBuffer`
 * lays out beside a label. It follows `text-field.css` the way `buttonBuffer`
 * follows `button.css`. A `md` box is the delimiters around `cols` cells; a
 * framed one is `cols + 4` wide, the frame and a cell of air either side, and
 * three rows tall or `rows + 2`. Text hidden either way puts the theme's
 * overflow mark in the cell on that side.
 */
export function textFieldBuffer(
  options: TextFieldTextOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const cols = options.cols ?? DEFAULT_COLS;
  const multiline = options.multiline ?? false;
  const framed = multiline || options.size === 'lg';
  const rows = multiline ? (options.rows ?? DEFAULT_ROWS) : 1;
  const scroll = options.scroll ?? 0;
  const empty = (options.value ?? '') === '';
  const text = empty ? (options.placeholder ?? '') : (options.value ?? '');
  const style = {
    attrs: empty || options.disabled ? Attr.dim : Attr.none,
    ...(empty ? { fg: 'fg.muted' } : options.disabled ? { fg: 'fg.disabled' } : {}),
  };

  if (!framed) {
    const [open, close] = glyphs.delimiter.control;
    const plain = options.readOnly ?? false;
    const shown = text.slice(scroll, scroll + cols);
    const start = scroll > 0 ? glyphs.mark['overflow-start'] : plain ? ' ' : open;
    const end =
      stringWidth(text) - scroll > cols ? glyphs.mark['overflow-end'] : plain ? ' ' : close;
    return Buffer.create({ width: cols + 2, height: 1 }).draw((draft) => {
      drawText(draft, { x: 0, y: 0 }, start);
      drawText(draft, { x: 1, y: 0 }, shown, { style });
      drawText(draft, { x: cols + 1, y: 0 }, end);
    });
  }

  const frame = fieldFrameBuffer(
    { width: cols + 4, height: rows + 2 },
    {
      label: options.label ?? '',
      required: options.required ?? false,
      invalid: options.invalid ?? false,
      disabled: options.disabled ?? false,
      focused: options.focused ?? false,
    },
    glyphs,
  );
  if (!multiline) {
    const shown = text.slice(scroll, scroll + cols);
    return frame.draw((draft) => {
      if (scroll > 0) drawText(draft, { x: 1, y: 1 }, glyphs.mark['overflow-start']);
      drawText(draft, { x: 2, y: 1 }, shown, { style });
      if (stringWidth(text) - scroll > cols) {
        drawText(draft, { x: cols + 2, y: 1 }, glyphs.mark['overflow-end']);
      }
    });
  }
  const lines = wrap(text, cols);
  const bar = scrollbarBuffer(
    { total: Math.max(1, lines.length), visible: rows, offset: scroll },
    glyphs,
  );
  return frame.draw((draft) => {
    for (let y = 0; y < rows; y++) {
      drawText(draft, { x: 2, y: y + 1 }, lines[scroll + y] ?? '', { style });
      drawText(draft, { x: cols + 2, y: y + 1 }, bar.at({ x: 0, y })?.ch ?? ' ', {
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
  });
}
