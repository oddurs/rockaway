import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/**
 * The base layer (cairn 0025): what plain HTML looks like with nothing but
 * `@rockaway/css` and the tokens loaded.
 */
function Prose() {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rk-space-4)',
        maxWidth: '68ch',
        padding: 'var(--rk-space-6)',
      }}
    >
      <h1>Timeless bones, any skin</h1>
      <p>
        A design system with an opinionated default and a themable skin. Every value derives from
        five theme inputs, and <a href="#anchor">the accent colour</a> marks a link.
      </p>
      <h2>Headings step down the scale</h2>
      <h3>Each one maps to a text style</h3>
      <h4>Rather than to a browser default</h4>
      <p>
        Inline <code>code</code> and a <kbd>⌘K</kbd> keep the mono stack.{' '}
        <small>Small print stays readable.</small>
      </p>
      <hr />
      <table>
        <caption style={{ textAlign: 'left' }}>Numbers line up</caption>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: 'left' }}>
              Token
            </th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>space.4</td>
            <td style={{ textAlign: 'right' }}>16</td>
          </tr>
          <tr>
            <td>space.11</td>
            <td style={{ textAlign: 'right' }}>44</td>
          </tr>
        </tbody>
      </table>
      <label htmlFor="qty">
        Quantity
        <input id="qty" type="number" defaultValue={11} style={{ display: 'block' }} />
      </label>
    </article>
  );
}

const meta = { title: 'Foundations/Base', component: Prose } satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prose_: Story = {
  name: 'Prose',
  play: async ({ canvas }) => {
    const style = (el: Element) => getComputedStyle(el);
    const h1 = canvas.getByRole('heading', { level: 1 });
    const h2 = canvas.getByRole('heading', { level: 2 });
    const body = document.body;

    // One size on a character grid (0075): a heading is weight and case, not
    // a bigger font.
    await expect(style(h1).fontSize).toBe(style(body).fontSize);
    await expect(style(h2).fontSize).toBe(style(body).fontSize);
    await expect(style(h1).fontWeight).toBe('700');
    await expect(style(h1).textTransform).toBe('uppercase');

    // The body is monospace, because every cell is one character wide.
    await expect(style(body).fontFamily.toLowerCase()).toMatch(/mono|menlo|consolas|ui-monospace/);

    // Numbers line up where they must.
    await expect(style(canvas.getAllByRole('cell')[0] as Element).fontVariantNumeric).toBe(
      'tabular-nums',
    );
    await expect(style(canvas.getByLabelText('Quantity')).fontVariantNumeric).toBe('tabular-nums');
  },
};

export const Dark: Story = { name: 'Prose (dark)', globals: { mode: 'dark' } };
