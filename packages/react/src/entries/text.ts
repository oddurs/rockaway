// `@rockaway/react/text`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type TextMetrics,
  type TextSize,
  textBuffer,
  textCols,
  textScale,
  textSizes,
} from '../components/text.pure.ts';
export { Text, type TextElement, type TextProps } from '../components/text.tsx';
