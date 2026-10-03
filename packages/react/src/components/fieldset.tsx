'use client';

/**
 * `FieldFrame` and `Fieldset` (cairn 0127): a label set into a frame's edge.
 *
 * A framed control — an `lg` text field, a group of checkboxes — has no
 * label column. Its label goes where a terminal puts a pane's title, into the
 * top edge of its frame, the way `Frame` sets one:
 *
 *   ┌ Notify* ─────────────────┐
 *   │ ● always  ○ never        │
 *   └──────────────────────────┘
 *
 * The edge is chrome. The engine draws the label into it, truncated before
 * it can reach the corner, and the painted layer is `aria-hidden`; the label
 * a reader hears is a real React Aria `Label`, visually hidden, with the same
 * words and no glyph in them. A frame is the one place a label is drawn by
 * the engine rather than set in the page, because only the engine can set
 * text into a line it is drawing.
 *
 * States are drawn per 0118 and none adds a cell:
 *
 *   - required: the mark after the label in the edge
 *   - invalid: the frame goes heavy, in `border.danger`
 *   - focus, on a control's own frame: heavy, in `border.focus`
 *   - disabled: the frame and its label dim
 *
 * The weight is the buffer's, because a heavier line is a different glyph;
 * the colour is the stylesheet's, from the `data-*` attributes React Aria's
 * `Group` writes on the frame. Under the `ascii` border set there is no
 * heavier line to draw, and the colour and the field's error carry it.
 *
 * `FieldFrame` is the part a framed control is drawn in. `Fieldset` is a
 * `FieldFrame` that is a group, named by its legend.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  rect,
  stringWidth,
  truncate,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { type ReactNode, useContext, useId, useMemo } from 'react';
import {
  Label as AriaLabel,
  CheckboxGroupStateContext,
  Group,
  GroupContext,
  LabelContext,
  RadioGroupStateContext,
  useSlottedContext,
  VisuallyHidden,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type Inset, type PainterName, Screen } from '../screen.tsx';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';

const VARIANTS = {
  kind: ['control', 'group'],
} as const;

/** FieldFrame's variants, as data. */
export const fieldFrameVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  kind: 'control',
});

export type FieldFrameKind = VariantValue<typeof fieldFrameVariants, 'kind'>;

/** What a field frame draws: its label, and the states that change the edge. */
export interface FieldFrameState {
  /** Set into the top edge. */
  readonly label: string;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  /** Focus is visible inside a control's own frame. */
  readonly focused?: boolean;
}

/** The set a heavier frame is drawn in. ASCII has no heavier line to give. */
function heavier(set: BorderSetName): BorderSetName {
  return set === 'ascii' ? 'ascii' : 'heavy';
}

/**
 * A field frame as a buffer: a frame with the label set into its top edge,
 * and the required mark after it, both bold, or dim when disabled. Pure, so
 * it is the text snapshot, and the text a server renders.
 *
 * The label is truncated here, before the frame sees it, so that the mark is
 * never the part that is cut off. The frame's lines carry no colour of their
 * own: the stylesheet colours them from the state.
 */
export function fieldFrameBuffer(
  size: { readonly width: number; readonly height: number },
  state: FieldFrameState,
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const heavy = state.invalid === true || state.focused === true;
  const border = heavy ? heavier(glyphs.borderSet) : glyphs.borderSet;
  const mark = state.required ? glyphs.mark.required : '';
  // The corners, a cell of line either side and a cell of air either side
  // of the words: what `drawBox` leaves a title.
  const room = Math.max(0, size.width - 6 - stringWidth(mark));
  const label = truncate(state.label, room, glyphs.mark.ellipsis);
  // The words are a label in the edge, which the engine sets when the pass
  // closes and which gives way to any junction drawn into the edge (0175). A
  // label has one style, so the mark is drawn in the words' style.
  const words = {
    fg: state.disabled ? 'fg.disabled' : 'fg.default',
    attrs: state.disabled ? Attr.dim : Attr.bold,
  };
  return Buffer.create(size).draw((draft) => {
    drawBox(draft, rect(0, 0, size.width, size.height), {
      set: borderSets[border],
      ellipsis: glyphs.mark.ellipsis,
      title: `${label}${mark}`,
      titleStyle: words,
    });
  });
}

export interface FieldFrameProps extends VariantProps<typeof fieldFrameVariants> {
  /** Set into the top edge, and the label a reader hears. */
  readonly label: string;
  readonly isRequired?: boolean;
  readonly isInvalid?: boolean;
  readonly isDisabled?: boolean;
  /**
   * `control` is a control's own frame (an `lg` text field): focus inside it
   * makes it heavy (0118's focus-framed). `group` frames several controls,
   * each of which shows its own focus, so focus leaves the frame alone.
   */
  readonly kind?: FieldFrameKind;
  /** Padding inside the border, in cells, as `Frame` takes it. */
  readonly pad?: number | Inset;
  readonly painter?: PainterName;
  readonly className?: string;
  readonly children?: ReactNode;
}

const DEFAULT_PAD: Inset = { x: 1, y: 0 };

function insetOf(pad: number | Inset | undefined): Inset {
  const base = pad === undefined ? DEFAULT_PAD : typeof pad === 'number' ? { x: pad, y: pad } : pad;
  return { x: base.x + 1, y: base.y + 1 };
}

/**
 * The frame a framed control is drawn in, its label set into the top edge.
 *
 * Put it inside a React Aria field, where the field's `Label` context reaches
 * it: the hidden label takes the field's ids, so it names the control. Its
 * height is its content's, in whole rows, and its width the column's,
 * rounded down to a whole cell.
 */
