'use client';

/**
 * `Select` and `SelectItem` (cairn 0042): one value from a list too long for
 * radios.
 *
 *   Theme  [ phosphor    ▾]
 *          ┏━━━━━━━━━━━━━━━┓
 *          ┃ ▸ ink         ┃
 *          ┃  ✓phosphor    ┃
 *          ┃   tokyo-night ┃
 *          ┗━━━━━━━━━━━━━━━┛
 *
 * A field (0127): the label in the label column, the trigger in the control
 * column exactly `cols` cells wide, and the description and the error under
 * it. The trigger is the value between the control delimiters, a cell of air
 * either side and the open mark before the closing one; the value starts in
 * its third cell. The popover (0034) opens on the row under the trigger, its
 * left edge in the trigger's first column, so its rows start in the value's
 * column; it is at least as wide as the trigger.
 *
 * The rows are List's (0133): the cursor mark in the first reserved cell, the
 * selected row in reverse video with the check in the second. No state
 * changes a cell. Behaviour is React Aria's `Select`: arrows and Space open
 * it, type-ahead selects even while it is closed, Escape closes it, and a
 * hidden native `select` keeps forms and autofill working.
 */
import type { CSSProperties, ReactNode } from 'react';
import {
  Select as AriaSelect,
  Button as AriaSelectButton,
  type SelectProps as AriaSelectProps,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  SelectValue,
  VisuallyHidden,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Description, FieldError, type FieldErrorProps, fieldClass, Label } from './field.tsx';
import { listMarks } from './list.pure.ts';
import { Popover } from './popover.tsx';
import { selectTrigger } from './select.pure.ts';

/** What a select is showing, in the vocabulary's words (0118). */
export interface SelectState {
  /** `data-pressed` on the trigger: the value in reverse video. */
  readonly pressed?: boolean;
  /** `data-hovered` on the trigger: the value underlined. */
  readonly hovered?: boolean;
  readonly disabled?: boolean;
  /** `data-invalid`: the delimiters in `border.danger`. */
  readonly invalid?: boolean;
  /** No value yet: the placeholder, muted. */
  readonly placeholder?: boolean;
}

/** An option, as text. */
export interface SelectOptionText {
  readonly label: string;
  readonly disabled?: boolean;
}

/** A select as text: what `selectBuffer` draws. */
export interface SelectText extends Omit<SelectState, 'placeholder'> {
  /** The trigger's width in cells. */
  readonly cols: number;
  readonly options: readonly SelectOptionText[];
  /** The selected option's label. */
  readonly value?: string;
  /** What the trigger says with nothing selected. */
  readonly placeholder?: string;
  readonly open?: boolean;
  /** The option the keyboard is on, when open. */
  readonly cursor?: string;
}

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, 'children' | 'className' | 'style' | 'selectionMode'> {
  /** The field's name, in the label column. */
  readonly label: string;
  /** The options: `SelectItem`s, or a function of each of `items`. */
  readonly children?: ReactNode | ((item: T) => ReactNode);
  /** The items to render with a function child. */
  readonly items?: Iterable<T>;
  /** The trigger's width in cells, its delimiters included. */
  readonly cols?: number;
  /** Help under the trigger, dim, linked to it by `aria-describedby`. */
  readonly description?: ReactNode;
  /** Words for the error under the trigger; the select's own validation's when not given. */
  readonly errorMessage?: FieldErrorProps['children'];
  /** The most rows the popover takes before its rows scroll. */
  readonly maxRows?: number;
  readonly className?: string;
}

const COLS = 24;

/**
 * One value from a list too long for radios, in a popover under a trigger
 * exactly `cols` cells wide. A field: it lines up in a Form.
 */
export function Select<T extends object>({
  label,
  children,
  items,
  cols = COLS,
  description,
  errorMessage,
  maxRows = 8,
  placeholder = 'Choose one',
  className,
  ...aria
}: SelectProps<T>): ReactNode {
  const glyphs = useGlyphs();
  return (
    <AriaSelect {...aria} placeholder={placeholder} className={fieldClass('rk-select', className)}>
      {({ isRequired }) => (
        <>
          <Label isRequired={isRequired}>{label}</Label>
          <AriaSelectButton
            className="rk-select-trigger"
            // A control, to the conformance levels: half a cell inside it at `standard` (0182).
            data-rk-control=""
            style={{ '--rk-select-cols': cols } as CSSProperties}
          >
            <SelectValue className="rk-select-value-slot">
              {({ selectedText, isPlaceholder }) => {
                const text = isPlaceholder ? placeholder : (selectedText ?? '');
                const parts = selectTrigger(text, cols, glyphs);
                return (
                  <>
                    <span aria-hidden="true" className="rk-select-end">
                      {parts.open}
                    </span>
                    {/* The value as drawn, cut and padded to its cells; a reader
                        is given the whole of it, with no padding and no ellipsis. */}
                    <span aria-hidden="true" className="rk-select-value">
                      {parts.value}
                    </span>
                    <VisuallyHidden>{text}</VisuallyHidden>
                    <span aria-hidden="true" className="rk-select-mark">
                      {parts.mark}
                    </span>
                    <span aria-hidden="true" className="rk-select-end">
                      {parts.close}
                    </span>
                  </>
                );
              }}
            </SelectValue>
          </AriaSelectButton>
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
          {/* At least as wide as the trigger: Popover's own minCols, not a width set here. */}
          <Popover maxRows={maxRows} className="rk-select-popover">
            <ListBox className="rk-select-list" {...(items === undefined ? {} : { items })}>
              {children}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaSelect>
  );
}

export interface SelectItemProps<T extends object>
  extends Omit<ListBoxItemProps<T>, 'className' | 'children'> {
  /** The option's words. */
  readonly children: string;
  readonly className?: string;
}

/**
 * An option: List's row, its reserved cells the cursor's and the check's, and
 * its words.
 */
export function SelectItem<T extends object>({
  children,
  className,
  ...item
}: SelectItemProps<T>): ReactNode {
  const glyphs = useGlyphs();
  return (
    <ListBoxItem
      {...item}
      textValue={item.textValue ?? children}
      className={cx('rk-list-item rk-select-item', className)}
    >
      {({ isFocused, isSelected }) => {
        const [cursor, check] = listMarks(
          { cursor: isFocused, selected: isSelected },
          true,
          glyphs,
        );
        return (
          <>
            <span aria-hidden="true" className="rk-list-mark rk-list-cursor">
              {cursor}
            </span>
            <span aria-hidden="true" className="rk-list-mark rk-list-check">
              {check}
            </span>
            <span className="rk-list-label">{children}</span>
          </>
        );
      }}
    </ListBoxItem>
  );
}
