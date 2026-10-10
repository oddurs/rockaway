'use client';

/**
 * `Switch` (cairn 0037): an on/off setting that takes effect at once.
 *
 *   [●──] Wrap lines      off
 *   [──●] Wrap lines      on, and the track in reverse video
 *
 * Between the theme's control delimiters, a track of three cells with the
 * thumb in one of them: at the start when off, at the end when on. On is
 * reverse video as well, so the two states differ in a glyph's place and in
 * an attribute, and neither needs a colour. The label is the switch's own
 * words, after a cell of air, and does not change with the state.
 *
 * States per 0118, none of which adds a cell:
 *
 *   - pressed reverses the track; on, which is already reversed, reverses back
 *   - hover underlines the label; focus is the ring, around the whole switch
 *   - disabled dims; read-only draws the value without the track or its
 *     ground, the thumb alone in the place it holds
 *
 * The track is geometry: `─` is a line, and a line is drawn by the cell, not
 * the font (0116). So the three cells are written as a painted row, the runs
 * the painter writes and `shapes.css` strokes, and rendered by React rather
 * than painted after mounting, so a server sends the same cells.
 *
 * Behaviour is React Aria's `SwitchField` and `SwitchButton`: `role="switch"`,
 * Space toggles, and the description is linked by `aria-describedby`. The
 * root is a field (0127), so a switch lines up in a `Form`'s control column
 * with every other field, its description under it.
 */
import { Attr, Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import type { CSSProperties, ReactNode } from 'react';
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  type SwitchFieldProps as AriaSwitchFieldProps,
} from 'react-aria-components';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { rowRuns } from '../paint/cells.ts';
import type { PainterName } from '../screen.tsx';
import { Description, FieldError, fieldClass } from './field.tsx';

/** What a switch is showing, in the vocabulary's words (0118). */
export interface SwitchState {
  /** On: `data-selected`. The thumb at the end, and the track reversed. */
  readonly selected?: boolean;
  /** `data-pressed`: the track reversed, or reversed back when on. */
  readonly pressed?: boolean;
  /** `data-readonly`: the thumb alone, without the track or its ground. */
  readonly readOnly?: boolean;
  /** `data-disabled`: dim. */
  readonly disabled?: boolean;
  /** `data-hovered`: the label underlined. */
  readonly hovered?: boolean;
}

/** Cells between the delimiters, the thumb's included, in every state. */
const SWITCH_TRACK_CELLS = 3;

/**
 * The cells between the delimiters: the thumb, and the track in the rest.
 * Read-only leaves the track out, so only the value is drawn, in the place it
 * would hold. Always three cells, so no state moves anything.
 */
export function switchTrack(
  state: Pick<SwitchState, 'selected' | 'readOnly'>,
  glyphs: Glyphs = defaultGlyphs,
): string {
  const thumb = glyphs.mark['switch-thumb'];
  const track = (state.readOnly ? glyphs.mark.blank : glyphs.mark['switch-track']).repeat(
    SWITCH_TRACK_CELLS - 1,
  );
  return state.selected ? `${track}${thumb}` : `${thumb}${track}`;
}

/**
 * The track's style: what `switch.css` draws for a state, as cell attributes.
 * Reversed when on or pressed, but not both, because pressing a filled
 * control reverses it back; never when read-only, which has no ground.
 */
export function switchTrackStyle(state: SwitchState): Style {
  const reversed = !state.readOnly && Boolean(state.selected) !== Boolean(state.pressed);
  let attrs = reversed ? Attr.reverse : Attr.none;
  if (state.disabled) attrs |= Attr.dim;
  return { fg: state.disabled ? 'fg.disabled' : 'fg.default', attrs };
}

/**
 * The switch as cells: the delimiters, the track, a cell of air, the label.
 * Its text snapshot, and what it occupies on the grid; the component writes
 * the same cells. The attributes are `switch.css`'s, restated: a text
 * snapshot shows the thumb's place, and the buffer's styles carry the rest.
 */
