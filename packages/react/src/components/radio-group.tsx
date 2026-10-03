'use client';

/**
 * `RadioGroup` and `Radio` (cairn 0038): one choice out of a few, all in view.
 *
 *   ┌ Branch* ──────────────────────┐      ┌ Branch ───────┐
 *   │ ● main  ○ develop  ○ release  │      │ ● main        │
 *   └───────────────────────────────┘      │ ○ develop     │
 *                                          └───────────────┘
 *
 * A radio is its mark cell, a cell of air, and its label. The mark is the
 * state (0118): the theme's filled radio when chosen, in `fg.accent`, and its
 * empty one when not, so an unchosen option is still a visible mark and
 * neither needs a colour to be told apart. Every radio has the cell in every
 * state, so nothing moves.
 *
 * The group is a `Fieldset` (0127): its label is set into the frame's top
 * edge, with the required mark after it, and the frame goes heavy when the
 * group is invalid. Horizontal options sit two cells apart and wrap to the
 * next row, whole radios at a time; vertical ones are a row each.
 *
 * States, none of which adds a cell:
 *
 *   - hover underlines the label; focus is the ring round the radio
 *   - pressed reverses the mark cell
 *   - disabled dims; invalid draws the marks in `fg.danger`, the error under
 *     the frame and the frame heavy
 *   - read-only is the value without the control: the chosen mark stays, the
 *     empty ones are left out, their cells kept
 *
 * Behaviour is React Aria's `RadioGroup`, `RadioField` and `RadioButton`:
 * arrows move and choose, and Tab enters and leaves the group as one stop.
 */
import { Attr, Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import type { ReactNode } from 'react';
import {
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  type RadioFieldProps as AriaRadioFieldProps,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import type { PainterName } from '../screen.tsx';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';
import { Description, FieldError, type FieldErrorProps, fieldClass } from './field.tsx';
import { fieldFrameBuffer } from './fieldset.pure.ts';
import { Fieldset } from './fieldset.tsx';

const VARIANTS = {
  orientation: ['vertical', 'horizontal'],
} as const;

/** RadioGroup's variants, as data. */
export const radioGroupVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  orientation: 'vertical',
});

export type RadioOrientation = VariantValue<typeof radioGroupVariants, 'orientation'>;

/** What a radio is showing, in the vocabulary's words (0118). */
export interface RadioState {
  /** `data-selected`: the filled mark, in `fg.accent`. */
  readonly selected?: boolean;
  /** `data-pressed`: the mark cell reversed. */
  readonly pressed?: boolean;
  /** `data-hovered`: the label underlined. */
  readonly hovered?: boolean;
  /** `data-disabled`: dim. */
  readonly disabled?: boolean;
  /** `data-invalid`: the mark in `fg.danger`. */
  readonly invalid?: boolean;
  /** `data-readonly`: only the chosen mark is drawn. */
  readonly readOnly?: boolean;
}

/** Cells between one horizontal option and the next. */
const GAP = 2;

/**
 * The radio's mark: filled when chosen, empty when not, and blank when
 * read-only and not chosen, because read-only draws the value without the
 * control. Always one cell.
 */
export function radioMark(
  state: Pick<RadioState, 'selected' | 'readOnly'>,
  glyphs: Glyphs = defaultGlyphs,
): string {
  if (state.selected) return glyphs.mark.radio;
  return state.readOnly ? glyphs.mark.blank : glyphs.mark['radio-empty'];
}

/** The mark cell's style: what `radio-group.css` draws for a state, as cell attributes. */
export function radioMarkStyle(state: RadioState): Style {
  let attrs = state.pressed ? Attr.reverse : Attr.none;
  if (state.disabled) attrs |= Attr.dim;
  const fg = state.disabled
    ? 'fg.disabled'
    : state.invalid
      ? 'fg.danger'
      : state.selected
        ? 'fg.accent'
        : 'fg.default';
  return { fg, attrs };
}

/**
 * One radio as cells: the mark, a cell of air, the label. Its text snapshot,
 * and what it occupies; the component writes the same cells.
 */
export function radioBuffer(
  label: string,
  state: RadioState = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const words: Style = {
    fg: state.disabled ? 'fg.disabled' : 'fg.default',
    attrs: (state.disabled ? Attr.dim : Attr.none) | (state.hovered ? Attr.underline : Attr.none),
  };
  return Buffer.create({ width: 2 + stringWidth(label), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, radioMark(state, glyphs), { style: radioMarkStyle(state) });
    drawText(draft, { x: 2, y: 0 }, label, { style: words });
  });
}

/** An option, as text. */
export interface RadioText extends RadioState {
  readonly label: string;
}

/** A radio group as text: what `radioGroupBuffer` lays out. */
export interface RadioGroupText {
  /** Set into the frame's top edge. */
  readonly label: string;
  readonly options: readonly RadioText[];
  readonly orientation?: RadioOrientation;
  /** The frame's width, in cells. */
  readonly width: number;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
}

/** Inside the frame: its border and the fieldset's cell of padding, each side. */
const INSET = { x: 2, y: 1 };

