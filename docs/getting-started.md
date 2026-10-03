# Getting started

Install three packages, import two stylesheets, and render a screen. With
Vite it is seventeen lines, counting the install. The end of the page shows
what you should see, as text, because that is what a screen is.

## What it will not do

Say it before the install, so nobody finds it out after:

- **No arbitrary sizes.** Every size is a whole number of cells, one character
  wide and one row tall. You write counts (`cols={40}`, `var(--rk-x-2)`), never
  pixels.
- **No radii, no shadows, no type scale.** A heading is bold or in capitals,
  never bigger. A surface is its border.
- **No emoji.** How wide an emoji is depends on the font, so it cannot be held
  to a cell. The system leaves them out rather than guess.
- **No easing.** Motion is frames on a tick, the way a terminal redraws.

What you get for that is in [the concept](concept.md): chrome that is text,
screens you can diff, and a palette your terminal already has.

## Install

```sh
npm install @rockaway/react @rockaway/css @rockaway/tokens
```

`@rockaway/react` brings the engine, `@rockaway/grid`, with it. React 19 is a
peer dependency.

> **Nothing is on npm yet.** Until the first release, build the packages from
> the repository (`pnpm install && pnpm build`), run `pnpm pack` in each of
> `packages/grid`, `tokens`, `css` and `react`, and install the four tarballs
> instead.

## With Vite

Start from Vite's React template (`npm create vite@latest my-app -- --template
react-ts`), install the packages, and replace two files.

The stylesheets go first, once, at the entry: the system's CSS, then the
tokens it reads. In `src/main.tsx`:

```tsx quickstart="vite" file="src/main.tsx"
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
```

Then a screen. `Frame` is a box drawn in cells, with real elements inside it.
In `src/App.tsx`:

```tsx quickstart="vite" file="src/App.tsx"
import { Button, Frame } from '@rockaway/react';

export function App() {
  return (
    <Frame title="hello" cols={32} rows={5}>
      <p>A screen, in cells.</p>
      <Button>Continue</Button>
    </Frame>
  );
}
```

`npm run dev`, and that is the whole of it.

## With Next.js

The app router works as it is, server components included. Start from
`npx create-next-app@latest my-app --app --no-tailwind`, install the packages,
and replace two files.

The stylesheets go in the root layout, so every page has them. In
`app/layout.tsx`:

```tsx quickstart="next" file="app/layout.tsx"
import '@rockaway/css';
import '@rockaway/tokens/tokens.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

A page can be a server component. The components it renders are client
components already (each one starts with `'use client'`), so there is nothing
to mark. In `app/page.tsx`:

```tsx quickstart="next" file="app/page.tsx"
import { Button, Frame } from '@rockaway/react';

export default function Page() {
  return (
    <Frame title="hello" cols={32} rows={5}>
      <p>A screen, in cells.</p>
      <Button>Continue</Button>
    </Frame>
  );
}
```

## What you should see

The same screen from either, as text: the frame's border, its title set into
the top edge, and the two elements inside it, each on a whole row.

```text quickstart="screen"
┌ hello ───────────────────────┐
│ A screen, in cells.          │
│ [ Continue ]                 │
│                              │
└──────────────────────────────┘
```

The border is drawn by the cell, not the font, so it joins up whatever font
you use. The title is the frame's accessible name: a screen reader hears
"hello, group", then the text and a button, and never a `┌`.

## Next

- **Make it yours.** The tokens are custom properties. Every theme ships as a
  stylesheet and applies to whatever element carries it:
  `import '@rockaway/tokens/themes/nord.css'`, then `data-rk-theme="nord"`.
- **Use your font.** The cell is your font's: set `--rk-font-family-mono` to
  any monospace family and every size follows it.
- **Build your own component** on the grid: every component is held to [the
  same ten rules](concept.md#the-contract-a-component-is-held-to). A
  step-by-step recipe is being written.
- **Read why** it works this way: [the concept](concept.md).
