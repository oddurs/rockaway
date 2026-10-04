/**
 * `FieldFrame`: the pure half (cairn 0126).
 *
 * Its variants as data, and the frame as cells. No React and no client
 * boundary, so a server component, a static renderer or a test can call it;
 * `fieldset.tsx` imports it from here.
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
import { themeGlyphs } from '@rockaway/tokens';
import { defineVariants, type Variants } from '../variants.ts';
import type { FieldFrameState } from './fieldset.tsx';

const VARIANTS = {
  kind: ['control', 'group'],
} as const;

/** FieldFrame's variants, as data. */
export const fieldFrameVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  kind: 'control',
});

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
  glyphs: Glyphs = themeGlyphs.default,
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
