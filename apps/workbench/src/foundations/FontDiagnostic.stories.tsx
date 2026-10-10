import type { Meta, StoryObj } from '@storybook/react-vite';

// TEMPORARY (cairn 0295): prints what each glyph measures on CI.
function Probe() {
  return <div id="probe" style={{ fontFamily: 'var(--rk-font-family-mono)', fontSize: '1rem' }} />;
}

const meta = { title: 'Foundations/FontDiagnostic', component: Probe } satisfies Meta<typeof Probe>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Measure: Story = {
  play: async ({ canvasElement }) => {
    const probe = canvasElement.querySelector('#probe') as HTMLElement;
    const lines: string[] = [];
    lines.push(`ua=${navigator.userAgent}`);
    lines.push(`family=${getComputedStyle(probe).fontFamily}`);
    const faces: string[] = [];
    for (const f of document.fonts) faces.push(`${f.family}/${f.weight}/${f.style}/${f.status}`);
    lines.push(`faces=${faces.join(' | ')}`);
    const width = (text: string, extra = ''): number => {
      const s = document.createElement('span');
      s.style.cssText = `white-space:pre;${extra}`;
      s.textContent = text.repeat(10);
      probe.append(s);
      const w = s.getBoundingClientRect().width / 10;
      s.remove();
      return w;
    };
    const ch = document.createElement('span');
    ch.style.cssText = 'display:inline-block;inline-size:1ch';
    probe.append(ch);
    lines.push(`1ch=${ch.getBoundingClientRect().width}`);
    for (const c of ['0', 'a', 'W', ' ', '✓', '⌘', '●', '▸', '↗', '⏎', '─']) {
      lines.push(
        `${c}: 400=${width(c)} 700=${width(c, 'font-weight:700')} it=${width(c, 'font-style:italic')} mono=${width(c, 'font-family:monospace')}`,
      );
    }
    throw new Error(`FONTDIAG\n${lines.join('\n')}`);
  },
};
