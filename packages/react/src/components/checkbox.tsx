'use client';

/**
 * `Checkbox` and `CheckboxGroup` (cairn 0036): yes or no, one at a time or
 * several in a group.
 *
 *   [✓] Sign commits
 *   [ ] Push tags
 *   [–] Every branch
 *
 * A row is the control's delimiters around one reserved mark cell, a cell of
 * air, the words, and the cell after them that a required mark takes, drawn
 * or not. The mark cell holds the theme's check, its dash for indeterminate,
 * or a blank: the three states differ in a glyph, so they read in text, in
 * greyscale and in forced colors alike (0118's checked row). The whole row is
 * the label React Aria wraps the native checkbox in, so pressing anywhere on
 * it toggles it.
 *
 * States are 0118's and none moves a cell: hover underlines the words,
 * pressed reverses the box, focus is the ring around the row, disabled dims,
 * read-only drops the delimiters for the mark alone, invalid puts the
 * delimiters in `border.danger` and the error under the row.
 *
 * A group is a `Fieldset` inside React Aria's `CheckboxGroup`: its label set
 * into the frame's top edge, one row per checkbox inside it.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { type CSSProperties, type ReactNode, useContext } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  CheckboxButton,
  CheckboxField,
  type CheckboxFieldProps,
  CheckboxGroupStateContext,
  type ValidationResult,
} from 'react-aria-components';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { Description, FieldError, fieldClass } from './field.tsx';
import { Fieldset } from './fieldset.tsx';

/** What the mark cell shows. */
export type CheckboxMark = 'checked' | 'unchecked' | 'indeterminate';

export interface CheckboxProps
  extends Omit<CheckboxFieldProps, 'children' | 'className' | 'style'> {
  /** The words after the box: the checkbox's name. */
  readonly children?: ReactNode;
  /** Help, dim, under the row. */
  readonly description?: ReactNode;
  /** Words for the error; the field's own validation messages when not given. */
  readonly errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  readonly className?: string;
  readonly style?: CSSProperties;
}

/** The glyph in the mark cell for a state. */
function markOf(mark: CheckboxMark, glyphs: Glyphs): string {
  return mark === 'checked'
    ? glyphs.mark.check
    : mark === 'indeterminate'
      ? glyphs.mark.dash
      : glyphs.mark.blank;
}

export function Checkbox({
  children,
  description,
  errorMessage,
  className,
  style,
  ...aria
}: CheckboxProps): ReactNode {
  const glyphs = useGlyphs();
  const [open, close] = glyphs.delimiter.control;
  const grouped = useContext(CheckboxGroupStateContext) !== null;
  return (
    <CheckboxField
      {...aria}
      className={fieldClass('rk-checkbox', className)}
      {...(style === undefined ? {} : { style })}
    >
      <CheckboxButton className="rk-checkbox-row">
        {(render) => {
          const mark = markOf(
            render.isIndeterminate ? 'indeterminate' : render.isSelected ? 'checked' : 'unchecked',
            glyphs,
          );
          // In a group, the group's legend carries the mark, once.
          const isRequired = render.isRequired && !grouped;
          const { isReadOnly } = render;
          return (
            <>
              <span aria-hidden="true" className="rk-checkbox-box">
                <span className="rk-checkbox-end">{isReadOnly ? glyphs.mark.blank : open}</span>
                <span className="rk-checkbox-mark">{mark}</span>
                <span className="rk-checkbox-end">{isReadOnly ? glyphs.mark.blank : close}</span>
              </span>
              <span aria-hidden="true" className="rk-checkbox-air">
                {glyphs.mark.blank}
              </span>
              <span className="rk-checkbox-label">{children}</span>
              {/* The cell after the words is the required mark's, drawn or not. */}
              <span aria-hidden="true" className="rk-label-mark">
                {isRequired ? glyphs.mark.required : glyphs.mark.blank}
              </span>
            </>
          );
        }}
      </CheckboxButton>
      {description === undefined ? null : <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxField>
  );
}

export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, 'children' | 'className' | 'style'> {
  /** Set into the frame's top edge, and the group's name. */
  readonly label: string;
  /** The checkboxes, one row each. */
  readonly children?: ReactNode;
  readonly description?: ReactNode;
  readonly errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Several checkboxes under one name: a `Fieldset` with the label in its top
 * edge, inside React Aria's `CheckboxGroup`, which owns the value and is the
 * group a reader enters.
 */
export function CheckboxGroup({
  label,
  children,
  description,
  errorMessage,
  className,
  style,
  ...aria
}: CheckboxGroupProps): ReactNode {
  return (
    <AriaCheckboxGroup
      {...aria}
      className={fieldClass('rk-checkbox-group', className)}
      {...(style === undefined ? {} : { style })}
    >
      {({ isRequired }) => (
        <>
          <Fieldset legend={label} isRequired={isRequired}>
            {children}
          </Fieldset>
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </AriaCheckboxGroup>
  );
}

export interface CheckboxTextOptions {
  readonly mark?: CheckboxMark;
  readonly required?: boolean;
  readonly readOnly?: boolean;
}

/**
 * A checkbox row as cells: its text snapshot, and the control `formBuffer`
 * lays out. The delimiters, the mark cell, a cell of air, the words, and the
 * required mark's cell, which is there, blank, when the box is not required.
 */
export function checkboxBuffer(
  label: string,
  options: CheckboxTextOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const [open, close] = options.readOnly ? [' ', ' '] : glyphs.delimiter.control;
  const mark = markOf(options.mark ?? 'unchecked', glyphs);
  const line = `${open}${mark}${close} ${label}${options.required ? glyphs.mark.required : ' '}`;
  return Buffer.create({ width: stringWidth(line), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, line);
  });
}
