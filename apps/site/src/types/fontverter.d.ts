// fontverter ships no types. The one function the cards use (cairn 0150).
declare module 'fontverter' {
  export function convert(
    font: Uint8Array,
    to: 'sfnt' | 'truetype' | 'woff' | 'woff2',
    from?: string,
  ): Promise<Uint8Array>;
}
