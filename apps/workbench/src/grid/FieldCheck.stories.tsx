import {
  Description,
  FieldError,
  FieldFrame,
  Form,
  Frame,
  fieldClass,
  Label,
} from '@rockaway/react';
import { checkField, expectField, formatFields } from '@rockaway/react/testing';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { Input, TextArea, TextField } from 'react-aria-components';
import { expect } from 'storybook/test';
import { measured } from '../settled.ts';

/*
 * checkField (cairn 0203): the field contract, read back off the page. Every
 * story with a field runs it after it plays (see `.storybook/preview.tsx`);
 * these show what it catches. Each broken one turns the check that runs
 * after every story off, and runs it itself.
 */

const box: CSSProperties = {
  inlineSize: 'calc(16 * var(--rk-cell-width))',
  blockSize: 'var(--rk-cell-height)',
  padding: 0,
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  background: 'var(--rk-bg-subtle)',
};

function Page({ children }: { children: ReactNode }): ReactNode {
  return (
    <Frame title="fields" cols={48} rows={8}>
      <Form>{children}</Form>
    </Frame>
  );
}

/** What the check says about the one field on the page, problem by problem. */
function problemsIn(root: HTMLElement): string[] {
  return checkField(root).problems.map((p) => p.problem);
}

const meta = {
  title: 'Grid/Field check',
  component: Page,
  args: { children: null },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A field built as the recipe says passes, and says how many it read. */
export const Passes: Story = {
  render: () => (
    <Page>
      <TextField className={fieldClass()} isRequired>
        {({ isRequired }) => (
          <>
            <Label isRequired={isRequired}>Email</Label>
            <Input style={box} />
            <Description>Where the receipts go.</Description>
            <FieldError />
          </>
        )}
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    const report = expectField(canvasElement);
    expect(report.fields).toBe(1);
    expect(report.problems).toEqual([]);
  },
};

/** The footgun: a required field whose label was never told. */
export const ForgotIsRequired: Story = {
  name: 'Catches a forgotten isRequired',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()} isRequired>
        <Label>Email</Label>
        <Input style={box} />
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual([
      'it is required and its label draws no mark: pass the field’s isRequired to Label',
    ]);
    expect(() => expectField(canvasElement)).toThrow(/field contract is broken/);
    expect(formatFields(checkField(canvasElement))).toContain('div.rk-field[Email]');
  },
};

/** The other way round: a mark on a field nothing marks as required. */
export const MarkWithoutRequired: Story = {
  name: 'Catches a mark on a field that is not required',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()}>
        <Label isRequired>Email</Label>
        <Input style={box} />
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual([
      'its label draws the required mark, and the field is not required',
    ]);
  },
};

/** A framed control's mark is in its edge, and is checked there. */
export const FrameForgotIsRequired: Story = {
  name: 'Catches a frame with no mark in its edge',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()} isRequired>
        <FieldFrame label="Message">
          <TextArea
            rows={1}
            className="rk-scroll"
            style={{ ...box, inlineSize: '100%', display: 'block' }}
          />
        </FieldFrame>
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    await measured(canvasElement);
    expect(problemsIn(canvasElement)).toEqual([
      'it is required and its frame draws no mark after the label: pass isRequired to FieldFrame or Fieldset',
    ]);
  },
};

/** Help that is on the page and not in the control's description is help nobody hears. */
export const UnlinkedDescription: Story = {
  name: 'Catches a description nobody hears',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()}>
        <Label>Email</Label>
        <Input style={box} />
        {/* Help written as a plain span with the part's class, outside React Aria's slot. */}
        <span className="rk-description">Where the receipts go.</span>
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual([
      'its description "Where the receipts go." is in no control\'s aria-describedby',
    ]);
  },
};

/** A glyph in a label is chrome in a name. */
export const GlyphInName: Story = {
  name: 'Catches a glyph in a name',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()}>
        <Label>{'▸ Email'}</Label>
        <Input style={box} />
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    expect(problemsIn(canvasElement)).toEqual(['the name "▸ Email" holds ▸, which is chrome']);
  },
};

/** An error in a live region would be said twice: once there, once where focus lands. */
export const LiveRegion: Story = {
  name: 'Catches a live region',
  parameters: { fields: false },
  render: () => (
    <Page>
      <TextField className={fieldClass()} isInvalid>
        <Label>Email</Label>
        <Input style={box} />
        <div aria-live="polite">
          <FieldError>Enter an email address.</FieldError>
        </div>
      </TextField>
    </Page>
  ),
  play: async ({ canvasElement }) => {
    const problems = problemsIn(canvasElement);
    expect(problems).toContain(
      'div is a live region: a failed submit moves focus here, and the error would be said twice',
    );
  },
};
