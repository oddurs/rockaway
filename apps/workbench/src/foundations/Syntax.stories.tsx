import { syntaxRoles } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/**
 * Syntax (cairn 0144): every role a highlighter can give a token, as the
 * site's pipeline writes it, `<span class="rk-syntax-keyword">`. axe checks
 * each against the code block's ground in light and dark, alongside the
 * contrast gate in the tokens.
 */
const sample: ReadonlyArray<readonly [string, string]> = [
  ['comment', '// the heavier of each side wins'],
  ['keyword', 'export function'],
  ['function', 'mergeEdges'],
  ['plain', '(a, b): '],
  ['type', 'Edges'],
  ['plain', ' { '],
  ['keyword', 'return'],
  ['plain', ' a.'],
  ['attribute', 'north'],
  ['plain', ' '],
  ['constant', '>= 2'],
  ['plain', ' ? '],
  ['string', "'heavy'"],
  ['plain', ' : '],
  ['regexp', '/^light$/'],
  ['plain', '; }'],
  ['inserted', '+ added'],
  ['deleted', '- removed'],
  ['error', 'unterminated'],
];

function Syntax() {
  return (
    <div className="rk-prose">
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a code block scrolls, so it takes a tab stop */}
      <pre tabIndex={0}>
        <code>
          {sample.map(([role, text], i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed sample
              key={i}
              className={role === 'plain' ? undefined : `rk-syntax-${role}`}
              data-role={role}
            >
              {text}
              {role === 'comment' || role === 'inserted' || role === 'deleted' ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

const meta = {
  title: 'Foundations/Syntax',
  component: Syntax,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Syntax>;

export default meta;
type Story = StoryObj<typeof meta>;

const colourOf = (value: string): string => {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};

async function eachRoleIsItsToken(canvasElement: HTMLElement): Promise<void> {
  for (const role of syntaxRoles) {
    if (role === 'plain') continue;
    const span = canvasElement.querySelector(`.rk-syntax-${role}`);
    await expect(span, role).not.toBeNull();
    if (!span) continue;
    await expect(getComputedStyle(span).color, role).toBe(colourOf(`var(--rk-syntax-${role})`));
  }
  // What matters reads without colour: comments are italic, errors underlined.
  const style = (role: string) =>
    getComputedStyle(canvasElement.querySelector(`.rk-syntax-${role}`) as Element);
  await expect(style('comment').fontStyle).toBe('italic');
  await expect(style('error').textDecorationLine).toBe('underline');
  await expect(style('keyword').fontStyle).toBe('normal');
}

export const Light: Story = {
  play: async ({ canvasElement }) => eachRoleIsItsToken(canvasElement),
};

export const Dark: Story = {
  globals: { mode: 'dark' },
  play: async ({ canvasElement }) => eachRoleIsItsToken(canvasElement),
};

/** A change of mode recolours code at once: the colours are custom properties. */
export const SwitchingMode: Story = {
  name: 'Switching mode',
  play: async ({ canvasElement }) => {
    const keyword = canvasElement.querySelector('.rk-syntax-keyword') as Element;
    const root = document.documentElement;
    const was = root.dataset.theme;
    try {
      root.dataset.theme = 'light';
      const light = getComputedStyle(keyword).color;
      root.dataset.theme = 'dark';
      const dark = getComputedStyle(keyword).color;
      await expect(dark).not.toBe(light);
      await expect(dark).toBe(colourOf('var(--rk-syntax-keyword)'));
    } finally {
      if (was === undefined) delete root.dataset.theme;
      else root.dataset.theme = was;
    }
  },
};
