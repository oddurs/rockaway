import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { toolbarBuffer, toolbarFit } from '../src/components/toolbar.pure.ts';
import { Toolbar, ToolbarButton } from '../src/components/toolbar.tsx';

const GROUPS = [
  ['Bold', 'Italic'],
  ['Undo', 'Redo'],
];

describe('toolbarBuffer', () => {
  test('a cell in, a cell between commands, a rule a cell either side between groups', () => {
    expect(toText(toolbarBuffer(GROUPS))).toBe(' Bold Italic │ Undo Redo');
  });

  test('too narrow, what is past the end folds into the ellipsis in the last cell', () => {
    // Bold Italic is 13 cells; 15 has room for them and the ellipsis's two.
    expect(toolbarFit(GROUPS, 26)).toBe(4);
    expect(toolbarFit(GROUPS, 15)).toBe(2);
    expect(toText(toolbarBuffer(GROUPS, { width: 15 }))).toBe(' Bold Italic  …');
    expect(toText(toolbarBuffer(GROUPS, { width: 26 }))).toBe(' Bold Italic │ Undo Redo');
  });

  test("the rule and the ellipsis are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(toText(toolbarBuffer(GROUPS, {}, ascii))).toBe(' Bold Italic | Undo Redo');
  });
});

describe('Toolbar, with no script', () => {
  test('a named toolbar of buttons, no ellipsis until something folds', () => {
    const html = renderToStaticMarkup(
      createElement(Toolbar, { label: 'Format' }, createElement(ToolbarButton, null, 'Bold')),
    );
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-label="Format"');
    expect(html).toContain('data-rk-rhythm=""');
    expect(html).not.toContain('rk-toolbar-more');
  });
});
