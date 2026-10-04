import { Badge, Button, KeyHint, Link } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';

/*
 * The components a sentence holds, in a sentence, from a server. A paragraph
 * holds phrasing content only: a browser parsing the page ends the `<p>` at a
 * `div`, so the tree it builds is not the one the server rendered, and
 * hydration fails on it. Each case is rendered inside a `<p>` on the server,
 * parsed as a whole page is, and hydrated. `phrasing.test.ts` in
 * @rockaway/react checks the elements themselves.
 */

/** Each case by name, drawn fresh for the server and again for hydration. */
const CASES: readonly (readonly [string, () => ReactElement])[] = [
  ['a key hint', () => <KeyHint keys="mod+s">save</KeyHint>],
  ['a decorative key hint', () => <KeyHint keys="esc" decorative />],
  ['a link', () => <Link href="#phrasing">a link</Link>],
  [
    'a link to a new tab',
    () => (
      <Link href="#phrasing" target="_blank">
        a link
      </Link>
    ),
  ],
  ['a badge', () => <Badge tone="success">ready</Badge>],
  [
    'a button holding a key hint',
    () => (
      <Button>
        Save <KeyHint keys="mod+s" decorative />
      </Button>
    ),
  ],
];

function Hosts() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1lh' }}>
      {CASES.map(([name]) => (
        <div key={name} data-testid={name} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Grid/Phrasing',
  component: Hosts,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Hosts>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One case in a sentence, as the server sends it. */
function sentence(element: ReactElement): ReactElement {
  return <p style={{ margin: 0 }}>Press {element} to go on.</p>;
}

export const InASentence: Story = {
  name: 'In a sentence, from a server',
  play: async ({ canvas }) => {
    for (const [name, draw] of CASES) {
      const host = canvas.getByTestId(name);
      const html = renderToString(sentence(draw()));
      // Parsed as a page is, not as `innerHTML` into a `<p>`, which keeps a
      // `div` where a page's parser would end the paragraph at it.
      const page = new DOMParser().parseFromString(`<!doctype html><body>${html}`, 'text/html');
      await expect(page.body.children.length, `${name}: one paragraph`).toBe(1);
      host.replaceChildren(...[...page.body.childNodes].map((node) => document.adoptNode(node)));

      const errors: unknown[] = [];
      const root = hydrateRoot(host, sentence(draw()), {
        onRecoverableError: (error) => errors.push(error),
      });
      await waitFor(() => expect(host.querySelector('p')?.textContent).toContain('to go on.'));
      await expect(errors, `${name}: hydrates`).toEqual([]);
      await expect(host.children.length, `${name}: still one paragraph`).toBe(1);
      root.unmount();
    }
  },
};
