// One line per module, sorted by path (cairn 0122). A component's line re-exports its entry,
// `src/entries/<name>.ts`, which is also `@rockaway/react/<name>` and the one place that names what
// the component makes public (cairn 0165): `export *` from an entry adds nothing the entry did not
// list, so a value a component exports for its tests or metadata stays private. Every other module
// lists its names here. A new component adds one line and touches no other; `merge=union` in
// .gitattributes joins lines that parallel branches add, and test/barrels.test.ts fails if a
// component is missing, has no entry, or is listed twice.
export { CELL_COVER_GRACE, CELL_SNAP, CELL_TIE, type CellMetrics, cellsCovering, cellsIn, DEFAULT_CELL, floorCell, measureCell, nearestCell } from './cell-metrics.ts';
export { cx } from './cx.ts';
export * from './entries/badge.ts';
export * from './entries/button.ts';
export * from './entries/callout.ts';
export * from './entries/checkbox.ts';
export * from './entries/code-block.ts';
export * from './entries/divider.ts';
export * from './entries/field.ts';
export * from './entries/fieldset.ts';
export * from './entries/frame.ts';
export * from './entries/key-hint.ts';
export * from './entries/keymap.ts';
export * from './entries/link.ts';
export * from './entries/list.ts';
export * from './entries/meter.ts';
export * from './entries/overlay.ts';
export * from './entries/panes.ts';
export * from './entries/progress.ts';
export * from './entries/sparkline.ts';
export * from './entries/spinner.ts';
export * from './entries/table.ts';
export * from './entries/text-field.ts';
export * from './entries/tree.ts';
export { GlyphProvider, type GlyphProviderProps, useGlyphs } from './glyphs.tsx';
export { Chrome, type ChromeProps, chromeRows, type PaintOptions, paintCells, paintGlyph, paintRule, type Run, rowRuns, type StrokeStyle, shapeAttributes } from './paint/index.ts';
export { detectPlatform, type PlatformHints, usePlatform } from './platform.ts';
export { type Inset, type PainterName, renderScreenToText, Screen, type ScreenProps, type Surface } from './screen.tsx';
export { markOverflow, type OverflowMarkOptions, scrollStateQueries, watchOverflowMarks } from './scroll.ts';
export { selectionLines, watchSelection } from './selection.ts';
export { useReducedMotion, useTick } from './tick.ts';
export { defineVariants, type VariantAttributes, type VariantDefinition, type VariantInput, type VariantProps, type VariantSelection, type Variants, type VariantValue, type VariantValues } from './variants.ts';
