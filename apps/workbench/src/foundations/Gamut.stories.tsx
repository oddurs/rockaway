import { pairs } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/**
 * Colour gamut (cairn 0163). The tokens write a base value for every colour
 * and an override for p3 screens, and a pair has to hold on both. These
 * stories run on an sRGB screen and on a p3 one (see vitest.config.ts), and
 * axe measures every text pair the way Chromium reports it there.
 */
const text = pairs.filter((pair) => pair.min >= 4.5);

function Pairs({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <section
      aria-label={`${mode} pairs`}
      data-theme={mode}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, calc(var(--rk-cell-width) * 20))',
        background: 'var(--rk-bg-page)',
      }}
    >
      {text.flatMap((pair) =>
        pair.bg.map((bg) => (
          <span
            key={`${pair.fg} ${bg}`}
            style={{
              color: `var(--rk-${pair.fg.replaceAll('.', '-')})`,
              background: `var(--rk-${bg.replaceAll('.', '-')})`,
            }}
          >
            {pair.fg.split('.').at(-1)} on {bg.split('.').slice(1).join(' ')}
          </span>
        )),
      )}
    </section>
  );
}

function Both() {
  return (
    <div style={{ display: 'grid', gap: 'var(--rk-y-1)' }}>
      <Pairs mode="light" />
      <Pairs mode="dark" />
    </div>
  );
}

const meta = {
  title: 'Foundations/Colour gamut',
  component: Both,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Both>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every declared text pair, in both modes. axe fails the story if one reads below its minimum. */
export const TextPairs: Story = {
  name: 'Text pairs',
  play: async ({ canvas }) => {
    const spans = canvas.getAllByText(/ on /);
    expect(spans.length).toBe(2 * text.reduce((n, pair) => n + pair.bg.length, 0));
  },
};

/**
 * On a p3 screen the p3 overrides are what is drawn: green here is wider than
 * sRGB can show. This is the screen the Badge stories failed on.
 */
export const P3Screen: Story = {
  name: 'On a p3 screen',
  tags: ['p3'],
  play: async ({ canvas }) => {
    await expect(matchMedia('(color-gamut: p3)').matches).toBe(true);
    const success = canvas.getAllByText(/^success on /)[0] as HTMLElement;
    const [, , chroma] =
      /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(getComputedStyle(success).color) ?? [];
    // sRGB tops out near 0.153 at this lightness and hue; the override is 0.16.
    await expect(Number(chroma)).toBeGreaterThan(0.155);
  },
};
