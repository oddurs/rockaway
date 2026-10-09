'use client';

/**
 * `ComboBox` and `ComboBoxItem` (cairn 0055): type to filter a long list, and
 * pick one value from what is left.
 *
 *   Author  [ aur          ▾]
 *           ┏━━━━━━━━━━━━━━━━┓
 *           ┃ ▸ Aurora Rhee  ┃
 *           ┃   Laurent Kim  ┃
 *           ┗━━━━━━━━━━━━━━━━┛
 *
 * A field (0127): the label in the label column, and in the control column a
 * box exactly `cols` cells wide. The box is a text field's (0035), the text
 * between the control delimiters, with a cell either side for the overflow
 * marks while text is hidden that way, then the open mark and the closing
 * delimiter. Those last three cells are the button that opens the list with
 * every option. The text starts in the third cell, as a Select's value does.
 *
 * The popover (0034) opens on the row under the box, its left edge in the
 * box's first column, so its rows start in the text's column, at least as
 * wide as the box. Its rows are List's (0133): the cursor mark, the selected
 * row in reverse with the check. Where the typed text matches a row, those
 * characters are underlined and bold, and in the accent: three ways, so it
 * reads in greyscale, in forced colors and to a reader who cannot see the
 * hue. When nothing matches, the popover says so in a muted row.
 *
 * Behaviour is React Aria's `ComboBox`: it filters as you type, without case
 * or accents; the arrows move the cursor while focus stays in the box; Enter
 * chooses; Escape closes, then clears; and the count of options is announced
 * as it changes. No state changes a cell (0118).
 */
import { type CSSProperties, type ReactNode, useContext, useRef } from 'react';
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  ComboBoxStateContext,
  Group,
  Input,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
} from 'react-aria-components';
import { useCellScroll } from '../cell-scroll.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { COMBOBOX_LEAD, comboBoxInputCells, matchRange, NO_MATCHES } from './combobox.pure.ts';
import { Description, FieldError, type FieldErrorProps, fieldClass, Label } from './field.tsx';
import { listMarks } from './list.pure.ts';
import { Popover } from './popover.tsx';

export type {
  ComboBoxOptionText,
  ComboBoxState,
  ComboBoxText,
} from './combobox.pure.ts';

