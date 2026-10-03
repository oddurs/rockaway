// `@rockaway/react/code-block`, and the only list of what the component makes public (cairn 0165).

// The pure half: no client boundary, so a server can call these (cairn 0126).
export {
  type CodeBlockLayout,
  type CodeBlockOptions,
  type CodeLine,
  type CodeToken,
  codeBlockBuffer,
  codeBlockText,
  layoutCodeBlock,
  snapshotBuffer,
} from '../components/code-block.pure.ts';
export {
  CodeBlock,
  type CodeBlockProps,
  CodeSnapshot,
  type CodeSnapshotProps,
} from '../components/code-block.tsx';
