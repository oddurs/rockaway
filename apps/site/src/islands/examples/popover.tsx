import { Button, Frame, Popover, Screen } from '@rockaway/react';
import { GlyphProvider, glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { DialogTrigger } from 'react-aria-components';
import { useState } from 'react';

export default function PopoverExample() {
  const [theme] = useState('light');
  const glyphs = glyphsFor(theme);

  return (
    <GlyphProvider glyphs={glyphs}>
      <Screen cols={40} rows={15} theme={theme}>
        <Frame title="Options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', padding: '1em' }}>
            <DialogTrigger>
              <Button>Open popover</Button>
              <Popover aria-label="Options">
                <div style={{ padding: '1em' }}>
                  <p>This is a popover.</p>
                  <Button>Action</Button>
                </div>
              </Popover>
            </DialogTrigger>
          </div>
        </Frame>
      </Screen>
    </GlyphProvider>
  );
}
