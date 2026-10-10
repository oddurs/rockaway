'use client';

/**
 * The shell's toolbar (cairn 0324, decision 0311): the system's Toolbar along
 * the top of the screen, and in it the look as a sectioned dropdown, theme,
 * mode and density each a section of one comfortable Menu, beside the copy
 * and the keys.
 *
 * It is a part of the page like an example: rendered on the server, so the
 * bar is drawn in the first frame with no script, and made live when the
 * browser is idle or the reader reaches for it, so its React Aria is never in
 * the first load. What its commands do, the shell's extras do; the bar only
 * asks, with an event, so there is one look and one copy however they are
 * reached.
 */
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  OverlayLayer,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from '@rockaway/react';
import { type ReactNode, useEffect, useState } from 'react';
import { DENSITIES, type Look, MODES, readLook, STORAGE_KEY } from '../../lib/look.ts';

/** Every theme, as the head's script left them; the site's own on the server. */
function themes(): readonly string[] {
  return (globalThis as { rockawayThemeNames?: string[] }).rockawayThemeNames ?? ['sunset'];
}

function stored(): Look {
  try {
    return readLook(localStorage.getItem(STORAGE_KEY), themes());
  } catch {
    return readLook(null, themes());
  }
}

/** Ask the shell to do something: its extras listen. */
const ask = (name: string, detail?: unknown): void => {
  document.dispatchEvent(new CustomEvent(name, { detail }));
};

export function ShellToolbar(): ReactNode {
  const [look, setLook] = useState<Look | undefined>(undefined);
  useEffect(() => {
    setLook(stored());
    const changed = (event: Event): void => {
      if (event instanceof CustomEvent) setLook(event.detail as Look);
    };
    document.addEventListener('rk:look', changed);
    return () => document.removeEventListener('rk:look', changed);
  }, []);
  const section = (part: keyof Look, values: readonly string[], title: string) => (
    <MenuSection
      title={title}
      selectionMode="single"
      selectedKeys={look ? [`${part}:${look[part]}`] : []}
    >
      {values.map((value) => (
        <MenuItem key={value} id={`${part}:${value}`}>
          {value}
        </MenuItem>
      ))}
    </MenuSection>
  );
  return (
    <OverlayLayer>
      <Toolbar label="Screen">
        <ToolbarGroup label="Look">
          <MenuTrigger>
            <ToolbarButton>Look</ToolbarButton>
            <Menu
              aria-label="Look"
              comfort="comfortable"
              onAction={(key) => {
                const [part, value] = String(key).split(':');
                if (part && value) ask('rk:look-set', { part, value });
              }}
            >
              {section('theme', themes(), 'Theme')}
              {section('mode', MODES, 'Mode')}
              {section('density', DENSITIES, 'Density')}
            </Menu>
          </MenuTrigger>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup label="Screen">
          <ToolbarButton onPress={() => ask('rk:copy', 'text')}>Copy</ToolbarButton>
          <ToolbarButton onPress={() => ask('rk:copy', 'ANSI')}>ANSI</ToolbarButton>
          <ToolbarButton onPress={() => ask('rk:help')}>Keys</ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    </OverlayLayer>
  );
}
