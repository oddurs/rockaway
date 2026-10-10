/**
 * Home (cairn 0108, inside the app since the move to Next): the first page of
 * the docs app, not a page apart. The claim, the live drawing, then the
 * system shown as software, three screens built from its real components,
 * then the rules, ten lines of code and the install.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Code } from '../components/Code.tsx';
import { Drawing } from '../components/Drawing.tsx';
import {
  DeploysShot,
  GitClientShot,
  HelloScreen,
  InstallScreen,
  SettingsShot,
} from '../components/HomeLive.tsx';
import { ScrollRegion } from '../components/ScrollRegion.tsx';
import { PageBody } from '../components/shell/PageBody.tsx';
import { drawing, SERVER_SIZE } from '../lib/drawing.ts';
import { pageMetadata } from '../lib/pages.ts';
import { screenHtml } from '../lib/painted.ts';

export const metadata: Metadata = pageMetadata('');

const app = `
export function App() {
  return (
    <Frame title="hello" cols={32} rows={5}>
      <p>A screen, in cells.</p>
      <Button>Continue</Button>
    </Frame>
  );
}`;

const first = screenHtml(drawing(SERVER_SIZE, { boxes: [], weight: 'light' }), {
  role: 'application',
  'aria-roledescription': 'drawing',
  'aria-label':
    'Boxes joined by the junction table. Drag across it, or use the arrow keys and Enter, to draw another.',
});

export default function Home(): ReactNode {
  return (
    <PageBody title="home">
      <article className="rk-prose site-home">
        <h1>Terminal interfaces, on the web</h1>
        <p>
          <strong>rockaway is a design system that draws on a grid of character cells.</strong>{' '}
          Every box is laid out by a small engine, and every page is still a web page: links, a
          keyboard, a screen reader, a phone, and no JavaScript needed to read it. This site is
          built with it.
        </p>
        <p className="site-actions">
          <Link href="/getting-started">Get started</Link>
          <Link href="/components">See the components</Link>
          <a href="https://github.com/oddurs/rockaway">Read the source</a>
        </p>
        <Drawing html={first} />
        <p>
          That is drawn live. Drag across it to draw a box, or <kbd>Tab</kbd> to it and use the
          arrows and <kbd>Enter</kbd>; <kbd>1</kbd>, <kbd>2</kbd> and <kbd>3</kbd> change the
          weight. However the boxes cross, they meet in the right junction, because no character is
          stored, only edges.
        </p>

        <h2 id="software">Software, not pages</h2>
        <p>
          Panes that split and stack, a status bar that gives way by priority, trees and tables that
          take the keyboard: the parts of a real tool, each a component. This site is one; here is a
          git client.
        </p>
        <figure className="site-shot">
          <ScrollRegion label="A git client">
            <div inert>
              <GitClientShot />
            </div>
          </ScrollRegion>
          <figcaption>
            <Link href="/components/panes">Panes</Link>, a{' '}
            <Link href="/components/link-tree">LinkTree</Link> and a{' '}
            <Link href="/components/status-bar">StatusBar</Link>.
          </figcaption>
        </figure>

        <h2 id="forms">Forms on the grid</h2>
        <p>
          A field is a label, a box and a line for its error, each a whole number of cells, and
          every control is React Aria's underneath, so it reads, focuses and submits like a form
          should.
        </p>
        <figure className="site-shot">
          <ScrollRegion label="A settings screen">
            <div inert>
              <SettingsShot />
            </div>
          </ScrollRegion>
          <figcaption>
            A <Link href="/components/frame">Frame</Link> and{' '}
            <Link href="/components/button">Buttons</Link>, with the theme's marks for the choices.
          </figcaption>
        </figure>

        <h2 id="data">Data, in columns</h2>
        <p>
          A table is cut to its columns and scrolls by them, sorts from its header, and says how
          many rows it has. A badge says a state in a word and a mark, never in colour alone.
        </p>
        <figure className="site-shot">
          <ScrollRegion label="A deploys dashboard">
            <div inert>
              <DeploysShot />
            </div>
          </ScrollRegion>
          <figcaption>
            A <Link href="/components/table">Table</Link> and{' '}
            <Link href="/components/badge">Badges</Link> in a Frame.
          </figcaption>
        </figure>

        <h2 id="rules">Three rules</h2>
        <ol>
          <li>
            <strong>Every size is a count of cells.</strong> One character across, one line down,
            and never half of one. You write <code>cols={'{40}'}</code>, never pixels.
          </li>
          <li>
            <strong>Every border is edges on a cell.</strong> The character is looked up from the
            edges when the drawing is done, so two boxes cannot be joined wrong.
          </li>
          <li>
            <strong>It is still the web.</strong> Real elements sit over the drawing, so it reads
            aloud, links, zooms, takes a keyboard, and fits a phone forty cells wide.
          </li>
        </ol>

        <h2 id="code">Ten lines</h2>
        <Code code={app} lang="tsx" />
        <p>Which draws this, rendered by the component on the server:</p>
        <ScrollRegion label="What it draws">
          <HelloScreen />
        </ScrollRegion>

        <h2 id="install">Install</h2>
        <ScrollRegion label="The install line">
          <InstallScreen />
        </ScrollRegion>
        <p>
          <strong>Not on npm yet.</strong> The first release, 0.1.0, is being made; until then{' '}
          <Link href="/getting-started">getting started</Link> says how to install it from the
          repository.
        </p>
      </article>
    </PageBody>
  );
}