export interface ComboBoxProps<T extends object>
  extends Omit<
    AriaComboBoxProps<T>,
    'children' | 'className' | 'style' | 'items' | 'defaultItems' | 'allowsEmptyCollection'
  > {
  /** The field's name, in the label column. */
  readonly label: string;
  /** The options: `ComboBoxItem`s, or a function of each of `items`. */
  readonly children?: ReactNode | ((item: T) => ReactNode);
  /** The items to render with a function child. The combobox filters them as you type. */
  readonly items?: Iterable<T>;
  /** The box's width in cells, its delimiters and its button included. */
  readonly cols?: number;
  /** What the box says while nothing is typed. */
  readonly placeholder?: string;
  /** Help under the box, dim, linked to it by `aria-describedby`. */
  readonly description?: ReactNode;
  /** Words for the error under the box; the combobox's own validation's when not given. */
  readonly errorMessage?: FieldErrorProps['children'];
  /** The most rows the popover takes before its rows scroll. */
  readonly maxRows?: number;
  /** What the popover says when nothing matches. */
  readonly empty?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const COLS = 24;

/** The box: the delimiters, the input, and the button that is its last three cells. */
function Box({ placeholder }: { readonly placeholder: string | undefined }): ReactNode {
  const glyphs = useGlyphs();
  const input = useRef<HTMLInputElement>(null);
  const { overflow } = useCellScroll(input, 'x');
  const [open, close] = glyphs.delimiter.control;
  return (
    <>
      <span aria-hidden="true" className="rk-combobox-end">
        {open}
      </span>
      <span aria-hidden="true" className="rk-combobox-cell">
        {overflow.start ? glyphs.mark['overflow-start'] : glyphs.mark.blank}
      </span>
      <Input
        ref={input}
        // Scrolls across: no bar of the browser's (0207); the overflow marks show where.
        className="rk-scroll rk-combobox-input"
        {...(placeholder === undefined ? {} : { placeholder })}
      />
      {/* Three cells, so a finger has a target as wide as it is tall. React
          Aria names it ("Show suggestions") and keeps it out of the tab order:
          the arrows open the list from the box. */}
      <AriaButton className="rk-combobox-button">
        <span aria-hidden="true" className="rk-combobox-cell">
          {overflow.end ? glyphs.mark['overflow-end'] : glyphs.mark.blank}
        </span>
        <span aria-hidden="true" className="rk-combobox-mark">
          {glyphs.mark.expanded}
        </span>
        <span aria-hidden="true" className="rk-combobox-end">
          {close}
        </span>
      </AriaButton>
    </>
  );
}

/**
 * Type to filter a list too long to scan, and choose one value from it. A
 * field: it lines up in a Form.
 */
export function ComboBox<T extends object>({
  label,
  children,
  items,
  cols = COLS,
  placeholder,
  description,
  errorMessage,
  maxRows = 8,
  empty = NO_MATCHES,
  className,
  style,
  ...aria
}: ComboBoxProps<T>): ReactNode {
  const vars = {
    '--rk-combobox-cols': Math.max(COMBOBOX_LEAD + 4, Math.trunc(cols)),
    '--rk-combobox-input-cols': comboBoxInputCells(cols),
    ...style,
  } as CSSProperties;
  return (
    <AriaComboBox
      {...aria}
      {...(items === undefined ? {} : { defaultItems: items })}
      // The popover stays open to say that nothing matches.
      allowsEmptyCollection
      className={fieldClass('rk-combobox', className)}
      style={vars}
    >
      {({ isRequired }) => (
        <>
          <Label isRequired={isRequired}>{label}</Label>
          <Group className="rk-combobox-box">
            <Box placeholder={placeholder} />
          </Group>
          {description === undefined ? null : <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
          {/* At least as wide as the box: Popover's own minCols, not a width set here. */}
          <Popover maxRows={maxRows} className="rk-combobox-popover">
            <ListBox
              className="rk-select-list rk-combobox-list"
              renderEmptyState={() => <span className="rk-combobox-empty">{empty}</span>}
            >
              {children}
            </ListBox>
          </Popover>
        </>
      )}
    </AriaComboBox>
  );
}

export interface ComboBoxItemProps<T extends object>
  extends Omit<ListBoxItemProps<T>, 'className' | 'children'> {
  /** The option's words. */
  readonly children: string;
  readonly className?: string;
}

/**
 * The words of an option, with what the typed text matches underlined and
 * bold. It reads the typed text itself, inside React Aria's item: the item is
 * rendered from the collection, where the wrapper's context is not.
 */
function Matched({ label }: { readonly label: string }): ReactNode {
  const state = useContext(ComboBoxStateContext);
  const range = matchRange(label, state?.inputValue ?? '');
  if (range === undefined) return label;
  return (
    <>
      {label.slice(0, range[0])}
      <span className="rk-combobox-match">{label.slice(range[0], range[1])}</span>
      {label.slice(range[1])}
    </>
  );
}

/**
 * An option: List's row, its reserved cells the cursor's and the check's, and
 * its words, with what the typed text matches underlined and bold.
 */
export function ComboBoxItem<T extends object>({
  children,
  className,
  ...item
}: ComboBoxItemProps<T>): ReactNode {
  const glyphs = useGlyphs();
  return (
    <ListBoxItem
      {...item}
      textValue={item.textValue ?? children}
      className={cx('rk-list-item rk-combobox-item', className)}
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
            <span className="rk-list-label">
              <Matched label={children} />
            </span>
          </>
        );
      }}
    </ListBoxItem>
  );
}
