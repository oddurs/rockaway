/**
 * The site's font, for the cards the build draws (cairn 0150): inlined by the
 * build, so its bytes are here wherever the build put this module.
 */
import fontData from '../fonts/jetbrains-mono.woff2?inline';
import { useFont } from './card.ts';

useFont(Buffer.from(fontData.slice(fontData.indexOf(',') + 1), 'base64'));

export * from './card.ts';
