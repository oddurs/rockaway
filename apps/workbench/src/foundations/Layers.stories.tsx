import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import './layers/layers.demo.css';

/**
 * The cascade layers (cairn 0024). Component styles live in `rk.components`,
 * so a consuming app's own unlayered CSS wins without `!important`.
 */
function Layers() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--rk-space-4)',
        padding: 'var(--rk-space-6)',
      }}
    >
      <div className="demo-surface" data-testid="component">
        A component style, in <code>@layer rk.components</code>
      </div>
      <div className="demo-surface demo-layered-override" data-testid="layered">
        Overridden from <code>@layer rk.overrides</code>
      </div>
      <div className="demo-surface demo-consumer-override" data-testid="consumer">
        Overridden by unlayered consumer CSS, no <code>!important</code>
      </div>
      <div className="demo-reference-success" data-testid="success" style={{ height: 1 }} />
      <div className="demo-reference-warning" data-testid="warning" style={{ height: 1 }} />
    </div>
  );
}

const meta = { title: 'Foundations/Cascade layers', component: Layers } satisfies Meta<
  typeof Layers
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Order: Story = {
  play: async ({ canvas }) => {
    const bg = (id: string) => getComputedStyle(canvas.getByTestId(id)).backgroundColor;

    // A later layer beats an earlier one.
    await expect(bg('layered')).toBe(bg('warning'));
    await expect(bg('layered')).not.toBe(bg('component'));

    // Unlayered consumer CSS beats every layer, with no !important anywhere.
    await expect(bg('consumer')).toBe(bg('success'));
    await expect(document.styleSheets.length).toBeGreaterThan(0);
  },
};
