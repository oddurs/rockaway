'use client';

/**
 * The field contract (cairn 0127): the parts every field is built from.
 *
 * React Aria owns the semantics. A field's `Label` names its control, its
 * `Description` and `FieldError` are linked to it by `aria-describedby`, and
 * validation is React Aria's own — `native` by default, so errors arrive on
 * submit, with `aria` and a `Form`'s `validationErrors` there for the rest.
 *
 * What is ours is where the parts sit on the grid. A field is two columns of
 * cells, a label column and a control column:
 *
 *   Name      [Ada Lovelace        ]
 *   Email*    [ada@                ]
 *             Where the receipts go.
 *             ✗ Enter an email address.
 *
 *   - the label is bold, on the field's first row, and keeps one cell after
 *     it for the required mark, drawn or not, so `required` never moves the
 *     control (0118: states never change geometry)
 *   - the description is dim, under the control, wrapped in whole cells
 *   - the error is under that: the cross mark, a cell of air, and the message
 *     in `fg.danger`, hanging so a second line starts under the first word
 *
 * A `Form` lines its fields up: every field is a subgrid of the form's two
 * columns, so the label column is as wide as the longest label in the form
 * and every control starts in the same cell. Under 60 cells it stacks, the
 * label on the row above its control.
 *
 * A framed control sets its label into its frame's top edge instead, the way
 * `Frame` sets a title: that is `FieldFrame`, beside `Fieldset`.
 *
 * A field component puts `fieldClass()` on its React Aria root, and the parts
 * inside it in this order: the label, the control, the description, the
 * error. CONTRIBUTING.md has the whole recipe, under "Building a field".
 */
import type { Buffer } from '@rockaway/grid';
import type { CSSProperties, ReactNode } from 'react';
import {
  FieldError as AriaFieldError,
  type FieldErrorProps as AriaFieldErrorProps,
  Form as AriaForm,
  type FormProps as AriaFormProps,
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
  Text,
  type TextProps,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';

/**
 * The class a field's React Aria root carries, with any of its own:
 * `className={fieldClass('rk-text-field', className)}`. It is what makes the
 * root a field — two columns, the parts in their places — and what a `Form`
 * finds to line it up.
 */
export function fieldClass(...names: ReadonlyArray<string | false | null | undefined>): string {
  return cx('rk-field', ...names);
}

export interface LabelProps extends Omit<AriaLabelProps, 'className' | 'children'> {
  readonly children?: ReactNode;
  /**
   * Draws the required mark in the cell after the label. Pass the field's
   * own `isRequired`, which its render props carry. The mark is
   * `aria-hidden`: the control says it is required with `aria-required`.
   */
  readonly isRequired?: boolean;
  readonly className?: string;
}

/**
 * A field's name, in bold on its first row. React Aria links it to the
 * control, so it is the control's accessible name, and clicking it focuses
 * the control.
 */
export function Label({ children, isRequired = false, className, ...aria }: LabelProps): ReactNode {
  const { mark } = useGlyphs();
  return (
    <AriaLabel {...aria} className={cx('rk-label', className)}>
      {children}
      {/* The cell after the label is the mark's in every state, so a field
          that becomes required moves nothing. */}
      <span aria-hidden="true" className="rk-label-mark">
        {isRequired ? mark.required : mark.blank}
      </span>
    </AriaLabel>
  );
}

export interface DescriptionProps extends Omit<TextProps, 'slot' | 'className'> {
  readonly className?: string;
}

/**
 * Help for a field, dim, on the rows under its control. React Aria adds it
 * to the control's `aria-describedby`, so a reader hears it after the name.
 */
export function Description({ className, ...text }: DescriptionProps): ReactNode {
  return <Text {...text} slot="description" className={cx('rk-description', className)} />;
}

export interface FieldErrorProps extends Omit<AriaFieldErrorProps, 'className'> {
  readonly className?: string;
}

/**
 * Why a field is invalid, under its description: the cross mark, a cell of
 * air, then the message in `fg.danger`. Rendered only while the field is
 * invalid, with the field's own messages unless it is given words of its own.
 *
 * It is not a live region. A form that fails on submit moves focus to the
 * first invalid control, and the reader hears the error there, once, as part
 * of the control's description; announcing it from here as well would say it
 * twice.
 */
export function FieldError({ children, className, ...aria }: FieldErrorProps): ReactNode {
  const { mark } = useGlyphs();
  return (
    <AriaFieldError {...aria} className={cx('rk-field-error', className)}>
      {(validation) => {
        const message =
          typeof children === 'function'
            ? children(validation)
            : (children ?? validation.defaultChildren);
        // No words, no error row: a lone mark would say nothing.
        if (message === null || message === undefined || message === '') return null;
        return (
          <>
            <span aria-hidden="true" className="rk-field-error-mark">
              {mark.cross}
            </span>
            <span className="rk-field-error-message">{message}</span>
          </>
        );
      }}
    </AriaFieldError>
  );
}

export interface FormProps extends Omit<AriaFormProps, 'className' | 'style'> {
  /**
   * The label column, in cells, the gap after the labels included. As wide as
   * the longest label in the form when not given; a label longer than the
   * column wraps inside it.
   */
  readonly labelWidth?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * A form whose fields line up in two columns of cells, the way a terminal
 * form does, and stack under 60 cells. React Aria's `Form`: validation is
 * `native` unless it is told otherwise, and `validationErrors` puts a
 * server's errors on the fields they belong to.
 *
 * The form answers to its own width, so it takes the width its container
 * gives it rather than sizing itself to its fields.
 */
export function Form({ labelWidth, className, style, children, ...aria }: FormProps): ReactNode {
  const columns =
    labelWidth === undefined
      ? undefined
      : ({ '--rk-form-label': `calc(${labelWidth} * var(--rk-cell-width))` } as CSSProperties);
  return (
    <AriaForm
      {...aria}
      className={cx('rk-form', className)}
      {...(style === undefined ? {} : { style })}
    >
      {/* The form is the container its width is asked of; a container cannot
          ask about itself, so the columns are on the element inside it. */}
      <div className="rk-form-grid" style={columns}>
        {children}
      </div>
    </AriaForm>
  );
}

/** A field as text: what `formBuffer` lays out. */
export interface FieldText {
  /**
   * The label in the label column. Left out for a control that carries its
   * own words (a checkbox) or sets its label into its frame.
   */
  readonly label?: string;
  readonly required?: boolean;
  /**
   * The control, drawn by its own buffer function. A function of the control
   * column's width for a control that fills it, as a framed one does.
   */
  readonly control: Buffer | ((width: number) => Buffer);
  readonly description?: string;
  /** The message `FieldError` shows; the field is invalid when it is set. */
  readonly error?: string;
}

export interface FormTextOptions {
  /** The form's width, in cells. Under 60 it stacks. */
  readonly width: number;
  /** As `Form`'s `labelWidth`. */
  readonly labelWidth?: number;
}
