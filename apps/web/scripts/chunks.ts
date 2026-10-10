/** Which chunks a page loads, how big each is, and a hint of what is in it. Not a test. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const out = path.join(import.meta.dirname, '..', 'out');
const page = process.argv[2] ?? 'index.html';
const html = readFileSync(path.join(out, page), 'utf8');
const marks = (
  process.env.MARKS ??
  'react-aria,usePress,useFocusRing,useHover,I18nProvider,useLocale,Intl.,LiveAnnouncer,useKeyboard,PressResponder,rk-panes,rk-statusbar,rk-link-tree,rk-button,rk-keyhint,KeymapEngine,themeGlyphs,borderSets,syntaxRoles,__reactFiber,next-router,shapeOf,junction'
).split(',');
for (const m of html.matchAll(/<script(?![^>]*noModule)[^>]*src="[^"]*?(\/_next\/[^"]+\.js)"/gi)) {
  const src = m[1] as string;
  const body = readFileSync(path.join(out, src));
  const text = body.toString('utf8');
  const found = marks.filter((mark) => text.includes(mark));
  console.log(
    String(gzipSync(body, { level: 9 }).length).padStart(7),
    src.split('/').at(-1),
    found.join(' '),
  );
}