export function FieldFrame(props: FieldFrameProps): ReactNode {
  return <FrameGroup {...props} role="presentation" />;
}

interface FrameGroupProps extends FieldFrameProps {
  readonly role: 'group' | 'presentation';
  /** Set when the frame names a group itself, rather than a field naming it. */
  readonly labelId?: string;
}

/** A field frame, and the group it is: a fieldset's, or nobody's. */
function FrameGroup({
  label,
  isRequired = false,
  isInvalid = false,
  isDisabled = false,
  kind,
  pad,
  painter,
  role,
  labelId,
  className,
  children,
}: FrameGroupProps): ReactNode {
  const glyphs = useGlyphs();
  const chosen = fieldFrameVariants.select({ kind });
  // A field whose input is a group of its own (NumberField, DateField) hands
  // that group's props, its labelling and its press handling, to any Group
  // under it. The frame is a Group, and they are not its: it takes none of
  // them, and passes them on unchanged to what it frames (cairn 0204).
  const outer = useContext(GroupContext);
  return (
    <GroupContext.Provider value={null}>
      <Group
        role={role}
        {...(labelId === undefined ? {} : { 'aria-labelledby': labelId })}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        className={cx('rk-field-frame', className)}
        {...fieldFrameVariants.dataAttributes(chosen)}
      >
        {({ isFocusVisible }) => (
          <FrameScreen
            state={{
              label,
              required: isRequired,
              invalid: isInvalid,
              disabled: isDisabled,
              focused: chosen.kind === 'control' && isFocusVisible,
            }}
            glyphs={glyphs}
            inset={insetOf(pad)}
            {...(painter === undefined ? {} : { painter })}
          >
            {/* The label a reader hears: the edge's words, without the edge. */}
            <VisuallyHidden
              elementType={AriaLabel}
              className="rk-field-frame-label"
              {...(labelId === undefined ? {} : { id: labelId })}
            >
              {label}
            </VisuallyHidden>
            <GroupContext.Provider value={outer}>{children}</GroupContext.Provider>
          </FrameScreen>
        )}
      </Group>
    </GroupContext.Provider>
  );
}

function FrameScreen({
  state,
  glyphs,
  inset,
  painter,
  children,
}: {
  readonly state: Required<FieldFrameState>;
  readonly glyphs: Glyphs;
  readonly inset: Inset;
  readonly painter?: PainterName;
  readonly children: ReactNode;
}): ReactNode {
  const { label, required, invalid, disabled, focused } = state;
  const draw = useMemo(
    () => (size: { width: number; height: number }) =>
      fieldFrameBuffer(size, { label, required, invalid, disabled, focused }, glyphs),
    [label, required, invalid, disabled, focused, glyphs],
  );
  return (
    <Screen
      draw={draw}
      contentInset={inset}
      fallback={FALLBACK}
      {...(painter === undefined ? {} : { painter })}
    >
      {children}
    </Screen>
  );
}

/** The size drawn before the frame has measured itself, and on a server. */
const FALLBACK = { width: 24, height: 3 };

export interface FieldsetProps {
  /** Set into the top edge, and the group's accessible name. */
  readonly legend: string;
  /**
   * Draws the required mark after the legend. Pass the group's own
   * `isRequired`, which its render props carry, as a field passes its own to
   * `Label`: the group's state cannot say, because a checkbox group stops
   * being required once something in it is checked.
   */
  readonly isRequired?: boolean;
  /** Inside a checkbox or radio group, the group's own when not given. */
  readonly isInvalid?: boolean;
  /**
   * Dims the frame. It does not disable what is inside: inside a checkbox or
   * radio group, the group's `isDisabled` does both, and is the frame's when
   * this is not given.
   */
  readonly isDisabled?: boolean;
  readonly pad?: number | Inset;
  readonly painter?: PainterName;
  readonly className?: string;
  readonly children?: ReactNode;
}

/**
 * A framed group, its legend set into the top edge. On its own it is a
 * `group` named by its legend. Inside a React Aria checkbox or radio group it
 * is that group's frame: the legend becomes the group's label, the group
 * keeps its role, and the frame draws the group's invalid and disabled
 * states, and its required state when it is given it.
 *
 * Fields inside it line up as they do in a `Form`.
 */
export function Fieldset({
  legend,
  isRequired,
  isInvalid,
  isDisabled,
  className,
  children,
  ...frame
}: FieldsetProps): ReactNode {
  const id = useId();
  // A React Aria group provides its label's ids through context. With one,
  // the group is already there, named by whatever label takes them.
  const outer = useSlottedContext(LabelContext);
  const inGroup = outer !== null && outer !== undefined && 'id' in outer;
  const checkboxes = useContext(CheckboxGroupStateContext);
  const radios = useContext(RadioGroupStateContext);
  const group = checkboxes ?? radios;
  return (
    <FrameGroup
      {...frame}
      label={legend}
      kind="group"
      isRequired={isRequired ?? false}
      isInvalid={isInvalid ?? group?.isInvalid ?? false}
      isDisabled={isDisabled ?? group?.isDisabled ?? false}
      className={cx('rk-fieldset', className)}
      {...(inGroup ? { role: 'presentation' as const } : { role: 'group' as const, labelId: id })}
    >
      <div className="rk-fieldset-fields">{children}</div>
    </FrameGroup>
  );
}
