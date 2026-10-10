import { Attr, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { dialogBuffer, dialogHeading, dialogVariants } from '../src/components/dialog.pure.ts';

describe('dialogBuffer', () => {
  test("the modal's double line, the title set into the top edge", () => {
    expect(
      toText(dialogBuffer({ width: 24, height: 4 }, { title: 'Rename file' })),
    ).toMatchInlineSnapshot(`
        "╔ Rename file ═════════╗
        ║                      ║
        ║                      ║
        ╚══════════════════════╝"
      `);
  });

  test('an alert carries the caution mark before its title, so it reads without colour', () => {
    const buffer = dialogBuffer(
      { width: 24, height: 3 },
      { title: 'Discard changes?', variant: 'alert' },
    );
    expect(toText(buffer).split('\n')[0]).toBe(
      `╔ ${themeGlyphs.default.mark.danger} Discard changes? ══╗`,
    );
    // The title is text in the text colour, not the line's.
    expect(buffer.at({ x: 4, y: 0 })?.style.fg).toBe('fg.default');
    expect(buffer.at({ x: 0, y: 0 })?.style.fg).toBe('border.default');
  });

  test('a title too long for the edge truncates with the ellipsis', () => {
    expect(
      toText(dialogBuffer({ width: 14, height: 3 }, { title: 'A very long title indeed' })).split(
        '\n',
      )[0],
    ).toBe(`╔ A very l${themeGlyphs.default.mark.ellipsis} ═╗`);
  });

  test('under ASCII the frame is ASCII and bold, and the title truncates in ASCII', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const buffer = dialogBuffer({ width: 14, height: 3 }, { title: 'A very long title' }, ascii);
    expect(toText(buffer)).toMatchInlineSnapshot(`
      "+ A very l~ -+
      |            |
      +------------+"
    `);
    expect(hasAttr(buffer.at({ x: 0, y: 0 })?.style ?? { attrs: 0 }, Attr.bold)).toBe(true);
  });
});

describe('dialogHeading', () => {
  test('the title alone, or the mark and the title for an alert', () => {
    expect(dialogHeading({ title: 'Rename' })).toBe('Rename');
    expect(dialogHeading({ title: 'Delete?', variant: 'alert' })).toBe(
      `${themeGlyphs.default.mark.danger} Delete?`,
    );
    expect(dialogVariants.values.variant).toEqual(['default', 'alert']);
  });
});
