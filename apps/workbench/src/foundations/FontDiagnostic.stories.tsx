import type { Meta, StoryObj } from '@storybook/react-vite';

// TEMPORARY (cairn 0295): prints what the cell measures on CI.
function Probe() {
  return <div id="probe" />;
}

const meta = { title: 'Foundations/FontDiagnostic', component: Probe } satisfies Meta<typeof Probe>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Measure: Story = {
  play: async ({ canvasElement }) => {
    const probe = canvasElement.querySelector('#probe') as HTMLElement;
    await document.fonts.load('1em "IBM Plex Mono"', '0✓⌘');
    const lines: string[] = [];
    lines.push(`ua=${navigator.userAgent}`);
    lines.push(`text-rendering=${getComputedStyle(probe).textRendering}`);
    for (const n of [1, 10, 40, 50, 120]) {
      const box = document.createElement('div');
      box.style.cssText = `inline-size:${n}ch;block-size:1px`;
      probe.append(box);
      const span = document.createElement('span');
      span.style.cssText = 'white-space:pre;position:absolute;visibility:hidden';
      span.textContent = '0'.repeat(n);
      probe.append(span);
      lines.push(
        `${n}: ch box=${box.getBoundingClientRect().width} text=${span.getBoundingClientRect().width}`,
      );
      box.remove();
      span.remove();
    }
    for (const c of ['✓', '⌘', '●', 'a']) {
      const span = document.createElement('span');
      span.style.cssText = 'white-space:pre;position:absolute;visibility:hidden';
      span.textContent = c.repeat(50);
      probe.append(span);
      lines.push(`${c} x50 = ${span.getBoundingClientRect().width}`);
      span.remove();
    }
    throw new Error(`FONTDIAG\n${lines.join('\n')}`);
  },
};
