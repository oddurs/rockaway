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
const { Frame } = await import('@rockaway/react');

function Page() {
  return createElement(
    'main',
    null,
    createElement(Frame, { title: 'server' }, 'Rendered by a server component.'),
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

console.log('server component rendered Frame as a client reference');
