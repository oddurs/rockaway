/** fontverter publishes no types: the one call the cards make. */
declare module 'fontverter' {
  export function convert(
    font: Buffer,
    to: 'sfnt' | 'woff' | 'woff2' | 'truetype',
    from?: string,
  ): Promise<Buffer>;
}
