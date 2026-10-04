/**
 * A server component that renders `Frame` (cairn 0121).
 *
 * Run under the `react-server` condition, as a server-component bundler runs
 * server code. React there has no hooks and no context, so any module that
 * needs them has to be a client boundary. React's own loader turns each module
 * that begins with `'use client'` into client references, the way Next.js or
 * Parcel does, and everything else runs for real: if a component lost its
 * directive, its import of `useMemo` or of React Aria would fail here.
 *
 * The package is imported by name, so it resolves through `exports` to `dist`
 * rather than to source. Build first.
 */
import { register } from 'node:module';
import { Writable } from 'node:stream';

// React's loader expects each module's source as a string, where Node hands it
// a buffer, and it follows a `sourceMappingURL` without resolving it against
// the module. A hook beneath it decodes the text and drops the source-map
// comment, which nothing here needs. Hooks registered later run first, so this
// one goes in before React's.
const sourceAsText = `export async function load(url, context, next) {
  const result = await next(url, context);
  if (result.format !== 'module' || typeof result.source === 'string') return result;
  const text = new TextDecoder().decode(result.source);
  return { ...result, source: text.replace(/^\\/\\/# sourceMappingURL=.*$/m, '') };
}`;
register(`data:text/javascript,${encodeURIComponent(sourceAsText)}`);

// Before anything imports the package, so its modules go through the loader.
register('react-server-dom-webpack/node-loader', import.meta.url);

const { createElement } = await import('react');
const { renderToPipeableStream } = await import('react-server-dom-webpack/server');
const { Frame, GlyphProvider } = await import('@rockaway/react');
const { themeGlyphs } = await import('@rockaway/tokens');

// The theme's glyphs are plain data, so a server component can choose them
// and hand them across the boundary to the provider (cairn 0119).
function Page() {
  return createElement(
    'main',
    null,
    createElement(
      GlyphProvider,
      { glyphs: themeGlyphs.ink },
      createElement(Frame, { title: 'server' }, 'Rendered by a server component.'),
    ),
  );
}

/** A client manifest that knows every module: there is no client bundle here. */
const manifest = new Proxy(
  {},
  {
    get: (_, key) => {
      const [id, name] = String(key).split('#');
      return { id, chunks: [], name };
    },
  },
);

const flight = await new Promise<string>((resolve, reject) => {
  let text = '';
  const sink = new Writable({
    write(chunk, _encoding, done) {
      text += String(chunk);
      done();
    },
    final(done) {
      resolve(text);
      done();
    },
  });
  renderToPipeableStream(createElement(Page), manifest, { onError: reject }).pipe(sink);
});

// `Frame` reaches the client as an import of its own module, not as markup.
const imported = /^\w+:I\[.*,"Frame"\]$/m.test(flight);
const fromItsModule = flight.includes('/dist/components/frame.js"');
if (!imported || !fromItsModule) {
  console.error(flight);
  throw new Error('Frame was not sent as a client reference to components/frame.js.');
}
const provider = /^\w+:I\[.*,"GlyphProvider"\]$/m.test(flight);
if (
  !provider ||
  !flight.includes('/dist/glyphs.js"') ||
  !flight.includes('"borderSet":"rounded"')
) {
  console.error(flight);
  throw new Error('GlyphProvider was not sent as a client reference with the theme as its props.');
}

// The pure halves are real functions on the server, not client references
// (0126): a server component can draw a frame, or format a chord, itself.
const pure = await import('@rockaway/react');
const drawn = pure.frameBuffer({ width: 12, height: 3 }, { title: 'server' }).row(0);
const checks: [string, unknown, unknown][] = [
  ['frameBuffer', drawn, '┌ server ──┐'],
  ['dividerBuffer', pure.dividerBuffer({ width: 6, height: 1 }).row(0), '╶────╴'],
  ['scrollbarBuffer', pure.scrollbarBuffer({ total: 4, visible: 2, offset: 0 }).row(0), '█'],
  ['formatKeys', pure.formatKeys('mod+s', 'apple'), '⌘S'],
  ['buttonBuffer', pure.buttonBuffer('Go').row(0), '[ Go ]'],
  [
    'fieldFrameBuffer',
    pure.fieldFrameBuffer({ width: 12, height: 3 }, { label: 'Name', required: true }).row(0),
    '┌ Name* ───┐',
  ],
  [
    'formBuffer',
    pure.formBuffer([{ label: 'Name', control: pure.buttonBuffer('Go') }], { width: 64 }).row(0),
    `Name   [ Go ]${' '.repeat(51)}`,
  ],
  [
    'calloutBuffer',
    pure.calloutBuffer({ width: 14, height: 3 }, { tone: 'tip' }).row(0),
    '╭ ✓ Tip ─────╮',
  ],
  [
    'treeBuffer',
    pure
      .treeBuffer({
        rows: [
          { label: 'src', level: 1, last: [], branch: true, expanded: true },
          { label: 'a.ts', level: 2, last: [true] },
        ],
        width: 10,
      })
      .row(1),
    ' └── a.ts ',
  ],
  [
    'panesBuffer',
    pure
      .panesBuffer({ width: 16, height: 3 }, { panes: [{ size: 6, title: 'a' }, { title: 'b' }] })
      .row(0),
    '┌ a ───┬ b ────┐',
  ],
  [
    'statusBarBuffer',
    pure
      .statusBarBuffer(16, [
        { text: 'NORMAL', variant: 'mode' },
        { text: '1:1', align: 'end' },
      ])
      .row(0),
    ' NORMAL     1:1 ',
  ],
  [
    'tableBuffer',
    pure.tableBuffer({ columns: [{ header: 'Name' }], rows: [{ cells: ['a.ts'] }] }).row(0),
    '┌──────┐',
  ],
  [
    'keymapHelpBuffer',
    pure.keymapHelpBuffer([{ keys: 'mod+k', description: 'Palette' }], 'apple').row(0),
    '⌘K  Palette',
  ],
];
for (const [name, got, want] of checks) {
  if (got !== want)
    throw new Error(`${name} on the server gave ${String(got)}, not ${String(want)}`);
}

console.log(
  'server component rendered GlyphProvider and Frame as client references, and called the buffer functions',
);
