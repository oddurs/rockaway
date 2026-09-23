import { vars } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  Attributes,
  Cells,
  Glyphs,
  Motion,
  Palettes,
  SemanticColours,
} from './tokens/Reference.tsx';
import { docs, group } from './tokens/walk.ts';

/**
 * The token reference (cairn 0023), generated from the DTCG files. Every page
 * is also a test: axe runs on it, and the checks below compare it with the CSS.
 */
const meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PaletteSteps: Story = { name: 'Palettes', render: () => <Palettes /> };

export const Semantic: Story = {
  name: 'Semantic colours',
  render: () => <SemanticColours />,
  play: async ({ canvas }) => {
    const count = ['bg', 'fg', 'border'].flatMap((g) => group(docs.semantic, g)).length;
    // One row per token plus a header row per table.
    await expect(canvas.getAllByRole('row')).toHaveLength(count + 3);
  },
};

export const CellsPage: Story = {
  name: 'Cells',
  render: () => <Cells />,
  play: async ({ canvas }) => {
    // Counts, not lengths: a space token says how many cells, and nothing else.
    await expect(canvas.getByText('space.4')).toBeVisible();
    const row = canvas.getByText('space.4').closest('tr') as HTMLElement;
    await expect(row.textContent).toContain('4');
    await expect(row.textContent).not.toContain('px');
  },
};

export const GlyphsPage: Story = {
  name: 'Glyphs',
  render: () => <Glyphs />,
  play: async ({ canvas }) => {
    // Every set is documented, and ASCII is a set rather than a fallback.
    for (const set of ['single', 'double', 'heavy', 'rounded', 'ascii']) {
      await expect(canvas.getByText(set)).toBeVisible();
    }
    const ascii = canvas.getByText('ascii').closest('tr') as HTMLElement;
    await expect(ascii.textContent).toContain('+');
    await expect(ascii.textContent).not.toContain('┌');
  },
};

export const AttributesPage: Story = {
  name: 'Attributes',
  render: () => <Attributes />,
  play: async ({ canvas }) => {
    const reverse = canvas.getAllByText('the quick brown fox')[2] as HTMLElement;
    const body = getComputedStyle(document.body);
    await expect(getComputedStyle(reverse).backgroundColor).toBe(body.color);
  },
};

export const Timing: Story = {
  name: 'Motion',
  render: () => <Motion />,
  play: async () => {
    // Every token in the name map resolves to a value in the compiled CSS.
    const root = getComputedStyle(document.documentElement);
    const missing = Object.values(vars)
      .map((v) => v.slice(4, -1))
      .filter((name) => root.getPropertyValue(name).trim() === '');
    await expect(missing).toEqual([]);
  },
};
