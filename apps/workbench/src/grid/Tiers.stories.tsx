import { Buffer, drawBox, flow, rect, rhythm, type Size } from '@rockaway/grid';
import { Flow, Screen } from '@rockaway/react';
import { checkConformance, formatReport } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor } from 'storybook/test';
import { measured } from '../settled.ts';

/**
 * The grid's three tiers (cairn 0311): structure on whole cells, rhythm on
 * half-steps, and seams that close a rhythm block back onto whole cells so
 * nothing after it moves off the grid.
 */

const draw = ({ width, height }: Size): Buffer =>
  Buffer.create({ width, height }).draw((d) => {
    if (width >= 2 && height >= 2) drawBox(d, rect(0, 0, width, height));
  });

function Block({ children }: { children: ReactNode }) {
  return <div style={{ blockSize: 'var(--rk-cell-height)' }}>{children}</div>;
}

/** Two one-row blocks a comfortable gap apart, and a marker after the flow. */
function Tiers({ comfort }: { comfort?: 'compact' | 'comfortable' | 'spacious' }) {
  return (
    <div data-testid="host">
      <Screen draw={draw} cols={30} rows={12} contentInset={{ x: 2, y: 1 }}>
        <Flow data-testid="flow" {...(comfort === undefined ? {} : { comfort })}>
          <Block>Name</Block>
          <Block>Email</Block>
        </Flow>
        <div data-testid="after" style={{ blockSize: 'var(--rk-cell-height)' }}>
          after the seam
        </div>
      </Screen>
    </div>
  );
}

const meta = { title: 'Grid/Tiers', component: Tiers } satisfies Meta<typeof Tiers>;
export default meta;
type Story = StoryObj<typeof meta>;

const cell = (el: Element): number => {
  const probe = (el.closest('.rk-screen') ?? el) as HTMLElement;
  return Number.parseFloat(getComputedStyle(probe).lineHeight);
};

/** Half a row down is half the cell, at every density the matrix walks. */
export const HalfSteps: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    const flowEl = canvasElement.querySelector<HTMLElement>('[data-testid="flow"]');
    if (!flowEl) throw new Error('no flow');
    const style = getComputedStyle(flowEl);
    const row = cell(flowEl);
    const step = Number.parseFloat(style.getPropertyValue('--rk-step-y')) || row / 2;
    expect(Math.abs(step - row / 2)).toBeLessThan(0.01);
    // Comfortable is the default (0311): a gap of three half-steps.
    expect(style.getPropertyValue('--rk-rhythm-gap').trim()).toBe(String(rhythm.comfortable.gap));
  },
};

/**
 * Two one-row blocks a row and a half apart are three and a half rows; the
 * flow's seam closes them to four, so the block after it starts on a whole row
 * and the rhythm never leaks past the seam.
 */
export const SeamClosesTheFlow: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    const flowEl = canvasElement.querySelector<HTMLElement>('[data-testid="flow"]');
    const after = canvasElement.querySelector<HTMLElement>('[data-testid="after"]');
    if (!flowEl || !after) throw new Error('no flow');
    const row = cell(flowEl);
    const expected = flow([2, 2], rhythm.comfortable.gap).rows;
    await waitFor(() =>
      expect(Math.round(flowEl.getBoundingClientRect().height / row)).toBe(expected),
    );
    const height = flowEl.getBoundingClientRect().height / row;
    expect(Math.abs(height - expected)).toBeLessThan(1 / 32);
    const top = (after.getBoundingClientRect().top - flowEl.getBoundingClientRect().top) / row;
    expect(Math.abs(top - Math.round(top))).toBeLessThan(1 / 32);
  },
};

/**
 * At standard the second block rests on a half-step, inside the rhythm block:
 * no violation, and the audit names it. At strict the same half-step fails,
 * because strict is structure only.
 */
export const LevelsReadTheTiers: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    const flowEl = canvasElement.querySelector<HTMLElement>('[data-testid="flow"]');
    if (!flowEl) throw new Error('no flow');
    const row = cell(flowEl);
    await waitFor(() => expect(flowEl.getBoundingClientRect().height / row).toBeCloseTo(4, 1));
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="host"]');
    if (!host) throw new Error('no host');

    host.dataset.rkConformance = 'standard';
    const standard = checkConformance(host);
    expect(standard.violations, formatReport(standard)).toEqual([]);
    expect(standard.rhythm.length).toBeGreaterThan(0);

    host.dataset.rkConformance = 'strict';
    const strict = checkConformance(host);
    expect(strict.violations.length).toBeGreaterThan(0);
    delete host.dataset.rkConformance;
  },
};

/** Compact has no gap: the blocks stack on whole rows and nothing bends. */
export const Compact: Story = {
  args: { comfort: 'compact' },
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    const flowEl = canvasElement.querySelector<HTMLElement>('[data-testid="flow"]');
    if (!flowEl) throw new Error('no flow');
    const row = cell(flowEl);
    await waitFor(() => expect(flowEl.getBoundingClientRect().height / row).toBeCloseTo(2, 1));
    const report = checkConformance(canvasElement);
    expect(report.rhythm).toEqual([]);
  },
};
