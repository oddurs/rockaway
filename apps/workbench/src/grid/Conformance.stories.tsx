import { Buffer, drawBox, rect, type Size } from '@rockaway/grid';
import { checkConformance, expectConformance, formatReport, Screen } from '@rockaway/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

const draw = ({ width, height }: Size): Buffer =>
  Buffer.create({ width, height }).draw((d) => {
    if (width >= 2 && height >= 2) drawBox(d, rect(0, 0, width, height));
  });

const onGrid = {
  position: 'absolute' as const,
  left: 'calc(var(--rk-cell-width) * 2)',
  top: 'calc(var(--rk-cell-height) * 2)',
  width: 'calc(var(--rk-cell-width) * 10)',
  height: 'var(--rk-cell-height)',
};

function Conforming() {
  return (
    <div data-testid="host">
      <Screen draw={draw} cols={24} rows={6}>
        <div style={onGrid}>on the grid</div>
      </Screen>
    </div>
  );
}

function Offending() {
  return (
    <div data-testid="host">
      <Screen draw={draw} cols={24} rows={6}>
        <div style={{ ...onGrid, width: '37.5px' }}>off by a half</div>
      </Screen>
    </div>
  );
}

function Declared() {
  return (
    <div data-testid="host">
      <Screen draw={draw} cols={24} rows={6} style={{ width: '100%', height: '100%' }}>
        <div
          data-rk-offgrid="the logo is 37px and the brand team won"
          style={{ ...onGrid, width: '37.5px' }}
        >
          declared
        </div>
      </Screen>
    </div>
  );
}

const meta = { title: 'Grid/Conformance', component: Conforming } satisfies Meta<typeof Conforming>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTheGrid: Story = {
  name: 'On the grid',
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('host').firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());
    const report = expectConformance(screen);
    expect(report.violations).toEqual([]);
    expect(report.checked).toBeGreaterThan(0);
  },
};

export const OffTheGrid: Story = {
  name: 'Off the grid, undeclared',
  // The failure case on purpose, so the check that runs after every story is
  // told to leave this one alone.
  parameters: { conformance: false },
  render: () => <Offending />,
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('host').firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());

    const report = checkConformance(screen);
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.violations[0]?.what).toBe('width');
    expect(formatReport(report)).toContain('off the grid');
    expect(() => expectConformance(screen)).toThrow(/off the grid/);
  },
};

export const DeclaredException: Story = {
  name: 'Off the grid, declared',
  render: () => <Declared />,
  play: async ({ canvas }) => {
    const screen = canvas.getByTestId('host').firstElementChild as HTMLElement;
    await waitFor(() => expect(screen.querySelector('.rk-row')).not.toBeNull());

    const report = expectConformance(screen);
    expect(report.violations).toEqual([]);
    expect(report.exceptions).toHaveLength(1);
    expect(report.exceptions[0]?.reason).toBe('the logo is 37px and the brand team won');
    expect(formatReport(report)).toContain('1 declared exception(s)');
  },
};
