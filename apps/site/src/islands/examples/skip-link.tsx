import { Frame, Screen, SkipLink } from '@rockaway/react';
import { GlyphProvider, glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { useState } from 'react';

export default function SkipLinkExample() {
  const [theme] = useState('light');
  const glyphs = glyphsFor(theme);

  return (
    <GlyphProvider glyphs={glyphs}>
      <Screen cols={40} rows={12} theme={theme}>
        <SkipLink href="#content">Skip to content</SkipLink>
        <Frame title="Header">
          <div style={{ padding: '1em' }}>Header content</div>
        </Frame>
        <Frame title="Content" id="content">
          <div style={{ padding: '1em' }}>Main content goes here.</div>
        </Frame>
      </Screen>
    </GlyphProvider>
  );
}
