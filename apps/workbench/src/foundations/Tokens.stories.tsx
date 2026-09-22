import { vars } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  Motion,
  Palettes,
  SemanticColours,
  SpaceAndShape,
  Typography,
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

export const Type: Story = { name: 'Typography', render: () => <Typography /> };

export const Shape: Story = { name: 'Space and shape', render: () => <SpaceAndShape /> };

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
