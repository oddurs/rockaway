import type { Meta, StoryObj } from '@storybook/react-vite';
import a from '../fonts/diag/diag-a.woff2?url';
import c from '../fonts/diag/diag-c.woff2?url';
import d from '../fonts/diag/diag-d.woff2?url';
import g from '../fonts/diag/diag-g.woff2?url';

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
    const candidates: Record<string, string> = { A: a, C: c, D: d, G: g };
    for (const [name, url] of Object.entries(candidates)) {
      const face = new FontFace(`Diag${name}`, `url(${url})`);
      await face.load();
      document.fonts.add(face);
    }
    await document.fonts.load('1em "IBM Plex Mono"', '0✓⌘');
    const width = (text: string, css: string): number => {
      const s = document.createElement('span');
      s.style.cssText = `white-space:pre;${css}`;
      s.textContent = text.repeat(10);
      probe.append(s);
      const w = s.getBoundingClientRect().width / 10;
      s.remove();
      return w;
    };
    const sample = ['✓', '⌘', '●', '▸'];
    const row = (label: string, css: string, chars = sample): void => {
      lines.push(`${label}: ${chars.map((ch) => `${ch}=${width(ch, css)}`).join(' ')}`);
    };
    row('plex-0 default', 'font-family:"IBM Plex Mono"', ['0', 'a']);
    row('plex-0 geometric', 'font-family:"IBM Plex Mono";text-rendering:geometricPrecision', [
      '0',
      'a',
    ]);
    row('current symbols default', 'font-family:"IBM Plex Mono"');
    row(
      'current symbols geometric',
      'font-family:"IBM Plex Mono";text-rendering:geometricPrecision',
    );
    for (const name of Object.keys(candidates)) {
      row(`cand ${name} default`, `font-family:Diag${name}`);
      row(`cand ${name} geometric`, `font-family:Diag${name};text-rendering:geometricPrecision`);
    }
    throw new Error(`FONTDIAG\n${lines.join('\n')}`);
  },
};
