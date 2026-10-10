import type { UserConfig } from 'tsdown';

const config: UserConfig = {
  // The library, and the command an MCP client starts.
  entry: { index: 'src/index.ts', bin: 'src/bin.ts' },
  format: 'esm',
  platform: 'node',
  // `.js`, as every package here: the package is ESM, so it means a module.
  fixedExtension: false,
  // isolatedDeclarations is on, so Oxc can emit declarations without the checker.
  dts: { generator: 'oxc' },
  sourcemap: true,
};

export default config;
