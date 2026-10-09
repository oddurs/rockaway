import { Button, Link } from '@rockaway/react';
import { checkNames, expectNames } from '@rockaway/react/testing';
import { glyphsFor } from '@rockaway/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect } from 'storybook/test';

/*
 * checkNames (cairn 0252): no accessible name holds a glyph. Every story runs
 * it after it plays (see `.storybook/preview.tsx`), beside checkField, which
 * holds a field's names; these show what it catches. Each broken one turns
 * the check that runs after every story off, and runs it itself.
 */

function Row({ children }: { children: ReactNode }): ReactNode {
  return <div style={{ display: 'flex', gap: '2ch', alignItems: 'baseline' }}>{children}</div>;
}

const meta = {
  title: 'Grid/Name check',
  component: Row,
  args: { children: null },
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What the check says about the page, problem by problem. */
function problemsIn(root: HTMLElement): string[] {
  return checkNames(root).problems.map((p) => `${p.name} holds ${p.glyphs}`);
}

/**
 * The system's own controls pass: a link to a new tab draws `↗` and says
 * "opens in a new tab", and prose punctuation is words, not chrome.
 */
export const Passes: Story = {
  render: () => (
    <Row>
      <Button>Save as…</Button>
      <Link href="#names" target="_blank">
        the docs
      </Link>
      <button type="button" aria-label="Pages 1–10">
        <span aria-hidden="true">▸</span> next
      </button>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const report = expectNames(canvasElement);
    expect(report.named).toBeGreaterThanOrEqual(3);
    expect(report.problems).toEqual([]);
  },
};

/** A mark drawn into the words instead of beside them, unhidden. */
export const MarkInTheName: Story = {
  name: 'A mark in the name',
  parameters: { names: false },
  render: () => (
    <Row>
      <button type="button">▸ next</button>
      <a href="#names">
        the docs <span>↗</span>
      </a>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual(['▸ next holds ▸', 'the docs ↗ holds ↗']);
  },
};

/** A frame's line or a block in a label, by any route a name is given. */
export const ChromeByLabel: Story = {
  name: 'Chrome in a label',
  parameters: { names: false },
  render: () => (
    <Row>
      <span id="names-heading">┌ files ┐</span>
      <section aria-labelledby="names-heading">files</section>
      <button type="button" aria-label="█ loading" />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual(['┌ files ┐ holds ┌┐', '█ loading holds █']);
  },
};

/**
 * A theme's marks are chrome in that theme, whatever block they live in: `↗`
 * is an arrow, in none of the ranges, and caught as the default theme's
 * external mark. Under the ASCII theme the mark is `^`, and `↗` is no mark.
 * The run checks with the theme the toolbar shows.
 */
export const ThemeMarks: Story = {
  name: "The theme's marks",
  parameters: { names: false },
  render: () => (
    <Row>
      <button type="button">docs ↗</button>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const unicode = checkNames(canvasElement, { glyphs: glyphsFor({ borderSet: 'single' }) });
    expect(unicode.problems.map((p) => p.glyphs)).toEqual(['↗']);
    const ascii = checkNames(canvasElement, { glyphs: glyphsFor({ borderSet: 'ascii' }) });
    expect(ascii.problems).toEqual([]);
  },
};
