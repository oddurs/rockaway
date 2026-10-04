// `@rockaway/react/keymap`, and the only list of what the keymap makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
// The engine is plain TypeScript, so a page with no React can import it from
// here and load no React: sideEffects is false, and nothing below it imports
// the components (cairn 0237).
export {
  type ActiveBinding,
  attachKeymap,
  type Binding,
  chordMatches,
  // The keyboard, for the engine's `setPlatform` and for drawing chords.
  detectPlatform,
  isControlKey,
  isEditable,
  type KeyEventSource,
  type KeymapConflict,
  KeymapEngine,
  type KeymapEngineOptions,
  type KeymapScope,
  type KeyStroke,
  keymapHelpBuffer,
  type Platform,
  type PlatformHints,
} from '../components/keymap.pure.ts';
export {
  Keymap,
  KeymapHelp,
  type KeymapHelpProps,
  type KeymapProps,
  type UseKeymapOptions,
  useActiveBindings,
  useKeymap,
} from '../components/keymap.tsx';