export function switchBuffer(
  label: string,
  state: SwitchState = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const [open, close] = glyphs.delimiter.control;
  const track = switchTrack(state, glyphs);
  const words: Style = {
    fg: state.disabled ? 'fg.disabled' : 'fg.default',
    attrs: (state.disabled ? Attr.dim : Attr.none) | (state.hovered ? Attr.underline : Attr.none),
  };
  const ends: Style = {
    fg: state.disabled ? 'fg.disabled' : 'border.control',
    attrs: state.disabled ? Attr.dim : Attr.none,
  };
  const width =
    stringWidth(open) + SWITCH_TRACK_CELLS + stringWidth(close) + 1 + stringWidth(label);
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let x = drawText(draft, { x: 0, y: 0 }, open, { style: ends });
    x += drawText(draft, { x, y: 0 }, track, { style: switchTrackStyle(state) });
    x += drawText(draft, { x, y: 0 }, close, { style: ends });
    drawText(draft, { x: x + 1, y: 0 }, label, { style: words });
  });
}

/**
 * The track as the painter's runs, rendered by React. The same elements
 * `paintCells` writes, so `shapes.css` strokes the line, the continuity check
 * reads it, and a server renders it; the colours are the stylesheet's, from
 * the switch's state, so the runs carry none.
 */
function Track({
  state,
  painter,
  glyphs,
}: {
  readonly state: Pick<SwitchState, 'selected' | 'readOnly'>;
  readonly painter: PainterName;
  readonly glyphs: Glyphs;
}): ReactNode {
  const cells = Buffer.create({ width: SWITCH_TRACK_CELLS, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, switchTrack(state, glyphs));
  });
  let col = 0;
  return (
    <span className="rk-switch-track" data-rk-painted={painter}>
      <span className="rk-row">
        {rowRuns(cells, 0).map((run) => {
          const at = col;
          col += run.cells;
          const place = {
            ...(at === 0 ? {} : { '--rk-col': String(at) }),
            ...(run.cells === 1 ? {} : { '--rk-run': String(run.cells) }),
          } as CSSProperties;
          return (
            <span
              key={at}
              className="rk-run"
              style={place}
              {...(run.shape === undefined ? {} : { 'data-rk-shape': run.shape })}
            >
              {run.text}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export interface SwitchProps
  extends Omit<
    AriaSwitchFieldProps,
    | 'children'
    | 'className'
    | 'style'
    | 'isRequired'
    | 'isInvalid'
    | 'validate'
    | 'validationBehavior'
  > {
  /** The label: the switch's own words, after the track. It does not change with the state. */
  readonly children?: ReactNode;
  /** Help under the switch, dim, linked to it by `aria-describedby`. */
  readonly description?: ReactNode;
  /** How the track's line is stroked: weighted like the type, or a hairline. */
  readonly painter?: PainterName;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * An on/off setting that takes effect at once: `[──●] Wrap lines`.
 *
 * There is nothing to validate in a setting that is already applied, so a
 * switch takes no `isRequired`, `isInvalid` or `validate`: a choice that must
 * be made before a form is submitted is a checkbox. A form's server errors
 * still reach it by `name`, and are drawn under it.
 */
export function Switch({
  children,
  description,
  painter = 'glyph',
  className,
  ...aria
}: SwitchProps): ReactNode {
  const glyphs = useGlyphs();
  const [open, close] = glyphs.delimiter.control;
  return (
    <AriaSwitchField {...aria} className={fieldClass('rk-switch', className)}>
      {/* The button is the control (0182); the description and error sit outside it. */}
      <AriaSwitchButton className="rk-switch-button" data-rk-control="">
        {({ isSelected, isReadOnly }) => (
          <>
            {/* Chrome: the name is the label alone. */}
            <span aria-hidden="true" className="rk-switch-indicator">
              <span className="rk-switch-end">{open}</span>
              <Track
                state={{ selected: isSelected, readOnly: isReadOnly }}
                {...{ painter, glyphs }}
              />
              <span className="rk-switch-end">{close}</span>{' '}
            </span>
            <span className="rk-switch-label">{children}</span>
          </>
        )}
      </AriaSwitchButton>
      {description === undefined ? null : <Description>{description}</Description>}
      <FieldError />
    </AriaSwitchField>
  );
}
