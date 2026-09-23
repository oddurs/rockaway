/**
 * The snapshot serializer (cairn 0083).
 *
 * Registered with `expect.addSnapshotSerializer`, a buffer prints as the
 * screen it draws, framed so the width is visible and trailing space cannot
 * hide. A changed snapshot then reads like the UI changed, which is the whole
 * point of building on a grid.
 */
import { Buffer } from './buffer.ts';
import { toText } from './paint/text.ts';

export interface SnapshotSerializer {
  test(value: unknown): boolean;
  serialize(value: unknown): string;
}

/** `expect.addSnapshotSerializer(bufferSerializer)`. */
export const bufferSerializer: SnapshotSerializer = {
  test: (value: unknown): boolean => value instanceof Buffer,
  serialize: (value: unknown): string => frame(value as Buffer),
};

/** A buffer with a ruled edge, so the width and any trailing space are visible. */
export function frame(buffer: Buffer): string {
  const lines = toText(buffer, { trimEnd: false }).split('\n');
  const top = `┌${'─'.repeat(buffer.width)}┐`;
  const body = lines.map((line) => `│${line}│`);
  const foot = `└${'─'.repeat(buffer.width)}┘ ${buffer.width}×${buffer.height}`;
  return [top, ...body, foot].join('\n');
}