/** Where each option goes inside the frame, and how many rows they take. */
function layout(
  options: readonly RadioText[],
  orientation: RadioOrientation,
  room: number,
): { readonly at: readonly { x: number; y: number }[]; readonly rows: number } {
  const at: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  for (const option of options) {
    const width = 2 + stringWidth(option.label);
    if (orientation === 'vertical') {
      at.push({ x: 0, y: at.length });
      continue;
    }
    // A whole radio wraps, never part of one.
    if (x > 0 && x + width > room) {
      x = 0;
      y += 1;
    }
    at.push({ x, y });
    x += width + GAP;
  }
  const rows = orientation === 'vertical' ? options.length : y + 1;
  return { at, rows: Math.max(1, rows) };
}

/**
 * A radio group as cells: the fieldset's frame with the label in its edge,
 * and the radios inside, a row each or across. The group's text snapshot,
 * and its model: a story holds the page to it.
 */
export function radioGroupBuffer(group: RadioGroupText, glyphs: Glyphs = defaultGlyphs): Buffer {
  const orientation = radioGroupVariants.select({
    ...(group.orientation === undefined ? {} : { orientation: group.orientation }),
  }).orientation;
  const { at, rows } = layout(group.options, orientation, group.width - 2 * INSET.x);
  const frame = fieldFrameBuffer(
    { width: group.width, height: rows + 2 * INSET.y },
    {
      label: group.label,
      ...(group.required === undefined ? {} : { required: group.required }),
      ...(group.invalid === undefined ? {} : { invalid: group.invalid }),
      ...(group.disabled === undefined ? {} : { disabled: group.disabled }),
    },
    glyphs,
  );
  return frame.draw((draft) => {
    group.options.forEach((option, i) => {
      const place = at[i] ?? { x: 0, y: 0 };
      const state: RadioState = {
        ...option,
        disabled: Boolean(group.disabled || option.disabled),
        invalid: Boolean(group.invalid || option.invalid),
        readOnly: Boolean(group.readOnly || option.readOnly),
      };
      const radio = radioBuffer(option.label, state, glyphs);
      for (let x = 0; x < radio.width; x++) {
        const cell = radio.at({ x, y: 0 });
        if (cell) draft.set({ x: INSET.x + place.x + x, y: INSET.y + place.y }, cell);
      }
    });
  });
}

export interface RadioGroupProps
  extends VariantProps<typeof radioGroupVariants>,
    Omit<AriaRadioGroupProps, 'children' | 'className' | 'style' | 'orientation'> {
  /** Set into the frame's top edge, and the group's accessible name. */
  readonly label: string;
  /** The radios. */
  readonly children?: ReactNode;
  /** Help under the group, dim, linked to it by `aria-describedby`. */
  readonly description?: ReactNode;
  /** Words for the error under the group; the group's own validation's when not given. */
  readonly errorMessage?: FieldErrorProps['children'];
  /**
   * `vertical` puts a radio on each row; `horizontal` sets them across, two
   * cells apart, wrapping whole radios to the next row when they do not fit.
   * The arrow keys follow it.
   */
  readonly orientation?: RadioOrientation;
  /** How the frame's lines are stroked: weighted like the type, or hairlines. */
  readonly painter?: PainterName;
  readonly className?: string;
}

/**
 * One choice out of a few, all in view: `● main  ○ develop`. A fieldset
 * named by its label, with the radios inside it.
 */
export function RadioGroup({
  label,
  children,
  description,
  errorMessage,
  orientation,
  painter,
  className,
  ...aria
}: RadioGroupProps): ReactNode {
  const chosen = radioGroupVariants.select({
    ...(orientation === undefined ? {} : { orientation }),
  });
  return (
    <AriaRadioGroup
      {...aria}
      orientation={chosen.orientation}
      className={fieldClass('rk-radio-group', className)}
    >
      {({ isRequired }) => (
        <>
          <Fieldset
            legend={label}
            isRequired={isRequired}
            {...(painter === undefined ? {} : { painter })}
          >
            <div className="rk-radio-options" {...radioGroupVariants.dataAttributes(chosen)}>
              {children}
            </div>
          </Fieldset>
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </AriaRadioGroup>
  );
}

export interface RadioProps extends Omit<AriaRadioFieldProps, 'children' | 'className' | 'style'> {
  /** The label: the option's words, after its mark. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/** An option in a `RadioGroup`: its mark cell, a cell of air, and its words. */
export function Radio({ children, className, ...aria }: RadioProps): ReactNode {
  const glyphs = useGlyphs();
  return (
    <AriaRadioField {...aria} className={cx('rk-radio', className)}>
      <AriaRadioButton className="rk-radio-button">
        {({ isSelected, isReadOnly }) => (
          <>
            {/* Chrome: the name is the words alone. */}
            <span aria-hidden="true" className="rk-radio-indicator">
              <span className="rk-radio-mark">
                {radioMark({ selected: isSelected, readOnly: isReadOnly }, glyphs)}
              </span>{' '}
            </span>
            <span className="rk-radio-label">{children}</span>
          </>
        )}
      </AriaRadioButton>
    </AriaRadioField>
  );
}
