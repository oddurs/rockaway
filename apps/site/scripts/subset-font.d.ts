// subset-font ships no types; this is the part of its API the font script uses.
declare module 'subset-font' {
  interface SubsetOptions {
    targetFormat?: 'sfnt' | 'woff' | 'woff2';
    preserveNameIds?: number[];
    keepFeatures?: string[];
    variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
    noLayoutClosure?: boolean;
  }
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: SubsetOptions,
  ): Promise<Buffer>;
}
