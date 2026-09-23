import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import './container/container.demo.css';
import { text } from '../text.ts';

/**
 * Container queries (cairn 0029). The same card, at one window size, in two
 * different amounts of space.
 */
function Card({ label }: { label: string }) {
  return (
    <article className="demo-card" aria-label={label}>
      <div className="demo-card__media" />
      <div>
        <h3 style={{ ...text('heading') }}>{label}</h3>
        <p style={{ color: 'var(--rk-fg-muted)' }}>Answers to its container, not the window.</p>
      </div>
    </article>
  );
}

function Containers() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'calc(var(--rk-space-6) * 1ch)',
        padding: 'calc(var(--rk-space-6) * 1ch)',
        alignItems: 'flex-start',
      }}
    >
      <div className="rk-container" style={{ inlineSize: 280 }}>
        <Card label="In a sidebar" />
      </div>
      <div className="rk-container" style={{ inlineSize: 640 }}>
        <Card label="In a main column" />
      </div>
    </div>
  );
}

const meta = { title: 'Foundations/Container queries', component: Containers } satisfies Meta<
  typeof Containers
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SameCardTwoSpaces: Story = {
  name: 'Same card, two spaces',
  play: async ({ canvas }) => {
    const narrow = canvas.getByRole('article', { name: 'In a sidebar' });
    const wide = canvas.getByRole('article', { name: 'In a main column' });

    // One window, two answers.
    await expect(getComputedStyle(narrow).flexDirection).toBe('column');
    await expect(getComputedStyle(wide).flexDirection).toBe('row');

    // The container is named, so a component asks about this ancestor only.
    const wrapper = narrow.parentElement as HTMLElement;
    await expect(getComputedStyle(wrapper).containerName).toBe('rk');
    await expect(getComputedStyle(wrapper).containerType).toBe('inline-size');

    // Widen the narrow one: the card rearranges without the window changing.
    wrapper.style.inlineSize = '640px';
    await expect(getComputedStyle(narrow).flexDirection).toBe('row');
    wrapper.style.inlineSize = '280px';
  },
};
